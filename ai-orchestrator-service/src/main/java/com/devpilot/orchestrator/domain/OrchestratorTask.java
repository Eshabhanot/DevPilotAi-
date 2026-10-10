package com.devpilot.orchestrator.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.devpilot.orchestrator.dto.CodingResult;
import com.devpilot.orchestrator.dto.CodingChange;
import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.RetrievedSource;
import com.devpilot.orchestrator.dto.TaskResponse;
import com.devpilot.orchestrator.dto.TaskStatus;
import com.devpilot.orchestrator.dto.TestResult;

public class OrchestratorTask {

    private final String taskId;
    private final String ownerId;
    private final String task;
    private final String workspaceId;
    private final List<String> conversationHistory;
    private final Instant createdAt;

    private TaskStatus status;
    private Instant updatedAt;
    private int progress;
    private String currentStep;
    private String summary;
    private String failureSummary;
    private ResearchResult researchResult;
    private ImplementationPlan implementationPlan;
    private TestResult testResult;
    private final List<String> changedFiles = new ArrayList<>();
    private final List<CodingChange> changes = new ArrayList<>();
    private final List<String> codingAssumptions = new ArrayList<>();
    private final List<RetrievedSource> sourceReferences = new ArrayList<>();
    private DocumentationResult documentationResult;
    private int repairAttempts;
    private boolean running;

    public OrchestratorTask(
            String taskId,
            String ownerId,
            String task,
            String workspaceId,
            List<String> conversationHistory,
            Instant now) {

        this.taskId = taskId;
        this.ownerId = ownerId;
        this.task = task;
        this.workspaceId = workspaceId;
        this.conversationHistory = List.copyOf(conversationHistory == null
                ? List.of()
                : conversationHistory);
        this.createdAt = now;
        this.updatedAt = now;
        this.status = TaskStatus.ACCEPTED;
        this.progress = 0;
        this.currentStep = "Task accepted";
    }

    public synchronized boolean markRunning() {
        if (running || status.terminal()) {
            return false;
        }

        running = true;
        updatedAt = Instant.now();
        return true;
    }

    public synchronized void markNotRunning() {
        running = false;
        updatedAt = Instant.now();
    }

    public synchronized void transitionTo(
            TaskStatus next,
            int progress,
            String currentStep) {

        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException(
                    "Illegal task transition from " + status + " to " + next);
        }

        this.status = next;
        this.progress = progress;
        this.currentStep = currentStep;
        this.updatedAt = Instant.now();
    }

    public synchronized void fail(String failureSummary) {
        transitionTo(TaskStatus.FAILED, progress, "Task failed");
        this.failureSummary = failureSummary;
        this.summary = failureSummary;
    }

    public synchronized boolean cancel() {
        if (status.terminal()) {
            return false;
        }

        transitionTo(TaskStatus.CANCELLED, progress, "Task cancelled");
        summary = "Task was cancelled.";
        return true;
    }

    public synchronized boolean cancelled() {
        return status == TaskStatus.CANCELLED;
    }

    public synchronized void setResearchResult(ResearchResult researchResult) {
        this.researchResult = researchResult;
        this.sourceReferences.clear();
        if (researchResult != null && researchResult.retrievedSources() != null) {
            this.sourceReferences.addAll(researchResult.retrievedSources());
        }
        this.updatedAt = Instant.now();
    }

    public synchronized void setImplementationPlan(
            ImplementationPlan implementationPlan) {
        this.implementationPlan = implementationPlan;
        this.updatedAt = Instant.now();
    }

    public synchronized void addCodingResult(CodingResult codingResult) {
        if (codingResult != null && codingResult.changedFiles() != null) {
            for (String changedFile : codingResult.changedFiles()) {
                if (!changedFiles.contains(changedFile)) {
                    changedFiles.add(changedFile);
                }
            }
        }
        if (codingResult != null && codingResult.changes() != null) {
            this.changes.addAll(codingResult.changes());
        }
        if (codingResult != null && codingResult.assumptions() != null) {
            this.codingAssumptions.addAll(codingResult.assumptions());
        }
        this.updatedAt = Instant.now();
    }

    public synchronized void setTestResult(TestResult testResult) {
        this.testResult = testResult;
        this.updatedAt = Instant.now();
    }

    public synchronized void setDocumentationResult(
            DocumentationResult documentationResult) {
        if (documentationResult != null) {
            this.documentationResult = documentationResult;
            this.summary = documentationResult.summary();
            this.failureSummary = documentationResult.failureReason();
        }
        this.updatedAt = Instant.now();
    }

    public synchronized void incrementRepairAttempts() {
        repairAttempts++;
        updatedAt = Instant.now();
    }

    public synchronized TaskResponse toResponse() {
        return new TaskResponse(
                taskId,
                ownerId,
                status,
                createdAt,
                updatedAt,
                progress,
                task,
                workspaceId,
                currentStep,
                summary,
                failureSummary,
                researchResult,
                implementationPlan,
                testResult,
                List.copyOf(changedFiles),
                List.copyOf(changes),
                List.copyOf(codingAssumptions),
                List.copyOf(sourceReferences),
                documentationResult,
                repairAttempts);
    }

    public String taskId() {
        return taskId;
    }

    public String ownerId() {
        return ownerId;
    }

    public String task() {
        return task;
    }

    public String workspaceId() {
        return workspaceId;
    }

    public List<String> conversationHistory() {
        return conversationHistory;
    }

    public synchronized int repairAttempts() {
        return repairAttempts;
    }
}
