package com.devpilot.orchestrator.service;

import java.util.ArrayList;
import java.util.List;

import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.springframework.stereotype.Service;

@Service
public class EvidenceBasedPlanningAgent implements PlanningAgent {

    @Override
    public ImplementationPlan plan(String task, ResearchResult researchResult) {
        if (researchResult == null || !researchResult.complete()) {
            return new ImplementationPlan(
                    "Planning could not continue without complete research.",
                    List.of(),
                    List.of(),
                    List.of("Research evidence is incomplete."),
                    false,
                    "INCOMPLETE_RESEARCH");
        }

        List<String> targetFiles = researchResult.relevantFiles().stream()
                .map(WorkspaceFileEvidence::path)
                .distinct()
                .toList();
        List<String> steps = new ArrayList<>();
        steps.add("Use retrieved source evidence to constrain the implementation.");
        steps.add("Inspect the target files before proposing edits.");
        steps.add("Apply only controlled source or documentation changes.");
        steps.add("Run the approved test command.");
        steps.add("Document the outcome and retained diagnostics.");

        return new ImplementationPlan(
                "Implementation plan for: " + researchResult.taskSummary(),
                steps,
                targetFiles,
                researchResult.potentialRisks(),
                !targetFiles.isEmpty(),
                targetFiles.isEmpty() ? "NO_TARGET_FILES" : null);
    }
}
