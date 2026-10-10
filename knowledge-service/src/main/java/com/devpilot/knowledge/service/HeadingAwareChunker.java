
package com.devpilot.knowledge.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class HeadingAwareChunker {

    private static final int MAX_CHUNK_SIZE = 1200;
    private static final int OVERLAP_SIZE = 150;

    private static final Pattern MARKDOWN_HEADING =
            Pattern.compile("^(#{1,6})\\s+(.+)$");

    private static final Pattern NUMBERED_HEADING =
            Pattern.compile("^(\\d+(?:\\.\\d+)*\\.?)\\s+(.+)$");

    public record Chunk(String content, String headingPath) {}

    private static class Section {
        private final String headingPath;
        private final StringBuilder content = new StringBuilder();

        private Section(String headingPath) {
            this.headingPath = headingPath;
        }
    }

    public List<Chunk> split(String text) {
        List<Chunk> chunks = new ArrayList<>();
        List<Section> sections = new ArrayList<>();

        String[] headingStack = new String[6];
        Section currentSection = new Section("General");

        boolean insideCodeBlock = false;

        for (String rawLine : text.replace("\r\n", "\n").split("\n")) {
            String line = rawLine.trim();

            if (line.startsWith("```") || line.startsWith("~~~")) {
                insideCodeBlock = !insideCodeBlock;
            }

            if (!insideCodeBlock) {
                Matcher markdown = MARKDOWN_HEADING.matcher(line);

                if (markdown.matches()) {
                    addSectionIfNotEmpty(sections, currentSection);

                    int level = markdown.group(1).length();
                    String heading = markdown.group(2).trim();

                    headingStack[level - 1] = heading;

                    for (int i = level; i < headingStack.length; i++) {
                        headingStack[i] = null;
                    }

                    currentSection =
                            new Section(buildHeadingPath(headingStack));
                    continue;
                }

                Matcher numbered = NUMBERED_HEADING.matcher(line);

                if (numbered.matches()) {
                    addSectionIfNotEmpty(sections, currentSection);

                    String number = numbered.group(1);
                    String heading = number + " " + numbered.group(2);

                    // A simple numbering-based approximation of heading depth.
                    int level = Math.min(
                            6, number.split("\\.").length);

                    headingStack[level - 1] = heading;

                    for (int i = level; i < headingStack.length; i++) {
                        headingStack[i] = null;
                    }

                    currentSection =
                            new Section(buildHeadingPath(headingStack));
                    continue;
                }
            }

            if (!line.isEmpty()) {
                if (!currentSection.content.isEmpty()) {
                    currentSection.content.append(' ');
                }
                currentSection.content.append(line);
            }
        }

        addSectionIfNotEmpty(sections, currentSection);

        for (Section section : sections) {
            addSectionChunks(section, chunks);
        }

        return chunks;
    }

    private void addSectionIfNotEmpty(
            List<Section> sections, Section section) {

        if (!section.content.isEmpty()) {
            sections.add(section);
        }
    }

    private String buildHeadingPath(String[] headingStack) {
        List<String> headings = new ArrayList<>();

        for (String heading : headingStack) {
            if (heading != null && !heading.isBlank()) {
                headings.add(heading);
            }
        }

        return headings.isEmpty()
                ? "General"
                : String.join(" > ", headings);
    }

    private void addSectionChunks(
            Section section, List<Chunk> result) {

        String content = section.content.toString().trim();
        int start = 0;

        while (start < content.length()) {
            int end = Math.min(
                    start + MAX_CHUNK_SIZE, content.length());

            if (end < content.length()) {
                int boundary = content.lastIndexOf(' ', end);

                if (boundary > start) {
                    end = boundary;
                }
            }

            String piece = content.substring(start, end).trim();

            String chunkText =
                    "Heading: " + section.headingPath
                    + "\nContent: " + piece;

            result.add(new Chunk(chunkText, section.headingPath));

            if (end >= content.length()) {
                break;
            }

            start = Math.max(0, end - OVERLAP_SIZE);
        }
    }
}
