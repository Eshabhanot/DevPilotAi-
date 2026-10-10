
package com.devpilot.knowledge.service;

import java.io.IOException;
import java.io.InputStream;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PdfExtractionService {

    public String extractText(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();
             PDDocument document =
                     Loader.loadPDF(inputStream.readAllBytes())) {

            if (document.isEncrypted()) {
                throw new IllegalArgumentException(
                        "Encrypted PDFs are not supported.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document).trim();

            if (text.isBlank()) {
                throw new IllegalArgumentException(
                        "No selectable text found. "
                        + "Scanned PDFs may require OCR.");
            }

            return text;
        }
    }
}
