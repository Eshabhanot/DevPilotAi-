package com.devpilot.knowledge.service;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

@Service
public class ClasspathPdfIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(
            ClasspathPdfIngestionService.class);

    private final ResourcePatternResolver resourcePatternResolver;
    private final PdfExtractionService pdfExtractionService;
    private final DocumentIngestionService documentIngestionService;

    public ClasspathPdfIngestionService(
            ResourcePatternResolver resourcePatternResolver,
            PdfExtractionService pdfExtractionService,
            DocumentIngestionService documentIngestionService) {
        this.resourcePatternResolver = resourcePatternResolver;
        this.pdfExtractionService = pdfExtractionService;
        this.documentIngestionService = documentIngestionService;
    }

    public IngestionSummary ingest(String resourcePattern) {
        int discovered = 0;
        int succeeded = 0;
        int failed = 0;

        try {
            for (Resource resource : resourcePatternResolver.getResources(resourcePattern)) {
                discovered++;
                try {
                    byte[] pdfBytes;
                    try (InputStream inputStream = resource.getInputStream()) {
                        pdfBytes = inputStream.readAllBytes();
                    }
                    String title = resource.getFilename();
                    String sourceLocation = "classpath:/knowledge/" + title;
                    int chunks = documentIngestionService.ingest(
                            title,
                            pdfExtractionService.extractText(pdfBytes),
                            pdfBytes.length,
                            "classpath",
                            sourceLocation,
                            sha256(pdfBytes));
                    succeeded++;
                    logger.info("Ingested bundled knowledge document '{}' ({} chunks).",
                            title, chunks);
                } catch (Exception exception) {
                    failed++;
                    logger.warn("Unable to ingest bundled knowledge document '{}': {}",
                            resource.getFilename(), exception.getMessage());
                }
            }
        } catch (IOException exception) {
            logger.warn("Unable to discover bundled knowledge documents for pattern '{}': {}",
                    resourcePattern, exception.getMessage());
            return new IngestionSummary(discovered, succeeded, failed + 1);
        }

        if (discovered == 0) {
            logger.warn("No bundled knowledge PDFs were found for pattern '{}'.",
                    resourcePattern);
        }
        return new IngestionSummary(discovered, succeeded, failed);
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    public record IngestionSummary(int discovered, int succeeded, int failed) {
    }
}
