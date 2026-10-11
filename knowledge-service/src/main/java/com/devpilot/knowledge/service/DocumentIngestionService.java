
package com.devpilot.knowledge.service;

import com.devpilot.knowledge.dto.KnowledgeDocumentResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class DocumentIngestionService {

    private final VectorStore vectorStore;
    private final HeadingAwareChunker chunker;
    private final ConcurrentMap<String, KnowledgeDocumentResponse> documents =
            new ConcurrentHashMap<>();

    public DocumentIngestionService(
            VectorStore vectorStore,
            HeadingAwareChunker chunker) {
        this.vectorStore = vectorStore;
        this.chunker = chunker;
    }

    public int ingest(String title, String content) {
        return ingest(title, content, 0L, "My Upload");
    }

    public int ingest(String title, String content, long sizeBytes, String source) {
        String sourceLocation = "upload:" + title;
        String contentSha256 = sha256(content.getBytes(StandardCharsets.UTF_8));
        return ingest(title, content, sizeBytes, source, sourceLocation, contentSha256);
    }

    public int ingest(String title, String content, long sizeBytes, String source,
            String sourceLocation, String contentSha256) {

        if (content == null || content.isBlank()) {
            return 0;
        }

        String sourceKey = sourceLocation + ":" + contentSha256;
        KnowledgeDocumentResponse existing = documents.get(sourceKey);
        if (existing != null) {
            return existing.chunks();
        }

        synchronized (documents) {
            existing = documents.get(sourceKey);
            if (existing != null) {
                return existing.chunks();
            }

        String documentId = stableId("document:" + sourceKey);

        // 2. Split the content into heading-aware chunks.
        List<HeadingAwareChunker.Chunk> chunks =
                chunker.split(content);

        // 3. Convert chunks into Spring AI Documents.
        List<Document> documents = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {

            HeadingAwareChunker.Chunk chunk = chunks.get(i);

            Map<String, Object> metadata = Map.of(
                    "documentId", documentId,
                    "sourceType", source,
                    "sourceLocation", sourceLocation,
                    "contentSha256", contentSha256,
                    "title", title,
                    "chunkIndex", i,
                    "headingPath", chunk.headingPath()
            );

            Document document = new Document(
                    stableId("chunk:" + sourceKey + ":" + i),
                    chunk.content(),
                    metadata
            );

            documents.add(document);
        }

        // 4. Generate embeddings and save the chunks.
        if (!documents.isEmpty()) {
            vectorStore.add(documents);
        }

        if (!documents.isEmpty()) {
            this.documents.put(
                    sourceKey,
                    new KnowledgeDocumentResponse(
                            documentId,
                            title,
                            source,
                            documents.size(),
                            Instant.now(),
                            sizeBytes
                    )
            );
        }

        // 5. Return the number of stored chunks.
            return documents.size();
        }
    }

    public List<KnowledgeDocumentResponse> listDocuments() {
        return documents.values().stream()
                .sorted(Comparator.comparing(KnowledgeDocumentResponse::uploadedAt).reversed())
                .toList();
    }

    private String stableId(String value) {
        return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8))
                .toString();
    }

    private String sha256(byte[] bytes) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }
}
