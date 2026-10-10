
package com.devpilot.knowledge.controller;

import com.devpilot.knowledge.service.DocumentIngestionService;
import com.devpilot.knowledge.service.PdfExtractionService;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/knowledge/documents")
public class PdfUploadController {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final PdfExtractionService pdfExtractionService;
    private final DocumentIngestionService documentIngestionService;

    public PdfUploadController(
            PdfExtractionService pdfExtractionService,
            DocumentIngestionService documentIngestionService) {
        this.pdfExtractionService = pdfExtractionService;
        this.documentIngestionService = documentIngestionService;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadPdf(
            @RequestParam("file") MultipartFile file) {

        try {
            // 1. Reject empty files.
            if (file.isEmpty()) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        "EMPTY_FILE",
                        "Please upload a non-empty PDF file.");
            }

            // 2. Check file size.
            if (file.getSize() > MAX_FILE_SIZE) {
                return error(
                        HttpStatus.PAYLOAD_TOO_LARGE,
                        "FILE_TOO_LARGE",
                        "Maximum allowed PDF size is 10 MB.");
            }

            // 3. Check filename and extension.
            String originalFilename = file.getOriginalFilename();

            if (originalFilename == null
                    || !originalFilename.toLowerCase()
                            .endsWith(".pdf")) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_FILENAME",
                        "Only PDF files are allowed.");
            }

            // 4. Validate the PDF signature.
            if (!hasPdfSignature(file)) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_PDF",
                        "The uploaded file is not a valid PDF file.");
            }

            // 5. Extract text from the PDF.
            String extractedText =
                    pdfExtractionService.extractText(file);

            if (extractedText == null
                    || extractedText.isBlank()) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        "NO_TEXT_FOUND",
                        "No selectable text found in the PDF. "
                                + "Scanned PDFs may require OCR.");
            }

            // 6. Chunk, embed and store through the existing service.
            String safeTitle = originalFilename
                    .replace('\\', '/');

            safeTitle = safeTitle.substring(
                    safeTitle.lastIndexOf('/') + 1);

            int chunksStored = documentIngestionService.ingest(
                    safeTitle,
                    extractedText);

            if (chunksStored == 0) {
                return error(
                        HttpStatus.BAD_REQUEST,
                        "NO_CHUNKS_CREATED",
                        "No document chunks could be created.");
            }

            // 7. Return the ingestion result.
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "message", "PDF ingested successfully",
                            "title", safeTitle,
                            "chunksStored", chunksStored));

        } catch (IllegalArgumentException exception) {
            return error(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_PDF",
                    exception.getMessage());

        } catch (IOException exception) {
            return error(
                    HttpStatus.BAD_REQUEST,
                    "PDF_READ_ERROR",
                    "Unable to read the uploaded PDF.");

        } catch (Exception exception) {
            return error(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "INGESTION_FAILED",
                    "PDF ingestion failed. Please try again.");
        }
    }

    private boolean hasPdfSignature(MultipartFile file)
            throws IOException {

        byte[] header = new byte[5];

        try (var inputStream = file.getInputStream()) {
            if (inputStream.read(header) != header.length) {
                return false;
            }
        }

        return header[0] == '%'
                && header[1] == 'P'
                && header[2] == 'D'
                && header[3] == 'F'
                && header[4] == '-';
    }

    private ResponseEntity<Map<String, Object>> error(
            HttpStatus status,
            String code,
            String message) {

        return ResponseEntity.status(status).body(
                Map.of(
                        "error", code,
                        "message", message));
    }
}
