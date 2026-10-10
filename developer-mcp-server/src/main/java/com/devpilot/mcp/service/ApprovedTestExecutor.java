package com.devpilot.mcp.service;

import com.devpilot.mcp.dto.TestExecution;

import java.nio.file.Path;
import java.time.Duration;

public interface ApprovedTestExecutor {
    TestExecution execute(Path projectDirectory, Duration timeout, int maxOutputCharacters);
}
