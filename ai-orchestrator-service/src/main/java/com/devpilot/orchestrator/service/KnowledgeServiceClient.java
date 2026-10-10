package com.devpilot.orchestrator.service;

import java.util.List;

import com.devpilot.orchestrator.dto.KnowledgeAskResponse;

public interface KnowledgeServiceClient {

    KnowledgeAskResponse ask(String task, List<String> conversationHistory);
}
