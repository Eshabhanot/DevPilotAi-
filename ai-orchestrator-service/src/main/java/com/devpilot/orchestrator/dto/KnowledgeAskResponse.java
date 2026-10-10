package com.devpilot.orchestrator.dto;

import java.util.List;

public record KnowledgeAskResponse(
        String question,
        String answer,
        List<SourceReference> sources
) {
    public record SourceReference(
            String title,
            String headingPath,
            Object chunkIndex
    ) {}
}
