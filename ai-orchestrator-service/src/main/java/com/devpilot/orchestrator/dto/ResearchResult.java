package com.devpilot.orchestrator.dto;

import java.util.List;

public record ResearchResult(
        String taskId,
        String originalTask,
        String workspaceId,
        String taskSummary,
        String researchSummary,
        List<TechnicalEvidence> retrievedTechnicalEvidence,
        List<RetrievedSource> retrievedSources,
        List<WorkspaceFileEvidence> relevantFiles,
        List<String> existingImplementation,
        List<String> implementationRecommendations,
        List<String> potentialRisks,
        List<String> missingInformation,
        List<String> confidenceLimitations,
        List<String> uncertainties,
        boolean knowledgeServiceAvailable,
        boolean emptyRetrievalResult,
        boolean complete,
        String failureReason
) {}
