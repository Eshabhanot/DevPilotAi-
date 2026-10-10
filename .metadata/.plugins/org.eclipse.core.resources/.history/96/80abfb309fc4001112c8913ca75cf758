
package com.devpilot.knowledge.dto;

import java.util.List;

public record RagAnswerResponse(
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
