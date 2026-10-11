package com.devpilot.knowledge.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

class ClasspathPdfIngestionServiceTest {

    @Test
    void ingestsBundledPdfsAndDoesNotReembedUnchangedResources() {
        DocumentIngestionServiceTest.RecordingVectorStore vectorStore =
                new DocumentIngestionServiceTest.RecordingVectorStore();
        DocumentIngestionService ingestionService = new DocumentIngestionService(
                vectorStore, new HeadingAwareChunker());
        ClasspathPdfIngestionService service = new ClasspathPdfIngestionService(
                new PathMatchingResourcePatternResolver(),
                new PdfExtractionService(),
                ingestionService);

        ClasspathPdfIngestionService.IngestionSummary first = service.ingest(
                "classpath*:/knowledge/*.pdf");
        int firstAddCalls = vectorStore.addCalls;
        int firstDocumentCount = vectorStore.documents.size();

        ClasspathPdfIngestionService.IngestionSummary second = service.ingest(
                "classpath*:/knowledge/*.pdf");

        assertEquals(4, first.discovered());
        assertEquals(4, first.succeeded());
        assertEquals(0, first.failed());
        assertTrue(firstDocumentCount > 0);
        assertEquals(4, ingestionService.listDocuments().size());
        assertEquals(firstAddCalls, vectorStore.addCalls);
        assertEquals(firstDocumentCount, vectorStore.documents.size());
        assertEquals(4, second.succeeded());
        assertEquals(0, second.failed());
    }
}
