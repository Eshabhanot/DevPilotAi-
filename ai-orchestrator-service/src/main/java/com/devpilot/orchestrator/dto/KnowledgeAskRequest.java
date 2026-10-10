package com.devpilot.orchestrator.dto;

import java.util.List;

public record KnowledgeAskRequest(
        String question,
        List<String> conversationHistory
) {}
