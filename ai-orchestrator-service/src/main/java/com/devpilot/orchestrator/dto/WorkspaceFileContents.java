package com.devpilot.orchestrator.dto;

public record WorkspaceFileContents(
        String path,
        String content,
        boolean truncated
) {}
