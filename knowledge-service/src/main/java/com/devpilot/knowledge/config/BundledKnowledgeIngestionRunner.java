package com.devpilot.knowledge.config;

import com.devpilot.knowledge.service.ClasspathPdfIngestionService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "devpilot.knowledge.startup-ingestion",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class BundledKnowledgeIngestionRunner implements ApplicationRunner {

    private static final String BUNDLED_PDF_PATTERN = "classpath*:/knowledge/*.pdf";

    private final ClasspathPdfIngestionService ingestionService;

    public BundledKnowledgeIngestionRunner(
            ClasspathPdfIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @Override
    public void run(ApplicationArguments args) {
        ingestionService.ingest(BUNDLED_PDF_PATTERN);
    }
}
