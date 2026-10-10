package com.devpilot.orchestrator.service;

import java.util.List;

import com.devpilot.orchestrator.dto.CodingResult;
import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.TestResult;
import org.springframework.stereotype.Service;

@Service
public class ControlledCodingAgent implements CodingAgent {

    @Override
    public CodingResult proposeAndApply(
            String task,
            ResearchResult researchResult,
            ImplementationPlan implementationPlan) {

        if (implementationPlan == null || !implementationPlan.complete()) {
            return new CodingResult(
                    false,
                    "Coding was skipped because the implementation plan was incomplete.",
                    List.of(),
                List.of("Plan failure: " + failureReason(implementationPlan)),
                List.of(),
                List.of());
        }

        return new CodingResult(
                true,
                "Prepared a controlled code-change proposal from research and workspace evidence. "
                        + "No default file edits were applied because no model-backed edit provider is configured.",
                List.of(),
                List.of("Default coding agent is conservative and does not synthesize file edits."),
                List.of(),
                List.of());
    }

    @Override
    public CodingResult repair(
            String task,
            ResearchResult researchResult,
            ImplementationPlan implementationPlan,
            TestResult failedTestResult,
            int attemptNumber) {

        return new CodingResult(
                false,
                "Automated repair attempt " + attemptNumber
                        + " could not apply changes with the default coding agent.",
                List.of(),
                List.of(truncate(failedTestResult == null
                        ? "No test failure output was available."
                        : failedTestResult.output())),
                List.of(),
                List.of());
    }

    private String failureReason(ImplementationPlan implementationPlan) {
        if (implementationPlan == null || implementationPlan.failureReason() == null) {
            return "UNKNOWN";
        }

        return implementationPlan.failureReason();
    }

    private String truncate(String output) {
        if (output == null || output.isBlank()) {
            return "";
        }

        return output.length() <= 1000 ? output : output.substring(0, 1000);
    }
}
