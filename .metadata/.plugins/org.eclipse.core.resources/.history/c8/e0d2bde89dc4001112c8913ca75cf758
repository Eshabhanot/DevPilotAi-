
package com.devpilot.knowledge.controller;

import com.devpilot.knowledge.dto.QueryRewriteRequest;
import com.devpilot.knowledge.dto.QueryRewriteResponse;
import com.devpilot.knowledge.service.QueryRewriteService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/knowledge/query")
public class QueryRewriteController {

    private final QueryRewriteService queryRewriteService;

    public QueryRewriteController(
            QueryRewriteService queryRewriteService) {
        this.queryRewriteService = queryRewriteService;
    }

    @PostMapping("/rewrite")
    public QueryRewriteResponse rewrite(
            @Valid @RequestBody QueryRewriteRequest request) {

        String rewrittenQuery = queryRewriteService.rewrite(
                request.question(),
                request.conversationHistory()
        );

        return new QueryRewriteResponse(
                request.question(),
                rewrittenQuery
        );
    }
}
