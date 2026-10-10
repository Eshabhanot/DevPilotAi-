package com.devpilot.mcp.service;

import com.devpilot.mcp.config.WorkspaceProperties;
import com.devpilot.mcp.dto.FileChange;
import com.devpilot.mcp.dto.FileContents;
import com.devpilot.mcp.dto.FileEntry;
import com.devpilot.mcp.dto.SearchMatch;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Service
public class WorkspaceFileService {

    private final WorkspaceSafety safety;
    private final WorkspaceProperties properties;

    public WorkspaceFileService(WorkspaceSafety safety, WorkspaceProperties properties) {
        this.safety = safety;
        this.properties = properties;
    }

    public List<FileEntry> listFiles(String pathPrefix) {
        Path directory = resolveListDirectory(pathPrefix);
        try (Stream<Path> paths = Files.walk(directory)) {
            return paths
                    .filter(safety::isPermittedReadableFile)
                    .sorted(Comparator.comparing(safety::relative))
                    .limit(properties.getMaxListResults())
                    .map(path -> new FileEntry(safety.relative(path), size(path)))
                    .toList();
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to list workspace files", exception);
        }
    }

    public FileContents readFile(String path) {
        Path file = safety.resolveReadableFile(path);
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            boolean truncated = content.length() > properties.getMaxReadCharacters();
            return new FileContents(safety.relative(file), truncated ? content.substring(0, properties.getMaxReadCharacters()) : content, truncated);
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to read workspace file", exception);
        }
    }

    public List<SearchMatch> search(String query, String pathPrefix) {
        if (query == null || query.isBlank() || query.length() > 120) {
            throw new WorkspaceAccessException("Search query must be between 1 and 120 characters");
        }
        Path directory = resolveListDirectory(pathPrefix);
        List<SearchMatch> matches = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(directory)) {
            for (Path file : paths.filter(safety::isPermittedReadableFile).sorted().toList()) {
                List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
                for (int index = 0; index < lines.size(); index++) {
                    if (lines.get(index).toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT))) {
                        matches.add(new SearchMatch(safety.relative(file), index + 1, abbreviate(lines.get(index))));
                        if (matches.size() >= properties.getMaxSearchResults()) {
                            return matches;
                        }
                    }
                }
            }
            return matches;
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to search workspace files", exception);
        }
    }

    public FileChange createFile(String path, String content) {
        safety.validateNewContent(content);
        Path file = safety.resolveEditableFile(path, false);
        if (Files.exists(file)) {
            throw new WorkspaceAccessException("File already exists; use updateWorkspaceFile instead");
        }
        try {
            Files.writeString(file, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
            return new FileChange(safety.relative(file), null, null, sha256(content));
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to create workspace file", exception);
        }
    }

    public FileChange updateFile(String path, String content) {
        safety.validateNewContent(content);
        Path file = safety.resolveEditableFile(path, true);
        try {
            String previousContent = Files.readString(file, StandardCharsets.UTF_8);
            Path backup = backup(file, previousContent);
            Path temporary = Files.createTempFile(file.getParent(), ".devpilot-", ".tmp");
            try {
                Files.writeString(temporary, content, StandardCharsets.UTF_8);
                try {
                    Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException exception) {
                    Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING);
                }
            } finally {
                Files.deleteIfExists(temporary);
            }
            return new FileChange(safety.relative(file), safety.relative(backup), sha256(previousContent), sha256(content));
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to update workspace file", exception);
        }
    }

    private Path resolveListDirectory(String pathPrefix) {
        if (pathPrefix == null || pathPrefix.isBlank()) {
            return safety.root();
        }
        Path directory = safety.resolveReadableDirectory(pathPrefix);
        return directory;
    }

    private Path backup(Path file, String content) throws IOException {
        Path relative = safety.root().relativize(file);
        Path backupRoot = safety.root().resolve(".devpilot-backups").resolve(Long.toString(Instant.now().toEpochMilli()));
        Path backup = backupRoot.resolve(relative).normalize();
        if (!backup.startsWith(backupRoot)) {
            throw new WorkspaceAccessException("Unable to create backup safely");
        }
        Files.createDirectories(backup.getParent());
        Files.writeString(backup, content, StandardCharsets.UTF_8);
        return backup;
    }

    private long size(Path path) {
        try {
            return Files.size(path);
        } catch (IOException exception) {
            return -1;
        }
    }

    private String abbreviate(String value) {
        return value.length() <= 300 ? value : value.substring(0, 300);
    }

    private String sha256(String content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
