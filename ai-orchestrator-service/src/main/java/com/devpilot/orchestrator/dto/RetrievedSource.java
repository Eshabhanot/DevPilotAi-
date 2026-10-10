package com.devpilot.orchestrator.dto;

public record RetrievedSource(
        String title,
        String headingPath,
        Object chunkIndex
) {}
