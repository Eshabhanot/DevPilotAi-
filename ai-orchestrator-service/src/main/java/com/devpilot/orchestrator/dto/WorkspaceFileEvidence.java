package com.devpilot.orchestrator.dto;

public record WorkspaceFileEvidence(
        String path,
        String evidenceType,
        String snippet
) {}
