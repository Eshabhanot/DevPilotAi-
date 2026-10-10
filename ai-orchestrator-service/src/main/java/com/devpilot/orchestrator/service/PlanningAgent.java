package com.devpilot.orchestrator.service;

import com.devpilot.orchestrator.dto.ImplementationPlan;
import com.devpilot.orchestrator.dto.ResearchResult;

public interface PlanningAgent {

    ImplementationPlan plan(String task, ResearchResult researchResult);
}
