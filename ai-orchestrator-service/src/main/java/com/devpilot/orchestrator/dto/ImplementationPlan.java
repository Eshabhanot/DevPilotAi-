package com.devpilot.orchestrator.dto;

import java.util.List;

public record ImplementationPlan(
        String summary,
        List<String> steps,
        List<String> targetFiles,
        List<String> risks,
        boolean complete,
        String failureReason
) {}
