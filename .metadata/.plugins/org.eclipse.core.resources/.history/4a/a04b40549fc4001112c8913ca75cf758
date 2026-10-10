
package com.devpilot.knowledge.controller;

import com.devpilot.knowledge.dto.QueryRewriteRequest;
import com.devpilot.knowledge.dto.RagAnswerResponse;
import com.devpilot.knowledge.service.RagAnswerService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/knowledge")
public class RagAnswerController {

    private final RagAnswerService ragAnswerService;

    public RagAnswerController(RagAnswerService ragAnswerService) {
        this.ragAnswerService = ragAnswerService;
    }

    @PostMapping("/ask")
    public RagAnswerResponse ask(
            @Valid @RequestBody QueryRewriteRequest request) {

        return ragAnswerService.answer(
                request.question(),
                request.conversationHistory()
        );
    }
}
