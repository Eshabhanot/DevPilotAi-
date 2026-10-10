package com.devpilot.mcp.tool;

import com.devpilot.mcp.dto.FileChange;
import com.devpilot.mcp.dto.FileContents;
import com.devpilot.mcp.dto.FileEntry;
import com.devpilot.mcp.dto.SearchMatch;
import com.devpilot.mcp.dto.TestExecution;
import com.devpilot.mcp.dto.ToolResult;
import com.devpilot.mcp.service.ApprovedTestService;
import com.devpilot.mcp.service.WorkspaceAccessException;
import com.devpilot.mcp.service.WorkspaceFileService;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DeveloperWorkspaceTools {

    private final WorkspaceFileService files;
    private final ApprovedTestService tests;

    public DeveloperWorkspaceTools(WorkspaceFileService files, ApprovedTestService tests) {
        this.files = files;
        this.tests = tests;
    }

    @McpTool(name = "listWorkspaceFiles", description = "List approved text files under the configured workspace root. An optional relative directory narrows the result.")
    public ToolResult<List<FileEntry>> listWorkspaceFiles(
            @McpToolParam(description = "Optional relative directory inside the configured workspace root", required = false) String pathPrefix) {
        try {
            List<FileEntry> result = files.listFiles(pathPrefix);
            return ToolResult.success("Listed " + result.size() + " approved workspace files", result);
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    @McpTool(name = "readWorkspaceFile", description = "Read one approved, size-bounded text file from the configured workspace root.")
    public ToolResult<FileContents> readWorkspaceFile(
            @McpToolParam(description = "Required relative path of the file to read", required = true) String path) {
        try {
            return ToolResult.success("Read workspace file", files.readFile(path));
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    @McpTool(name = "searchWorkspace", description = "Search approved, size-bounded text files for a literal query. Results contain matching line numbers and bounded line text.")
    public ToolResult<List<SearchMatch>> searchWorkspace(
            @McpToolParam(description = "Required literal text to search for, up to 120 characters", required = true) String query,
            @McpToolParam(description = "Optional relative directory inside the configured workspace root", required = false) String pathPrefix) {
        try {
            List<SearchMatch> result = files.search(query, pathPrefix);
            return ToolResult.success("Found " + result.size() + " matching lines", result);
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    @McpTool(name = "createWorkspaceFile", description = "Create a new approved text file in src or docs inside the configured workspace root. Existing files are never overwritten.")
    public ToolResult<FileChange> createWorkspaceFile(
            @McpToolParam(description = "Required relative destination path under src or docs", required = true) String path,
            @McpToolParam(description = "Required complete UTF-8 file content without secrets or credentials", required = true) String content) {
        try {
            FileChange change = files.createFile(path, content);
            return ToolResult.changed("Created workspace file", change, List.of(change.path()));
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    @McpTool(name = "updateWorkspaceFile", description = "Replace an existing approved source, documentation, or README file after writing a workspace-local backup. Content cannot include secrets or credentials.")
    public ToolResult<FileChange> updateWorkspaceFile(
            @McpToolParam(description = "Required relative source, documentation, or README file path", required = true) String path,
            @McpToolParam(description = "Required complete replacement UTF-8 content without secrets or credentials", required = true) String content) {
        try {
            FileChange change = files.updateFile(path, content);
            return ToolResult.changed("Updated workspace file and retained a backup", change, List.of(change.path()));
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    @McpTool(name = "runApprovedTests", description = "Run the fixed Maven test command for a Maven project within the configured workspace. No arbitrary commands or arguments are accepted.")
    public ToolResult<TestExecution> runApprovedTests(
            @McpToolParam(description = "Optional relative Maven project directory; blank means the configured workspace root", required = false) String projectPath) {
        try {
            TestExecution execution = tests.runMavenTests(projectPath);
            String message = execution.timedOut() ? "Maven tests timed out" : "Maven tests completed with exit code " + execution.exitCode();
            return ToolResult.success(message, execution);
        } catch (WorkspaceAccessException exception) {
            return failure(exception);
        }
    }

    private <T> ToolResult<T> failure(WorkspaceAccessException exception) {
        return new ToolResult<>(false, exception.getMessage(), null, List.of());
    }
}
