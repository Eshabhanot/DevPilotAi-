package com.devpilot.orchestrator.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import com.devpilot.orchestrator.config.OrchestratorProperties;
import com.devpilot.orchestrator.config.WorkspaceClientProperties;
import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.WorkspaceFileChange;
import com.devpilot.orchestrator.dto.WorkspaceFileContents;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.springframework.stereotype.Component;

@Component
public class SafeMcpWorkspaceClient implements McpWorkspaceClient {

    private static final int MAX_RESULTS = 12;
    private static final int MAX_FILE_BYTES = 200_000;
    private static final int MAX_TEST_OUTPUT_CHARACTERS = 32_000;
    private static final Pattern SENSITIVE_TEST_OUTPUT = Pattern.compile(
            "(?im)(\\b(?:password|secret|credential|api[-_.]?key|access[-_.]?token)"
                    + "[a-z0-9_.-]*\\b\\s*[:=]\\s*)([^\\s,;]+)");
    private static final Set<String> SKIPPED_DIRECTORIES = Set.of(
            ".git",
            ".idea",
            ".mvn",
            "build",
            "dist",
            "node_modules",
            "out",
            "target");

    private final OrchestratorProperties properties;
    private final WorkspaceClientProperties workspaceProperties;

    public SafeMcpWorkspaceClient(
            OrchestratorProperties properties,
            WorkspaceClientProperties workspaceProperties) {
        this.properties = properties;
        this.workspaceProperties = workspaceProperties;
    }

    @Override
    public WorkspaceFileContents readWorkspaceFile(
            String workspaceId,
            String path) {

        Path workspace = validateWorkspace(workspaceId);
        Path file = resolveReadableFile(workspace, path);
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            boolean truncated = content.length() > MAX_FILE_BYTES;
            return new WorkspaceFileContents(
                    workspace.relativize(file).toString().replace('\\', '/'),
                    truncated ? content.substring(0, MAX_FILE_BYTES) : content,
                    truncated);
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace file could not be read safely.", exception);
        }
    }

    @Override
    public WorkspaceFileChange createWorkspaceFile(
            String workspaceId,
            String path,
            String content) {

        Path workspace = validateWorkspace(workspaceId);
        Path file = resolveEditableFile(workspace, path, false);
        validateContent(content);
        if (Files.exists(file)) {
            throw new WorkspaceInspectionException(
                    "Workspace file already exists; use updateWorkspaceFile.", null);
        }
        try {
            Files.writeString(file, content, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE_NEW);
            return new WorkspaceFileChange(
                    workspace.relativize(file).toString().replace('\\', '/'),
                    true,
                    null);
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace file could not be created safely.", exception);
        }
    }

    @Override
    public WorkspaceFileChange updateWorkspaceFile(
            String workspaceId,
            String path,
            String content) {

        Path workspace = validateWorkspace(workspaceId);
        Path file = resolveEditableFile(workspace, path, true);
        validateContent(content);
        try {
            String previousContent = Files.readString(file, StandardCharsets.UTF_8);
            Path backup = backup(workspace, file, previousContent);
            Path temporary = Files.createTempFile(file.getParent(),
                    ".devpilot-", ".tmp");
            try {
                Files.writeString(temporary, content, StandardCharsets.UTF_8);
                try {
                    Files.move(temporary, file,
                            StandardCopyOption.REPLACE_EXISTING,
                            StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException exception) {
                    Files.move(temporary, file,
                            StandardCopyOption.REPLACE_EXISTING);
                }
            } finally {
                Files.deleteIfExists(temporary);
            }
            return new WorkspaceFileChange(
                    workspace.relativize(file).toString().replace('\\', '/'),
                    false,
                    workspace.relativize(backup).toString().replace('\\', '/'));
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace file could not be updated safely.", exception);
        }
    }

    @Override
    public List<WorkspaceFileEvidence> searchRelevantFiles(
            String workspaceId,
            List<String> searchTerms) {

        Path workspace = validateWorkspace(workspaceId);
        List<String> normalizedTerms = normalizeTerms(searchTerms);
        List<WorkspaceFileEvidence> matches = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(workspace)) {
            paths.filter(path -> shouldInspect(workspace, path))
                    .sorted(Comparator.comparing(Path::toString))
                    .forEach(path -> maybeAddMatch(
                            workspace,
                            path,
                            normalizedTerms,
                            matches));
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace files could not be inspected safely.",
                    exception);
        }

        return matches.stream()
                .limit(MAX_RESULTS)
                .toList();
    }

    @Override
    public ApprovedTestExecution runApprovedTests(String workspaceId) {
        Path workspace = validateWorkspace(workspaceId);
        List<String> command = mavenCommand(workspace);
        Instant startedAt = Instant.now();
        Process process;

        try {
            process = new ProcessBuilder(command)
                    .directory(workspace.toFile())
                    .redirectErrorStream(true)
                    .start();
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Unable to start approved Maven test command: "
                            + safeExceptionMessage(exception),
                    exception);
        }

        CompletableFuture<BoundedOutput> output = CompletableFuture.supplyAsync(
                () -> readBoundedOutput(process.getInputStream()));
        boolean timedOut;
        BoundedOutput capturedOutput;
        try {
            timedOut = !process.waitFor(
                    properties.testTimeout().toMillis(),
                    TimeUnit.MILLISECONDS);
            if (timedOut) {
                process.destroy();
                if (!process.waitFor(3, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            }
            capturedOutput = output.get();
            int exitCode = process.isAlive() ? -1 : process.exitValue();

            return new ApprovedTestExecution(
                    String.join(" ", command),
                    exitCode,
                    timedOut,
                    Duration.between(startedAt, Instant.now()),
                    capturedOutput.text(),
                    capturedOutput.truncated());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
            throw new WorkspaceInspectionException(
                    "Approved Maven test command was interrupted.", exception);
        } catch (ExecutionException exception) {
            throw new WorkspaceInspectionException(
                    "Unable to capture approved Maven test output.",
                    exception.getCause());
        }
    }

    private Path validateWorkspace(String workspaceId) {
        try {
            Path permittedRoot = workspaceProperties.workspaceRoot()
                    .toRealPath();
            Path workspace = Path.of(workspaceId)
                    .toRealPath();

            if (!Files.isDirectory(workspace) || !workspace.startsWith(permittedRoot)) {
                throw new WorkspaceInspectionException(
                        "Workspace ID is outside the permitted workspace root.",
                        null);
            }

            return workspace;
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace ID does not resolve to a readable directory.",
                    exception);
        } catch (RuntimeException exception) {
            if (exception instanceof WorkspaceInspectionException) {
                throw exception;
            }

            throw new WorkspaceInspectionException(
                    "Workspace ID is not a valid filesystem path.",
                    exception);
        }
    }

    private Path resolveReadableFile(Path workspace, String path) {
        Path file = resolveRelativePath(workspace, path);
        if (!Files.isRegularFile(file) || Files.isSymbolicLink(file)) {
            throw new WorkspaceInspectionException(
                    "Requested workspace path must be an existing regular file.", null);
        }
        validatePermittedPath(workspace, file, false);
        try {
            if (Files.size(file) > MAX_FILE_BYTES) {
                throw new WorkspaceInspectionException(
                        "Requested workspace file exceeds the size limit.", null);
            }
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Workspace file could not be inspected safely.", exception);
        }
        return file;
    }

    private Path resolveEditableFile(
            Path workspace,
            String path,
            boolean mustExist) {

        Path file = resolveRelativePath(workspace, path);
        if (file.getParent() == null || !Files.isDirectory(file.getParent())) {
            throw new WorkspaceInspectionException(
                    "Workspace file parent directory does not exist.", null);
        }
        if (mustExist && (!Files.isRegularFile(file) || Files.isSymbolicLink(file))) {
            throw new WorkspaceInspectionException(
                    "Requested workspace file does not exist.", null);
        }
        validatePermittedPath(workspace, file, true);
        return file;
    }

    private Path resolveRelativePath(Path workspace, String path) {
        if (path == null || path.isBlank() || path.length() > 300) {
            throw new WorkspaceInspectionException(
                    "Workspace path must be a non-blank relative path up to 300 characters.",
                    null);
        }
        Path requested = Path.of(path);
        if (requested.isAbsolute()) {
            throw new WorkspaceInspectionException(
                    "Absolute workspace paths are not permitted.", null);
        }
        Path file = workspace.resolve(requested).normalize();
        if (!file.startsWith(workspace)) {
            throw new WorkspaceInspectionException(
                    "Workspace path escapes the permitted workspace root.", null);
        }
        return file;
    }

    private void validatePermittedPath(
            Path workspace,
            Path file,
            boolean editable) {

        Path relative = workspace.relativize(file);
        for (Path segment : relative) {
            if (SKIPPED_DIRECTORIES.contains(segment.toString().toLowerCase(Locale.ROOT))
                    || ".devpilot-backups".equalsIgnoreCase(segment.toString())) {
                throw new WorkspaceInspectionException(
                        "Workspace path is in a restricted directory.", null);
            }
        }
        String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.equals(".env") || name.startsWith(".env.")
                || name.contains("secret") || name.contains("credential")
                || name.contains("password") || name.endsWith(".pem")
                || name.endsWith(".key") || name.endsWith(".p12")) {
            throw new WorkspaceInspectionException(
                    "Workspace path is restricted because it may contain credentials.", null);
        }
        if (!isLikelyText(file)) {
            throw new WorkspaceInspectionException(
                    "Workspace path is not an approved text file type.", null);
        }
        if (editable && !(relative.startsWith(Path.of("src"))
                || relative.startsWith(Path.of("docs"))
                || relative.equals(Path.of("README.md")))) {
            throw new WorkspaceInspectionException(
                    "Workspace edits are limited to src, docs, and README.md.", null);
        }
    }

    private void validateContent(String content) {
        if (content == null || content.isBlank() || content.length() > MAX_FILE_BYTES) {
            throw new WorkspaceInspectionException(
                    "Workspace content must be non-blank and within the size limit.", null);
        }
        if (content.matches("(?is).*^\\s*[\\\"']?(?:[a-z0-9_.-]*?(?:password|secret|credential|api[-_.]?key|access[-_.]?token)[a-z0-9_.-]*)[\\\"']?\\s*[:=].*$")) {
            throw new WorkspaceInspectionException(
                    "Workspace content appears to contain a secret or credential.", null);
        }
    }

    private Path backup(Path workspace, Path file, String content) throws IOException {
        Path backupRoot = workspace.resolve(".devpilot-backups")
                .resolve(Long.toString(Instant.now().toEpochMilli()));
        Path backup = backupRoot.resolve(workspace.relativize(file)).normalize();
        if (!backup.startsWith(backupRoot)) {
            throw new WorkspaceInspectionException(
                    "Workspace backup path could not be resolved safely.", null);
        }
        Files.createDirectories(backup.getParent());
        Files.writeString(backup, content, StandardCharsets.UTF_8);
        return backup;
    }

    private List<String> normalizeTerms(List<String> searchTerms) {
        if (searchTerms == null) {
            return List.of();
        }

        return searchTerms.stream()
                .filter(term -> term != null && !term.isBlank())
                .map(term -> term.toLowerCase(Locale.ROOT))
                .distinct()
                .limit(20)
                .toList();
    }

    private List<String> mavenCommand(Path workspace) {
        boolean windows = System.getProperty("os.name")
                .toLowerCase(Locale.ROOT)
                .contains("win");
        Path wrapper = workspace.resolve(windows ? "mvnw.cmd" : "mvnw");

        if (Files.isRegularFile(wrapper)) {
            return List.of(wrapper.toAbsolutePath().toString(), "test");
        }

        return List.of(windows ? "mvn.cmd" : "mvn", "test");
    }

    private BoundedOutput readBoundedOutput(InputStream inputStream) {
        try {
            return boundedOutput(inputStream);
        } catch (IOException exception) {
            throw new WorkspaceInspectionException(
                    "Unable to capture approved Maven test output.",
                    exception);
        }
    }

    private BoundedOutput boundedOutput(InputStream inputStream) throws IOException {
        try (inputStream;
                ByteArrayOutputStream captured = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            boolean truncated = false;

            while ((read = inputStream.read(buffer)) != -1) {
                int remaining = MAX_TEST_OUTPUT_CHARACTERS - captured.size();
                if (remaining > 0) {
                    captured.write(buffer, 0, Math.min(read, remaining));
                }
                truncated |= read > remaining;
            }

            return new BoundedOutput(
                    sanitizeTestOutput(captured.toString(StandardCharsets.UTF_8)),
                    truncated);
        }
    }

    private String sanitizeTestOutput(String output) {
        return SENSITIVE_TEST_OUTPUT.matcher(output).replaceAll("$1[REDACTED]");
    }

    private record BoundedOutput(String text, boolean truncated) {}

    private String safeExceptionMessage(Exception exception) {
        if (exception.getMessage() == null || exception.getMessage().isBlank()) {
            return exception.getClass().getSimpleName();
        }

        return exception.getMessage();
    }

    private boolean shouldInspect(Path workspace, Path path) {
        if (!Files.isRegularFile(path)) {
            return false;
        }

        if (hasSkippedDirectory(workspace, path)) {
            return false;
        }

        try {
            return Files.size(path) <= MAX_FILE_BYTES && isLikelyText(path);
        } catch (IOException exception) {
            return false;
        }
    }

    private boolean hasSkippedDirectory(Path workspace, Path path) {
        Path relative = workspace.relativize(path);

        for (Path segment : relative) {
            if (SKIPPED_DIRECTORIES.contains(segment.toString())) {
                return true;
            }
        }

        return false;
    }

    private boolean isLikelyText(Path path) {
        String filename = path.getFileName()
                .toString()
                .toLowerCase(Locale.ROOT);

        return filename.endsWith(".java")
                || filename.endsWith(".xml")
                || filename.endsWith(".yml")
                || filename.endsWith(".yaml")
                || filename.endsWith(".properties")
                || filename.endsWith(".md")
                || filename.endsWith(".json")
                || filename.endsWith(".sql")
                || filename.endsWith(".txt");
    }

    private void maybeAddMatch(
            Path workspace,
            Path path,
            List<String> searchTerms,
            List<WorkspaceFileEvidence> matches) {

        if (matches.size() >= MAX_RESULTS) {
            return;
        }

        String relativePath = workspace.relativize(path).toString();

        try {
            String content = Files.readString(path, StandardCharsets.UTF_8);
            String lowerContent = content.toLowerCase(Locale.ROOT);
            String lowerPath = relativePath.toLowerCase(Locale.ROOT);

            boolean pathMatch = searchTerms.stream().anyMatch(lowerPath::contains);
            boolean contentMatch = searchTerms.stream().anyMatch(lowerContent::contains);
            boolean structuralMatch = isStructuralFile(relativePath);

            if (!pathMatch && !contentMatch && !structuralMatch) {
                return;
            }

            matches.add(new WorkspaceFileEvidence(
                    relativePath,
                    classifyEvidence(relativePath),
                    snippetFor(content, searchTerms)));
        } catch (IOException | RuntimeException exception) {
            // Skip unreadable or non-UTF-8 files rather than failing research.
        }
    }

    private boolean isStructuralFile(String path) {
        String normalized = path.replace('\\', '/').toLowerCase(Locale.ROOT);

        return normalized.endsWith("pom.xml")
                || normalized.endsWith("application.yml")
                || normalized.endsWith("application.yaml")
                || normalized.contains("/src/test/");
    }

    private String classifyEvidence(String path) {
        String normalized = path.replace('\\', '/').toLowerCase(Locale.ROOT);

        if (normalized.contains("/src/test/")) {
            return "test";
        }

        if (normalized.endsWith("pom.xml")) {
            return "dependency";
        }

        if (normalized.endsWith("application.yml")
                || normalized.endsWith("application.yaml")
                || normalized.endsWith(".properties")) {
            return "configuration";
        }

        if (normalized.endsWith(".java")) {
            return "class";
        }

        return "file";
    }

    private String snippetFor(String content, List<String> searchTerms) {
        String[] lines = content.split("\\R");

        for (String term : searchTerms) {
            for (String line : lines) {
                if (line.toLowerCase(Locale.ROOT).contains(term)) {
                    return truncate(line.trim());
                }
            }
        }

        if (lines.length == 0) {
            return "";
        }

        return truncate(lines[0].trim());
    }

    private String truncate(String value) {
        if (value.length() <= 220) {
            return value;
        }

        return value.substring(0, 217) + "...";
    }
}
