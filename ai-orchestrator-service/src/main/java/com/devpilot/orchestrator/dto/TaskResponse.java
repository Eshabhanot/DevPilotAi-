package com.devpilot.orchestrator.dto;

import java.time.Instant;
import java.util.List;

public record TaskResponse(
        String taskId,
        String ownerId,
        TaskStatus status,
        Instant createdAt,
        Instant updatedAt,
        int progress,
        String task,
        String workspaceId,
        String currentStep,
        String summary,
        String failureSummary,
        ResearchResult researchResult,
        ImplementationPlan implementationPlan,
        TestResult testResult,
        List<String> changedFiles,
        List<CodingChange> changes,
        List<String> codingAssumptions,
        List<RetrievedSource> sourceReferences,
        DocumentationResult documentationResult,
        int repairAttempts
) {}
