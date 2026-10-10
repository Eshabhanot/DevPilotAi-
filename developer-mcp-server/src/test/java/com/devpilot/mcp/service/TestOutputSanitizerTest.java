package com.devpilot.mcp.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TestOutputSanitizerTest {

    @Test
    void redactsSecretLikeAssignmentsFromTestOutput() {
        String output = "apiKey=example-key\npassword: dont-print-this\nBUILD FAILURE";

        String sanitized = TestOutputSanitizer.sanitize(output);

        assertThat(sanitized).contains("apiKey=[REDACTED]");
        assertThat(sanitized).contains("password: [REDACTED]");
        assertThat(sanitized).doesNotContain("example-key", "dont-print-this");
    }
}
