package com.devpilot.mcp.service;

import java.util.regex.Pattern;

final class TestOutputSanitizer {

    private static final Pattern SENSITIVE_ASSIGNMENT = Pattern.compile(
            "(?im)(\\b(?:password|secret|credential|api[-_.]?key|access[-_.]?token)"
                    + "[a-z0-9_.-]*\\b\\s*[:=]\\s*)([^\\s,;]+)");

    private TestOutputSanitizer() {
    }

    static String sanitize(String output) {
        if (output == null || output.isBlank()) {
            return "";
        }
        return SENSITIVE_ASSIGNMENT.matcher(output)
                .replaceAll("$1[REDACTED]");
    }
}
