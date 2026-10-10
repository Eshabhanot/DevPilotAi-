package com.devpilot.orchestrator.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.dto.TestStatus;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.junit.jupiter.api.Test;

class ApprovedTestingAgentTest {

    @Test
    void reportsPassedApprovedTests() {
        FakeMcpWorkspaceClient client = new FakeMcpWorkspaceClient(
                execution(0, false, "BUILD SUCCESS", false));

        TestResult result = new ApprovedTestingAgent(client).runApprovedTests(
                "Implement endpoint", List.of("src/main/java/Endpoint.java"),
                "D:/workspace");

        assertThat(result.status()).isEqualTo(TestStatus.PASSED);
        assertThat(result.exitCode()).isZero();
        assertThat(result.duration()).isEqualTo(Duration.ofMillis(125));
        assertThat(result.relevantFailureMessages()).isEmpty();
        assertThat(client.workspaceId).isEqualTo("D:/workspace");
    }

    @Test
    void reportsObservedFailureLinesWithoutInventingOutcome() {
        TestResult result = new ApprovedTestingAgent(new FakeMcpWorkspaceClient(
                execution(1, false,
                        "[ERROR] Tests run: 1, Failures: 1\n"
                                + "expected: <200> but was: <500>",
                        false))).runApprovedTests(
                "Implement endpoint", List.of(), "D:/workspace");

        assertThat(result.status()).isEqualTo(TestStatus.FAILED);
        assertThat(result.successful()).isFalse();
        assertThat(result.relevantFailureMessages())
                .contains("[ERROR] Tests run: 1, Failures: 1");
        assertThat(result.summary()).contains("Failures: 1");
    }

    @Test
    void reportsTimeoutAndBoundedOutputMetadata() {
        TestResult result = new ApprovedTestingAgent(new FakeMcpWorkspaceClient(
                execution(-1, true, "Timed out after 60 seconds", true)))
                .runApprovedTests("Implement endpoint", List.of(), "D:/workspace");

        assertThat(result.status()).isEqualTo(TestStatus.TIMED_OUT);
        assertThat(result.timedOut()).isTrue();
        assertThat(result.outputTruncated()).isTrue();
        assertThat(result.summary()).contains("timed out");
    }

    @Test
    void reportsMcpExecutionError() {
        TestResult result = new ApprovedTestingAgent(new FakeMcpWorkspaceClient(
                new WorkspaceInspectionException("MCP unavailable", null)))
                .runApprovedTests("Implement endpoint", List.of(), "D:/workspace");

        assertThat(result.status()).isEqualTo(TestStatus.EXECUTION_ERROR);
        assertThat(result.exitCode()).isEqualTo(-1);
        assertThat(result.summary()).contains("MCP unavailable");
    }

    private static ApprovedTestExecution execution(
            int exitCode,
            boolean timedOut,
            String output,
            boolean outputTruncated) {

        return new ApprovedTestExecution(
                "mvn test",
                exitCode,
                timedOut,
                Duration.ofMillis(125),
                output,
                outputTruncated);
    }

    private static class FakeMcpWorkspaceClient implements McpWorkspaceClient {

        private final ApprovedTestExecution execution;
        private final WorkspaceInspectionException failure;
        private String workspaceId;

        FakeMcpWorkspaceClient(ApprovedTestExecution execution) {
            this.execution = execution;
            this.failure = null;
        }

        FakeMcpWorkspaceClient(WorkspaceInspectionException failure) {
            this.execution = null;
            this.failure = failure;
        }

        @Override
        public List<WorkspaceFileEvidence> searchRelevantFiles(
                String workspaceId,
                List<String> searchTerms) {

            return List.of();
        }

        @Override
        public ApprovedTestExecution runApprovedTests(String workspaceId) {
            this.workspaceId = workspaceId;
            if (failure != null) {
                throw failure;
            }
            return execution;
        }
    }
}
