package com.devpilot.orchestrator.service;

import com.devpilot.orchestrator.dto.TestResult;

import java.util.List;

public interface TestingAgent {

    TestResult runApprovedTests(
            String task,
            List<String> changedFiles,
            String workspaceId);
}
