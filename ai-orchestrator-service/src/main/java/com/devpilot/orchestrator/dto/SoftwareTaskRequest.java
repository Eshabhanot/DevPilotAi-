package com.devpilot.orchestrator.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SoftwareTaskRequest(
        @NotBlank(message = "Task is required")
        @Size(max = 2000, message = "Task is too long")
        String task,

        @NotBlank(message = "Workspace ID is required")
        @Size(max = 1000, message = "Workspace ID is too long")
        String workspaceId,

        @Size(max = 10, message = "Maximum 10 history messages allowed")
        List<@Size(max = 2000) String> conversationHistory
) {}
