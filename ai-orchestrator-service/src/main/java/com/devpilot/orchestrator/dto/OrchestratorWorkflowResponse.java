package com.devpilot.orchestrator.dto;

public record OrchestratorWorkflowResponse(
        String originalTask,
        WorkflowStage stage,
        ResearchResult researchResult
) {}
