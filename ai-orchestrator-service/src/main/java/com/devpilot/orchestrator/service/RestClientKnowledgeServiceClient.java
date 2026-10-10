package com.devpilot.orchestrator.service;

import java.util.List;

import com.devpilot.orchestrator.dto.KnowledgeAskRequest;
import com.devpilot.orchestrator.dto.KnowledgeAskResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class RestClientKnowledgeServiceClient implements KnowledgeServiceClient {

    private final RestClient knowledgeRestClient;

    public RestClientKnowledgeServiceClient(RestClient knowledgeRestClient) {
        this.knowledgeRestClient = knowledgeRestClient;
    }

    @Override
    public KnowledgeAskResponse ask(
            String task,
            List<String> conversationHistory) {

        try {
            KnowledgeAskResponse response = knowledgeRestClient.post()
                    .uri("/api/knowledge/ask")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new KnowledgeAskRequest(task, conversationHistory))
                    .retrieve()
                    .body(KnowledgeAskResponse.class);

            if (response == null) {
                throw new KnowledgeServiceUnavailableException(
                        "Knowledge Service returned an empty response.",
                        null);
            }

            return response;

        } catch (RestClientException exception) {
            throw new KnowledgeServiceUnavailableException(
                    "Knowledge Service is unavailable or returned an error.",
                    exception);
        }
    }
}
