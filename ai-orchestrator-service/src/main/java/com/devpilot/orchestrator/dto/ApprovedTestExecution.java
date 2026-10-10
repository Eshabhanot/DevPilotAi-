package com.devpilot.orchestrator.dto;

import java.time.Duration;

public record ApprovedTestExecution(
        String command,
        int exitCode,
        boolean timedOut,
        Duration duration,
        String output,
        boolean outputTruncated
) {}
