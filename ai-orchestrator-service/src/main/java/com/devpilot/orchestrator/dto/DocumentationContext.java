package com.devpilot.orchestrator.dto;

import java.util.List;

public record DocumentationContext(
        String task,
        String workspaceId,
        ResearchResult researchResult,
        List<String> changedFiles,
        List<CodingChange> changes,
        List<String> codingAssumptions,
        TestResult testResult,
        boolean readmeUpdateAuthorized
) {}
