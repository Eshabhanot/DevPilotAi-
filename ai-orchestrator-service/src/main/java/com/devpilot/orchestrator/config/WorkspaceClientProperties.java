package com.devpilot.orchestrator.config;

import java.nio.file.Path;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "devpilot.mcp")
public record WorkspaceClientProperties(
        @NotNull Path workspaceRoot
) {}
