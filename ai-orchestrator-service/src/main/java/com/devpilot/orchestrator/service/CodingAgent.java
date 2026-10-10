package com.devpilot.orchestrator.service;

import com.devpilot.orchestrator.dto.CodingResult;
import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.TestResult;

public interface CodingAgent {

    CodingResult proposeAndApply(
            String task,
            ResearchResult researchResult,
            ImplementationPlan implementationPlan);

    CodingResult repair(
            String task,
            ResearchResult researchResult,
            ImplementationPlan implementationPlan,
            TestResult failedTestResult,
            int attemptNumber);
}
