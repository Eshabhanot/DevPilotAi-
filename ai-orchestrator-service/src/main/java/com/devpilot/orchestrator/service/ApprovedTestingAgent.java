package com.devpilot.orchestrator.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.dto.TestStatus;
import org.springframework.stereotype.Service;

@Service
public class ApprovedTestingAgent implements TestingAgent {

    private final McpWorkspaceClient workspaceClient;

    public ApprovedTestingAgent(McpWorkspaceClient workspaceClient) {
        this.workspaceClient = workspaceClient;
    }

    @Override
    public TestResult runApprovedTests(
            String task,
            List<String> changedFiles,
            String workspaceId) {

        try {
            ApprovedTestExecution execution = workspaceClient.runApprovedTests(
                    workspaceId);
            return fromExecution(execution);
        } catch (WorkspaceInspectionException exception) {
            return new TestResult(
                    TestStatus.EXECUTION_ERROR,
                    -1,
                    "approved Maven test command",
                    Duration.ZERO,
                    "",
                    false,
                    "Approved test execution could not start: "
                            + safeMessage(exception),
                    List.of());
        }
    }

    private TestResult fromExecution(ApprovedTestExecution execution) {
        if (execution == null) {
            return new TestResult(
                    TestStatus.EXECUTION_ERROR,
                    -1,
                    "approved Maven test command",
                    Duration.ZERO,
                    "",
                    false,
                    "Approved test execution returned no result.",
                    List.of());
        }

        TestStatus status = execution.timedOut()
                ? TestStatus.TIMED_OUT
                : execution.exitCode() == 0 ? TestStatus.PASSED : TestStatus.FAILED;
        List<String> failures = relevantFailureMessages(execution.output());
        String summary = summary(status, execution.exitCode(), failures,
                execution.outputTruncated());

        return new TestResult(
                status,
                execution.exitCode(),
                execution.command(),
                execution.duration(),
                safeOutput(execution.output()),
                execution.outputTruncated(),
                summary,
                failures);
    }

    private List<String> relevantFailureMessages(String output) {
        if (output == null || output.isBlank()) {
            return List.of();
        }

        List<String> messages = new ArrayList<>();
        for (String line : output.split("\\R")) {
            String normalized = line.trim();
            String lower = normalized.toLowerCase();
            if (!normalized.isBlank() && (lower.contains("failure")
                    || lower.contains("error")
                    || lower.contains("exception")
                    || lower.contains("failed"))) {
                messages.add(normalized);
            }
            if (messages.size() == 10) {
                break;
            }
        }
        return List.copyOf(messages);
    }

    private String summary(
            TestStatus status,
            int exitCode,
            List<String> failures,
            boolean outputTruncated) {

        String suffix = outputTruncated ? " Test output was truncated." : "";
        return switch (status) {
            case PASSED -> "Approved tests passed." + suffix;
            case TIMED_OUT -> "Approved tests timed out." + suffix;
            case FAILED -> failures.isEmpty()
                    ? "Approved tests failed with exit code " + exitCode + "." + suffix
                    : "Approved tests failed: " + failures.getFirst() + suffix;
            case EXECUTION_ERROR -> "Approved test execution failed." + suffix;
        };
    }

    private String safeOutput(String output) {
        return output == null ? "" : output;
    }

    private String safeMessage(RuntimeException exception) {
        return exception.getMessage() == null || exception.getMessage().isBlank()
                ? exception.getClass().getSimpleName()
                : exception.getMessage();
    }
}
