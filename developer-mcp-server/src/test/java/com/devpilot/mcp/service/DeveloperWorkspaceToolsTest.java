package com.devpilot.mcp.service;

import com.devpilot.mcp.config.WorkspaceProperties;
import com.devpilot.mcp.dto.FileChange;
import com.devpilot.mcp.dto.FileContents;
import com.devpilot.mcp.dto.SearchMatch;
import com.devpilot.mcp.dto.TestExecution;
import com.devpilot.mcp.dto.ToolResult;
import com.devpilot.mcp.tool.DeveloperWorkspaceTools;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeveloperWorkspaceToolsTest {

    @TempDir
    Path workspace;

    private WorkspaceProperties properties;
    private DeveloperWorkspaceTools tools;

    @BeforeEach
    void setUp() throws IOException {
        Files.createDirectories(workspace.resolve("src/main/java"));
        Files.createDirectories(workspace.resolve("src/test/java"));
        Files.writeString(workspace.resolve("pom.xml"), "<project/>", StandardCharsets.UTF_8);
        Files.writeString(workspace.resolve("src/main/java/Example.java"), "class Example {}", StandardCharsets.UTF_8);

        properties = new WorkspaceProperties();
        properties.setRoot(workspace);
        properties.setMaxFileBytes(1_024);
        properties.setMaxReadCharacters(512);
        properties.setMaxSearchResults(10);
        properties.setMaxListResults(10);
        properties.setTestTimeout(Duration.ofMillis(100));
        properties.setMaxTestOutputCharacters(128);

        WorkspaceSafety safety = new WorkspaceSafety(properties);
        safety.initialize();
        WorkspaceFileService files = new WorkspaceFileService(safety, properties);
        ApprovedTestService tests = new ApprovedTestService(safety, properties,
                (directory, timeout, outputLimit) -> new TestExecution(directory.toString(), 0, false, Duration.ZERO, "BUILD SUCCESS", false));
        tools = new DeveloperWorkspaceTools(files, tests);
    }

    @Test
    void readsApprovedWorkspaceFile() {
        ToolResult<FileContents> result = tools.readWorkspaceFile("src/main/java/Example.java");

        assertTrue(result.success());
        assertEquals("src/main/java/Example.java", result.data().path());
        assertEquals("class Example {}", result.data().content());
    }

    @Test
    void createsAndUpdatesApprovedFileWithBackup() {
        ToolResult<FileChange> created = tools.createWorkspaceFile("src/main/java/NewExample.java", "class NewExample {}");
        ToolResult<FileChange> updated = tools.updateWorkspaceFile("src/main/java/NewExample.java", "class NewExample { int value; }");

        assertTrue(created.success());
        assertEquals(List.of("src/main/java/NewExample.java"), created.changedPaths());
        assertTrue(updated.success());
        assertNotNull(updated.data().backupPath());
        assertTrue(Files.exists(workspace.resolve(updated.data().backupPath())));
        assertEquals("class NewExample { int value; }", read("src/main/java/NewExample.java"));
    }

    @Test
    void rejectsPathTraversalAttempt() {
        ToolResult<FileContents> result = tools.readWorkspaceFile("../outside.txt");

        assertFalse(result.success());
        assertTrue(result.message().contains("workspace root"));
    }

    @Test
    void rejectsUnauthorizedEditablePath() {
        ToolResult<FileChange> result = tools.updateWorkspaceFile("pom.xml", "<project/>");

        assertFalse(result.success());
        assertTrue(result.message().contains("limited to src, docs, and README.md"));
    }

    @Test
    void updatesRootReadmeWithBackup() throws IOException {
        Files.writeString(workspace.resolve("README.md"), "# Existing", StandardCharsets.UTF_8);

        ToolResult<FileChange> result = tools.updateWorkspaceFile(
                "README.md", "# Existing\n\n## Change Summary");

        assertTrue(result.success());
        assertNotNull(result.data().backupPath());
        assertEquals("# Existing\n\n## Change Summary", read("README.md"));
    }

    @Test
    void rejectsLargeFiles() throws IOException {
        Files.writeString(workspace.resolve("src/main/java/Large.java"), "x".repeat(1_025), StandardCharsets.UTF_8);

        ToolResult<FileContents> result = tools.readWorkspaceFile("src/main/java/Large.java");

        assertFalse(result.success());
        assertTrue(result.message().contains("size limit"));
    }

    @Test
    void rejectsInvalidToolArguments() {
        ToolResult<FileContents> readResult = tools.readWorkspaceFile(" ");
        ToolResult<List<SearchMatch>> searchResult = tools.searchWorkspace("", null);

        assertFalse(readResult.success());
        assertFalse(searchResult.success());
    }

    @Test
    void reportsFailedApprovedTests() {
        tools = toolsWithExecutor((directory, timeout, outputLimit) ->
                new TestExecution(directory.toString(), 1, false, Duration.ZERO, "Tests failed", false));

        ToolResult<TestExecution> result = tools.runApprovedTests("");

        assertTrue(result.success());
        assertEquals(1, result.data().exitCode());
        assertTrue(result.message().contains("exit code 1"));
    }

    @Test
    void reportsTimedOutApprovedTests() {
        tools = toolsWithExecutor((directory, timeout, outputLimit) ->
                new TestExecution(directory.toString(), 143, true, Duration.ZERO, "Timed out", false));

        ToolResult<TestExecution> result = tools.runApprovedTests("");

        assertTrue(result.success());
        assertTrue(result.data().timedOut());
        assertEquals("Maven tests timed out", result.message());
    }

    private DeveloperWorkspaceTools toolsWithExecutor(ApprovedTestExecutor executor) {
        WorkspaceSafety safety = new WorkspaceSafety(properties);
        safety.initialize();
        return new DeveloperWorkspaceTools(
                new WorkspaceFileService(safety, properties),
                new ApprovedTestService(safety, properties, executor));
    }

    private String read(String path) {
        try {
            return Files.readString(workspace.resolve(path), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new AssertionError(exception);
        }
    }
}
