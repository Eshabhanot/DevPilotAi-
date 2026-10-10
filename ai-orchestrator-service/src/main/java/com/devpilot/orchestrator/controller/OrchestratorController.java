package com.devpilot.orchestrator.controller;

import java.util.List;

import com.devpilot.orchestrator.dto.SoftwareTaskRequest;
import com.devpilot.orchestrator.dto.TaskResponse;
import com.devpilot.orchestrator.service.AuthenticationRequiredException;
import com.devpilot.orchestrator.service.OrchestratorWorkflowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/tasks", "/api/orchestrator/tasks"})
public class OrchestratorController {

    private static final String AUTHENTICATED_USER_HEADER =
            "X-Authenticated-User";

    private final OrchestratorWorkflowService workflowService;

    public OrchestratorController(OrchestratorWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse startTask(
            @RequestHeader(AUTHENTICATED_USER_HEADER) String ownerId,
            @Valid @RequestBody SoftwareTaskRequest request) {

        return workflowService.createAndRun(owner(ownerId), request);
    }

    @GetMapping("/{taskId}")
    public TaskResponse getTask(
            @RequestHeader(AUTHENTICATED_USER_HEADER) String ownerId,
            @PathVariable String taskId) {

        return workflowService.get(owner(ownerId), taskId);
    }

    @GetMapping
    public List<TaskResponse> listTasks(
            @RequestHeader(AUTHENTICATED_USER_HEADER) String ownerId) {

        return workflowService.list(owner(ownerId));
    }

    @PostMapping("/{taskId}/cancel")
    public TaskResponse cancelTask(
            @RequestHeader(AUTHENTICATED_USER_HEADER) String ownerId,
            @PathVariable String taskId) {

        return workflowService.cancel(owner(ownerId), taskId);
    }

    private String owner(String ownerId) {
        if (ownerId == null || ownerId.isBlank()) {
            throw new AuthenticationRequiredException(
                    "Authenticated user header is required.");
        }

        return ownerId.trim();
    }
}
