package com.devpilot.orchestrator.dto;

import java.util.List;

public record CodingConstraints(
        List<String> allowedDirectories,
        List<String> restrictedPathMarkers,
        boolean requireExistingFileRead,
        boolean allowNewFiles
) {
    public static CodingConstraints defaultConstraints() {
        return new CodingConstraints(
                List.of("src", "docs"),
                List.of(".env", "secret", "credential", "password", ".pem", ".key"),
                true,
                true);
    }
}
