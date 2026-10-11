package com.devpilot.knowledge.dto;

import java.time.Instant;

public record KnowledgeDocumentResponse(
        String id,
        String name,
        String source,
        int chunks,
        Instant uploadedAt,
        long sizeBytes
) {}
