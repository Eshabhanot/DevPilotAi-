package com.devpilot.mcp.dto;

import java.time.Duration;

public record TestExecution(
        String projectPath,
        int exitCode,
        boolean timedOut,
        Duration duration,
        String output,
        boolean outputTruncated
) {}
