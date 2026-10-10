package com.devpilot.orchestrator.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.devpilot.orchestrator.config.OrchestratorProperties;
import com.devpilot.orchestrator.dto.CodingResult;
import com.devpilot.orchestrator.dto.CodingChange;
import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.DocumentationContext;
import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.RetrievedSource;
import com.devpilot.orchestrator.dto.SoftwareTaskRequest;
import com.devpilot.orchestrator.dto.TaskResponse;
import com.devpilot.orchestrator.dto.TaskStatus;
import com.devpilot.orchestrator.dto.TechnicalEvidence;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.dto.TestStatus;
import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import com.devpilot.orchestrator.repository.InMemoryOrchestratorTaskRepository;
import org.junit.jupiter.api.Test;

class OrchestratorWorkflowServiceTest {

    @Test
    void completesWorkflowAfterOneRepairAttempt() {
        InMemoryOrchestratorTaskRepository repository =
                new InMemoryOrchestratorTaskRepository();
        FakeResearchAgent researchAgent = new FakeResearchAgent();
        FakePlanningAgent planningAgent = new FakePlanningAgent();
        FakeCodingAgent codingAgent = new FakeCodingAgent();
        FakeTestingAgent testingAgent = new FakeTestingAgent(
                List.of(
                        failingTests(),
                        successfulTests()));
        OrchestratorWorkflowService service = new OrchestratorWorkflowService(
                repository,
                researchAgent,
                planningAgent,
                codingAgent,
                testingAgent,
                new FakeDocumentationAgent(),
                new OrchestratorProperties(2, Duration.ofMinutes(5),
                        Duration.ofSeconds(30)));

        TaskResponse response = service.createAndRun(
                "owner@example.com",
                new SoftwareTaskRequest(
                        "Add task lifecycle",
                        "D:/DevPilotAi/ai-orchestrator-service",
                        List.of("Keep agents mockable.")));

        assertThat(response.status()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(response.ownerId()).isEqualTo("owner@example.com");
        assertThat(response.taskId()).isNotBlank();
        assertThat(response.progress()).isEqualTo(100);
        assertThat(response.repairAttempts()).isOne();
        assertThat(response.changedFiles())
                .contains("src/main/java/Example.java");
        assertThat(response.testResult().successful()).isTrue();
        assertThat(codingAgent.repairCalls).isOne();
    }

    @Test
    void failsAfterConfiguredRepairAttempts() {
        OrchestratorWorkflowService service = new OrchestratorWorkflowService(
                new InMemoryOrchestratorTaskRepository(),
                new FakeResearchAgent(),
                new FakePlanningAgent(),
                new FakeCodingAgent(),
                new FakeTestingAgent(List.of(
                        failingTests(),
                        failingTests(),
                        failingTests())),
                new FakeDocumentationAgent(),
                new OrchestratorProperties(2, Duration.ofMinutes(5),
                        Duration.ofSeconds(30)));

        TaskResponse response = service.createAndRun(
                "owner@example.com",
                new SoftwareTaskRequest("Break tests", "D:/workspace", List.of()));

        assertThat(response.status()).isEqualTo(TaskStatus.FAILED);
        assertThat(response.repairAttempts()).isEqualTo(2);
        assertThat(response.failureSummary())
                .contains("Tests failed after 2 repair attempts");
    }

    @Test
    void ownerCannotReadAnotherOwnersTask() {
        InMemoryOrchestratorTaskRepository repository =
                new InMemoryOrchestratorTaskRepository();
        OrchestratorWorkflowService service = new OrchestratorWorkflowService(
                repository,
                new FakeResearchAgent(),
                new FakePlanningAgent(),
                new FakeCodingAgent(),
                new FakeTestingAgent(List.of(successfulTests())),
                new FakeDocumentationAgent(),
                new OrchestratorProperties(2, Duration.ofMinutes(5),
                        Duration.ofSeconds(30)));
        TaskResponse created = service.createAndRun(
                "owner@example.com",
                new SoftwareTaskRequest("Task", "D:/workspace", List.of()));

        assertThatThrownBy(() -> service.get(
                "other@example.com",
                created.taskId()))
                .isInstanceOf(TaskNotFoundException.class);
        assertThat(service.list("other@example.com")).isEmpty();
    }

    @Test
    void completedCannotTransitionBackToCoding() {
        assertThat(TaskStatus.COMPLETED.canTransitionTo(TaskStatus.CODING))
                .isFalse();
    }

    @Test
    void doesNotAttemptRepairAfterTestTimeout() {
        FakeCodingAgent codingAgent = new FakeCodingAgent();
        OrchestratorWorkflowService service = new OrchestratorWorkflowService(
                new InMemoryOrchestratorTaskRepository(),
                new FakeResearchAgent(),
                new FakePlanningAgent(),
                codingAgent,
                new FakeTestingAgent(List.of(timedOutTests())),
                new FakeDocumentationAgent(),
                new OrchestratorProperties(2, Duration.ofMinutes(5),
                        Duration.ofSeconds(30)));

        TaskResponse response = service.createAndRun(
                "owner@example.com",
                new SoftwareTaskRequest("Timeout", "D:/workspace", List.of()));

        assertThat(response.status()).isEqualTo(TaskStatus.FAILED);
        assertThat(response.repairAttempts()).isZero();
        assertThat(codingAgent.repairCalls).isZero();
        assertThat(response.failureSummary()).contains("timed out");
    }

    private static TestResult successfulTests() {
        return new TestResult(
                TestStatus.PASSED, 0, "mvn test", Duration.ofMillis(10),
                "BUILD SUCCESS", false, "Approved tests passed.", List.of());
    }

    private static TestResult failingTests() {
        return new TestResult(
                TestStatus.FAILED, 1, "mvn test", Duration.ofMillis(10),
                "BUILD FAILURE", false, "Tests failed", List.of("BUILD FAILURE"));
    }

    private static TestResult timedOutTests() {
        return new TestResult(
                TestStatus.TIMED_OUT, -1, "mvn test", Duration.ofSeconds(30),
                "Timed out", false, "Approved tests timed out.", List.of());
    }

    private static ResearchResult completeResearch() {
        RetrievedSource source = new RetrievedSource(
                "Architecture",
                "Orchestrator",
                1);
        WorkspaceFileEvidence file = new WorkspaceFileEvidence(
                "src/main/java/Example.java",
                "class",
                "class Example");

        return new ResearchResult(
                "task-id",
                "Task",
                "D:/workspace",
                "Task",
                "Use a lifecycle service.",
                List.of(new TechnicalEvidence("Use a lifecycle service.", source)),
                List.of(source),
                List.of(file),
                List.of("class: src/main/java/Example.java"),
                List.of("Implement the lifecycle."),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                true,
                false,
                true,
                null);
    }

    private static class FakeResearchAgent extends ResearchAgent {

        FakeResearchAgent() {
            super((task, history) -> null, new McpWorkspaceClient() {
                @Override
                public List<WorkspaceFileEvidence> searchRelevantFiles(
                        String workspaceId,
                        List<String> searchTerms) {

                    return List.of();
                }

                @Override
                public ApprovedTestExecution runApprovedTests(String workspaceId) {
                    return new ApprovedTestExecution(
                            "mvn test", 0, false, Duration.ZERO,
                            "BUILD SUCCESS", false);
                }
            });
        }

        @Override
        public ResearchResult research(
                String taskId,
                String task,
                String workspaceId,
                List<String> conversationHistory) {

            return completeResearch();
        }
    }

    private static class FakePlanningAgent implements PlanningAgent {

        @Override
        public ImplementationPlan plan(
                String task,
                ResearchResult researchResult) {

            return new ImplementationPlan(
                    "Plan",
                    List.of("Edit files", "Run tests"),
                    List.of("src/main/java/Example.java"),
                    List.of(),
                    true,
                    null);
        }
    }

    private static class FakeCodingAgent implements CodingAgent {

        private int repairCalls;

        @Override
        public CodingResult proposeAndApply(
                String task,
                ResearchResult researchResult,
                ImplementationPlan implementationPlan) {

            return new CodingResult(
                    true,
                    "Applied initial change.",
                    List.of("src/main/java/Example.java"),
                    List.of(),
                    List.of(new CodingChange("src/main/java/Example.java",
                            "updated", "Initial change")),
                    List.of());
        }

        @Override
        public CodingResult repair(
                String task,
                ResearchResult researchResult,
                ImplementationPlan implementationPlan,
                TestResult failedTestResult,
                int attemptNumber) {

            repairCalls++;
            return new CodingResult(
                    true,
                    "Applied repair.",
                    List.of("src/main/java/Example.java"),
                    List.of(failedTestResult.output()),
                    List.of(new CodingChange("src/main/java/Example.java",
                            "updated", "Repair")),
                    List.of());
        }
    }

    private static class FakeTestingAgent implements TestingAgent {

        private final List<TestResult> results;
        private int calls;

        FakeTestingAgent(List<TestResult> results) {
            this.results = new ArrayList<>(results);
        }

        @Override
        public TestResult runApprovedTests(
                String task,
                List<String> changedFiles,
                String workspaceId) {

            TestResult fallback = results.get(results.size() - 1);
            return calls < results.size() ? results.get(calls++) : fallback;
        }
    }

    private static class FakeDocumentationAgent implements DocumentationAgent {

        @Override
        public DocumentationResult documentSuccess(DocumentationContext context) {
            return new DocumentationResult(
                    true, "Complete.", List.of(), List.of(), List.of(),
                    List.of(), List.of(), "Approved tests passed.", List.of(),
                    false, null);
        }

        @Override
        public DocumentationResult documentFailure(
                DocumentationContext context,
                String failureReason) {

            return new DocumentationResult(
                    false, "Failed.", List.of(), List.of(), List.of(),
                    List.of(), List.of(), "No approved test result was recorded.",
                    List.of(), false, failureReason);
        }
    }
}
