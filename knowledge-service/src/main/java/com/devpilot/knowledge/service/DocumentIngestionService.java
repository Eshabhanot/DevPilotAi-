
package com.devpilot.knowledge.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class DocumentIngestionService {

    private final VectorStore vectorStore;
    private final HeadingAwareChunker chunker;

    public DocumentIngestionService(
            VectorStore vectorStore,
            HeadingAwareChunker chunker) {
        this.vectorStore = vectorStore;
        this.chunker = chunker;
    }

    public int ingest(String title, String content) {

        // 1. Generate an ID for this uploaded document.
        String documentId = UUID.randomUUID().toString();

        // 2. Split the content into heading-aware chunks.
        List<HeadingAwareChunker.Chunk> chunks =
                chunker.split(content);

        // 3. Convert chunks into Spring AI Documents.
        List<Document> documents = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {

            HeadingAwareChunker.Chunk chunk = chunks.get(i);

            Map<String, Object> metadata = Map.of(
                    "documentId", documentId,
                    "title", title,
                    "chunkIndex", i,
                    "headingPath", chunk.headingPath()
            );

            Document document = new Document(
                    chunk.content(),
                    metadata
            );

            documents.add(document);
        }

        // 4. Generate embeddings and save the chunks.
        if (!documents.isEmpty()) {
            vectorStore.add(documents);
        }

        // 5. Return the number of stored chunks.
        return documents.size();
    }
}
