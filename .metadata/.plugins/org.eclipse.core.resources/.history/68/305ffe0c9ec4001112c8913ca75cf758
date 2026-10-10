
package com.devpilot.knowledge.dto;

import java.util.List;
import java.util.Map;

public record KnowledgeSearchResponse(
        String originalQuestion,
        String rewrittenQuery,
        List<SearchResult> results
) {
    public record SearchResult(
            String content,
            Map<String, Object> metadata
    ) {}
}
