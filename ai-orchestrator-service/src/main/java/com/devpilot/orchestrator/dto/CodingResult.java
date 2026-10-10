package com.devpilot.orchestrator.dto;

import java.util.List;

public record CodingResult(
        boolean successful,
        String summary,
        List<String> changedFiles,
        List<String> diagnostics,
        List<CodingChange> changes,
        List<String> assumptions
) {}
