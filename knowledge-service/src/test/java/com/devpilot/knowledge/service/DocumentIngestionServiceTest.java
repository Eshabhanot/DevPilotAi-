package com.devpilot.knowledge.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

class DocumentIngestionServiceTest {

    @Test
    void storesStableChunkMetadataAndSkipsAnUnchangedDocument() {
        RecordingVectorStore vectorStore = new RecordingVectorStore();
        DocumentIngestionService service = new DocumentIngestionService(
                vectorStore, new HeadingAwareChunker());

        int firstChunkCount = service.ingest(
                "guide.pdf", "# Guide\nThis is searchable bundled content.",
                42L, "classpath", "classpath:/knowledge/guide.pdf", "digest-one");
        int secondChunkCount = service.ingest(
                "guide.pdf", "# Guide\nThis is searchable bundled content.",
                42L, "classpath", "classpath:/knowledge/guide.pdf", "digest-one");

        assertEquals(1, firstChunkCount);
        assertEquals(firstChunkCount, secondChunkCount);
        assertEquals(1, vectorStore.addCalls);
        assertEquals(1, vectorStore.documents.size());

        Document chunk = vectorStore.documents.getFirst();
        assertEquals("classpath", chunk.getMetadata().get("sourceType"));
        assertEquals("classpath:/knowledge/guide.pdf",
                chunk.getMetadata().get("sourceLocation"));
        assertEquals("digest-one", chunk.getMetadata().get("contentSha256"));
        assertEquals("guide.pdf", chunk.getMetadata().get("title"));
        assertEquals(0, chunk.getMetadata().get("chunkIndex"));
        assertTrue(chunk.getId() != null && !chunk.getId().isBlank());
    }

    @Test
    void treatsChangedContentAsANewDocumentVersion() {
        RecordingVectorStore vectorStore = new RecordingVectorStore();
        DocumentIngestionService service = new DocumentIngestionService(
                vectorStore, new HeadingAwareChunker());

        service.ingest("guide.pdf", "First version.", 10L, "classpath",
                "classpath:/knowledge/guide.pdf", "digest-one");
        String firstDocumentId = (String) vectorStore.documents.getFirst()
                .getMetadata().get("documentId");

        service.ingest("guide.pdf", "Second version.", 11L, "classpath",
                "classpath:/knowledge/guide.pdf", "digest-two");
        String secondDocumentId = (String) vectorStore.documents.getLast()
                .getMetadata().get("documentId");

        assertEquals(2, vectorStore.addCalls);
        assertEquals(2, service.listDocuments().size());
        assertNotEquals(firstDocumentId, secondDocumentId);
    }

    static final class RecordingVectorStore implements VectorStore {

        final List<Document> documents = new ArrayList<>();
        int addCalls;

        @Override
        public void add(List<Document> documents) {
            addCalls++;
            this.documents.addAll(documents);
        }

        @Override
        public List<Document> similaritySearch(SearchRequest request) {
            return List.of();
        }

        @Override
        public void delete(List<String> idList) {
        }

        @Override
        public void delete(org.springframework.ai.vectorstore.filter.Filter.Expression expression) {
        }
    }
}
