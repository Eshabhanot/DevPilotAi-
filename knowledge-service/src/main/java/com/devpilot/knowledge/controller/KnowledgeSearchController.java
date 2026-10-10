
package com.devpilot.knowledge.controller;

import com.devpilot.knowledge.dto.KnowledgeSearchResponse;
import com.devpilot.knowledge.dto.QueryRewriteRequest;
import com.devpilot.knowledge.service.KnowledgeSearchService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/knowledge/query")
public class KnowledgeSearchController {

    private final KnowledgeSearchService knowledgeSearchService;

    public KnowledgeSearchController(
            KnowledgeSearchService knowledgeSearchService) {
        this.knowledgeSearchService = knowledgeSearchService;
    }

    @PostMapping("/search")
    public KnowledgeSearchResponse search(
            @Valid @RequestBody QueryRewriteRequest request) {

        return knowledgeSearchService.search(
                request.question(),
                request.conversationHistory()
        );
    }
}
