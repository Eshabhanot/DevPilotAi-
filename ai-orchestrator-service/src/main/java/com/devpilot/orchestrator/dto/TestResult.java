package com.devpilot.orchestrator.dto;

import java.time.Duration;
import java.util.List;

public record TestResult(
        TestStatus status,
        int exitCode,
        String command,
        Duration duration,
        String output,
        boolean outputTruncated,
        String summary,
        List<String> relevantFailureMessages
) {
    public boolean successful() {
        return status == TestStatus.PASSED;
    }

    public boolean timedOut() {
        return status == TestStatus.TIMED_OUT;
    }

    public String failureSummary() {
        return successful() ? null : summary;
    }
}
