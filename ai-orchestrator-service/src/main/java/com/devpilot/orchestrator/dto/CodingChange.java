package com.devpilot.orchestrator.dto;

public record CodingChange(
        String path,
        String action,
        String rationale
) {}
