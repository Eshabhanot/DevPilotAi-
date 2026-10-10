package com.devpilot.orchestrator.service;

import java.util.List;

import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.WorkspaceFileChange;
import com.devpilot.orchestrator.dto.WorkspaceFileContents;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;

public interface McpWorkspaceClient {

    List<WorkspaceFileEvidence> searchRelevantFiles(
            String workspaceId,
            List<String> searchTerms);

    default WorkspaceFileContents readWorkspaceFile(
            String workspaceId,
            String path) {
        throw new UnsupportedOperationException(
                "Workspace file reads are not supported by this MCP client.");
    }

    default WorkspaceFileChange createWorkspaceFile(
            String workspaceId,
            String path,
            String content) {
        throw new UnsupportedOperationException(
                "Workspace file creation is not supported by this MCP client.");
    }

    default WorkspaceFileChange updateWorkspaceFile(
            String workspaceId,
            String path,
            String content) {
        throw new UnsupportedOperationException(
                "Workspace file updates are not supported by this MCP client.");
    }

    ApprovedTestExecution runApprovedTests(String workspaceId);
}
