package com.devpilot.mcp.service;

import com.devpilot.mcp.config.WorkspaceProperties;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class WorkspaceSafety {

    private static final Set<String> TEXT_EXTENSIONS = Set.of("java", "xml", "yml", "yaml", "properties", "md", "json", "txt");
    private static final Set<String> BLOCKED_DIRECTORIES = Set.of(".git", ".idea", ".mvn", "target", "build", "dist", "node_modules", "out", ".devpilot-backups");
    private static final Pattern SENSITIVE_CONTENT = Pattern.compile("(?im)^\\s*[\"']?(?:[a-z0-9_.-]*?(?:password|secret|credential|api[-_.]?key|access[-_.]?token)[a-z0-9_.-]*)[\"']?\\s*[:=]");

    private final WorkspaceProperties properties;
    private Path root;

    public WorkspaceSafety(WorkspaceProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void initialize() {
        try {
            root = properties.getRoot().toRealPath();
        } catch (IOException exception) {
            throw new IllegalStateException("Configured workspace root must be an existing readable directory", exception);
        }
        if (!Files.isDirectory(root)) {
            throw new IllegalStateException("Configured workspace root must be a directory");
        }
    }

    public Path root() {
        return root;
    }

    public Path resolveReadableFile(String requestedPath) {
        Path path = resolveExisting(requestedPath);
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) {
            throw new WorkspaceAccessException("Requested path must be a regular file");
        }
        validatePermittedPath(path, false);
        try {
            validateFileSize(path);
            validateNoSensitiveContents(path);
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to inspect requested file safely", exception);
        }
        return path;
    }

    public Path resolveEditableFile(String requestedPath, boolean mustExist) {
        Path requested = parseRelativePath(requestedPath);
        Path candidate = root.resolve(requested).normalize();
        if (!candidate.startsWith(root)) {
            throw new WorkspaceAccessException("Path escapes the configured workspace root");
        }
        try {
            Path parent = candidate.getParent();
            if (parent == null || !Files.exists(parent)) {
                throw new WorkspaceAccessException("Parent directory does not exist");
            }
            Path realParent = parent.toRealPath();
            if (!realParent.startsWith(root)) {
                throw new WorkspaceAccessException("Path resolves outside the configured workspace root");
            }
            Path result = realParent.resolve(candidate.getFileName()).normalize();
            if (!result.startsWith(root)) {
                throw new WorkspaceAccessException("Path escapes the configured workspace root");
            }
            if (mustExist && !Files.isRegularFile(result, LinkOption.NOFOLLOW_LINKS)) {
                throw new WorkspaceAccessException("Requested file does not exist");
            }
            if (Files.exists(result) && Files.isSymbolicLink(result)) {
                throw new WorkspaceAccessException("Symbolic links are not permitted");
            }
            validatePermittedPath(result, true);
            if (Files.exists(result)) {
                validateFileSize(result);
                validateNoSensitiveContents(result);
            }
            return result;
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to resolve requested path safely", exception);
        }
    }

    public Path resolveProjectDirectory(String requestedPath) {
        Path path = resolveReadableDirectory(requestedPath);
        if (!Files.isRegularFile(path.resolve("pom.xml"), LinkOption.NOFOLLOW_LINKS)) {
            throw new WorkspaceAccessException("Approved tests require a Maven project containing pom.xml");
        }
        return path;
    }

    public Path resolveReadableDirectory(String requestedPath) {
        return requestedPath == null || requestedPath.isBlank() ? root : resolveExistingDirectory(requestedPath);
    }

    public boolean isPermittedReadableFile(Path path) {
        try {
            validatePermittedPath(path, false);
            return Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
                    && Files.size(path) <= properties.getMaxFileBytes()
                    && !containsSensitiveContent(Files.readString(path, StandardCharsets.UTF_8));
        } catch (IOException | WorkspaceAccessException exception) {
            return false;
        }
    }

    public void validateNewContent(String content) {
        if (content == null || content.isBlank()) {
            throw new WorkspaceAccessException("File content must not be blank");
        }
        if (content.length() > properties.getMaxFileBytes()) {
            throw new WorkspaceAccessException("File content exceeds the configured size limit");
        }
        if (containsSensitiveContent(content)) {
            throw new WorkspaceAccessException("Content appears to contain a secret or credential");
        }
    }

    public String relative(Path path) {
        return root.relativize(path).toString().replace('\\', '/');
    }

    private Path resolveExisting(String requestedPath) {
        Path requested = parseRelativePath(requestedPath);
        try {
            Path candidate = root.resolve(requested).normalize();
            if (!candidate.startsWith(root)) {
                throw new WorkspaceAccessException("Path escapes the configured workspace root");
            }
            Path real = candidate.toRealPath();
            if (!real.startsWith(root)) {
                throw new WorkspaceAccessException("Path resolves outside the configured workspace root");
            }
            return real;
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Requested path does not exist or cannot be read", exception);
        }
    }

    private Path resolveExistingDirectory(String requestedPath) {
        Path directory = resolveExisting(requestedPath);
        if (!Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) {
            throw new WorkspaceAccessException("Project path must be a directory");
        }
        return directory;
    }

    private Path parseRelativePath(String requestedPath) {
        if (requestedPath == null || requestedPath.isBlank() || requestedPath.length() > 300) {
            throw new WorkspaceAccessException("Path must be a non-blank relative path up to 300 characters");
        }
        Path path = Path.of(requestedPath);
        if (path.isAbsolute()) {
            throw new WorkspaceAccessException("Absolute paths are not permitted");
        }
        return path.normalize();
    }

    private void validatePermittedPath(Path path, boolean editable) {
        Path relative = root.relativize(path);
        for (Path segment : relative) {
            if (BLOCKED_DIRECTORIES.contains(segment.toString().toLowerCase(Locale.ROOT))) {
                throw new WorkspaceAccessException("Requested path is in a restricted directory");
            }
        }
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.equals(".env") || name.startsWith(".env.") || name.contains("secret") || name.contains("credential")
                || name.contains("password") || name.endsWith(".pem") || name.endsWith(".key") || name.endsWith(".p12")) {
            throw new WorkspaceAccessException("Requested path is restricted because it may contain credentials");
        }
        String extension = extension(name);
        if (!TEXT_EXTENSIONS.contains(extension)) {
            throw new WorkspaceAccessException("Only approved text file types are permitted");
        }
        if (editable && !(relative.startsWith(Path.of("src"))
                || relative.startsWith(Path.of("docs"))
                || relative.equals(Path.of("README.md")))) {
            throw new WorkspaceAccessException(
                    "Edits are limited to src, docs, and README.md");
        }
    }

    private void validateFileSize(Path path) throws IOException {
        if (Files.size(path) > properties.getMaxFileBytes()) {
            throw new WorkspaceAccessException("File exceeds the configured size limit");
        }
    }

    private void validateNoSensitiveContents(Path path) throws IOException {
        if (containsSensitiveContent(Files.readString(path, StandardCharsets.UTF_8))) {
            throw new WorkspaceAccessException("Requested file contains a secret or credential and cannot be exposed");
        }
    }

    private boolean containsSensitiveContent(String value) {
        return SENSITIVE_CONTENT.matcher(value).find();
    }

    private String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1);
    }
}
