package com.devpilot.orchestrator.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.devpilot.orchestrator.config.OrchestratorProperties;
import com.devpilot.orchestrator.domain.OrchestratorTask;
import com.devpilot.orchestrator.dto.CodingResult;
import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.DocumentationContext;
import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.SoftwareTaskRequest;
import com.devpilot.orchestrator.dto.TaskResponse;
import com.devpilot.orchestrator.dto.TaskStatus;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.repository.OrchestratorTaskRepository;
import org.springframework.stereotype.Service;

@Service
public class OrchestratorWorkflowService {

    private final OrchestratorTaskRepository taskRepository;
    private final ResearchAgent researchAgent;
    private final PlanningAgent planningAgent;
    private final CodingAgent codingAgent;
    private final TestingAgent testingAgent;
    private final DocumentationAgent documentationAgent;
    private final OrchestratorProperties properties;

    public OrchestratorWorkflowService(
            OrchestratorTaskRepository taskRepository,
            ResearchAgent researchAgent,
            PlanningAgent planningAgent,
            CodingAgent codingAgent,
            TestingAgent testingAgent,
            DocumentationAgent documentationAgent,
            OrchestratorProperties properties) {
        this.taskRepository = taskRepository;
        this.researchAgent = researchAgent;
        this.planningAgent = planningAgent;
        this.codingAgent = codingAgent;
        this.testingAgent = testingAgent;
        this.documentationAgent = documentationAgent;
        this.properties = properties;
    }

    public TaskResponse createAndRun(String ownerId, SoftwareTaskRequest request) {
        OrchestratorTask task = new OrchestratorTask(
                UUID.randomUUID().toString(),
                ownerId,
                request.task().trim(),
                request.workspaceId().trim(),
                safeHistory(request.conversationHistory()),
                Instant.now());
        taskRepository.save(task);

        execute(task);
        return task.toResponse();
    }

    public TaskResponse get(String ownerId, String taskId) {
        return taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new TaskNotFoundException(taskId))
                .toResponse();
    }

    public List<TaskResponse> list(String ownerId) {
        return taskRepository.findAllByOwnerId(ownerId).stream()
                .map(OrchestratorTask::toResponse)
                .toList();
    }

    public TaskResponse cancel(String ownerId, String taskId) {
        OrchestratorTask task = taskRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        if (!task.cancel()) {
            throw new InvalidTaskStateException(
                    "Task " + taskId
                            + " is already terminal and cannot be cancelled.");
        }

        return task.toResponse();
    }

    private void execute(OrchestratorTask task) {
        if (!task.markRunning()) {
            throw new InvalidTaskStateException(
                    "Task " + task.taskId()
                            + " is already running or terminal.");
        }

        Instant startedAt = Instant.now();
        try {
            runResearch(task, startedAt);
            runPlanning(task, startedAt);
            runCoding(task, startedAt);
            runTestingWithRepairs(task, startedAt);
            runDocumentation(task, startedAt);
        } catch (RuntimeException exception) {
            if (!task.cancelled()) {
                task.fail(safeExceptionMessage(exception));
            }
        } finally {
            task.markNotRunning();
        }
    }

    private void runResearch(OrchestratorTask task, Instant startedAt) {
        ensureRunnable(task, startedAt);
        task.transitionTo(TaskStatus.RESEARCHING, 10, "Research Agent running");
        ResearchResult result = researchAgent.research(
                task.taskId(),
                task.task(),
                task.workspaceId(),
                task.conversationHistory());
        task.setResearchResult(result);

        if (!result.complete()) {
            failWithDocumentation(
                    task,
                    result,
                    null,
                    null,
                    "Research failed: " + result.failureReason());
        }
    }

    private void runPlanning(OrchestratorTask task, Instant startedAt) {
        ensureRunnable(task, startedAt);
        task.transitionTo(TaskStatus.PLANNING, 25, "Planning implementation");
        ImplementationPlan plan = planningAgent.plan(
                task.task(),
                task.toResponse().researchResult());
        task.setImplementationPlan(plan);

        if (!plan.complete()) {
            failWithDocumentation(
                    task,
                    task.toResponse().researchResult(),
                    plan,
                    null,
                    "Planning failed: " + plan.failureReason());
        }
    }

    private void runCoding(OrchestratorTask task, Instant startedAt) {
        ensureRunnable(task, startedAt);
        task.transitionTo(TaskStatus.CODING, 45, "Coding Agent applying changes");
        CodingResult result = codingAgent.proposeAndApply(
                task.task(),
                task.toResponse().researchResult(),
                task.toResponse().implementationPlan());
        task.addCodingResult(result);

        if (!result.successful()) {
            failWithDocumentation(
                    task,
                    task.toResponse().researchResult(),
                    task.toResponse().implementationPlan(),
                    null,
                    "Coding failed: " + result.summary());
        }
    }

    private void runTestingWithRepairs(OrchestratorTask task, Instant startedAt) {
        while (true) {
            ensureRunnable(task, startedAt);
            task.transitionTo(TaskStatus.TESTING, 65,
                    "Testing Agent running approved tests");
            TestResult testResult = testingAgent.runApprovedTests(
                    task.task(),
                    task.toResponse().changedFiles(),
                    task.workspaceId());
            task.setTestResult(testResult);

            if (testResult.successful()) {
                return;
            }

            if (testResult.timedOut()) {
                failWithDocumentation(
                        task,
                        task.toResponse().researchResult(),
                        task.toResponse().implementationPlan(),
                        testResult,
                        "Approved tests timed out; repair was not attempted.");
            }

            if (testResult.status() != com.devpilot.orchestrator.dto.TestStatus.FAILED) {
                failWithDocumentation(
                        task,
                        task.toResponse().researchResult(),
                        task.toResponse().implementationPlan(),
                        testResult,
                        "Approved test execution could not complete: "
                                + testResult.failureSummary());
            }

            if (task.repairAttempts() >= properties.maxRepairAttempts()) {
                failWithDocumentation(
                        task,
                        task.toResponse().researchResult(),
                        task.toResponse().implementationPlan(),
                        testResult,
                        "Tests failed after " + task.repairAttempts()
                                + " repair attempts: "
                                + testResult.failureSummary());
            }

            ensureRunnable(task, startedAt);
            task.transitionTo(TaskStatus.REPAIRING, 75,
                    "Coding Agent repairing test failures");
            task.incrementRepairAttempts();
            CodingResult repairResult = codingAgent.repair(
                    task.task(),
                    task.toResponse().researchResult(),
                    task.toResponse().implementationPlan(),
                    testResult,
                    task.repairAttempts());
            task.addCodingResult(repairResult);

            if (!repairResult.successful()) {
                failWithDocumentation(
                        task,
                        task.toResponse().researchResult(),
                        task.toResponse().implementationPlan(),
                        testResult,
                        "Repair failed: " + repairResult.summary());
            }
        }
    }

    private void runDocumentation(OrchestratorTask task, Instant startedAt) {
        ensureRunnable(task, startedAt);
        task.transitionTo(TaskStatus.DOCUMENTING, 90,
                "Documentation Agent summarizing");
        DocumentationResult documentation = documentationAgent.documentSuccess(
                documentationContext(task, true));
        task.setDocumentationResult(documentation);

        if (!documentation.successful()) {
            task.fail("Documentation failed: " + documentation.failureReason());
            return;
        }

        task.transitionTo(TaskStatus.COMPLETED, 100, "Task completed");
    }

    private void failWithDocumentation(
            OrchestratorTask task,
            ResearchResult researchResult,
            ImplementationPlan plan,
            TestResult testResult,
            String failureReason) {

        DocumentationResult documentation = documentationAgent.documentFailure(
                documentationContext(task, false),
                failureReason);
        task.setDocumentationResult(documentation);
        throw new WorkflowFailedException(failureReason);
    }

    private void ensureRunnable(OrchestratorTask task, Instant startedAt) {
        if (task.cancelled()) {
            throw new WorkflowCancelledException("Task was cancelled.");
        }

        if (Duration.between(startedAt, Instant.now())
                .compareTo(properties.taskTimeout()) > 0) {
            throw new WorkflowFailedException(
                    "Task exceeded orchestrator timeout.");
        }
    }

    private List<String> safeHistory(List<String> history) {
        if (history == null) {
            return List.of();
        }

        return history;
    }

    private DocumentationContext documentationContext(
            OrchestratorTask task,
            boolean readmeUpdateAuthorized) {

        TaskResponse response = task.toResponse();
        return new DocumentationContext(
                task.task(),
                task.workspaceId(),
                response.researchResult(),
                response.changedFiles(),
                response.changes(),
                response.codingAssumptions(),
                response.testResult(),
                readmeUpdateAuthorized);
    }

    private String safeExceptionMessage(RuntimeException exception) {
        if (exception.getMessage() == null || exception.getMessage().isBlank()) {
            return exception.getClass().getSimpleName();
        }

        return exception.getMessage();
    }
}
