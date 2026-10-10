package com.devpilot.orchestrator.dto;

import java.util.List;

public record DocumentationResult(
        boolean successful,
        String summary,
        List<String> filesChanged,
        List<CodingChange> changes,
        List<String> apiEndpoints,
        List<String> configurationRequirements,
        List<String> localRunInstructions,
        String testOutcome,
        List<String> limitations,
        boolean readmeUpdated,
        String failureReason
) {}
