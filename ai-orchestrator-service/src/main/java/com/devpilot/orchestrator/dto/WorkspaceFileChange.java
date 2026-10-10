package com.devpilot.orchestrator.dto;

public record WorkspaceFileChange(
        String path,
        boolean created,
        String backupPath
) {}
