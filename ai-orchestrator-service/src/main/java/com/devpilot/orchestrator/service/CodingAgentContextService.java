package com.devpilot.orchestrator.service;

import com.devpilot.orchestrator.dto.ResearchResult;
import org.springframework.stereotype.Service;

@Service
public class CodingAgentContextService {

    private ResearchResult latestResearchContext;

    public void prepareContext(ResearchResult researchResult) {
        if (!researchResult.complete()) {
            return;
        }

        this.latestResearchContext = researchResult;
    }

    public ResearchResult latestResearchContext() {
        return latestResearchContext;
    }
}
