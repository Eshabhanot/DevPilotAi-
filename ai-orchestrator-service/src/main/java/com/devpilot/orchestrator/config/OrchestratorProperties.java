package com.devpilot.orchestrator.config;

import java.time.Duration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "devpilot.orchestrator")
public record OrchestratorProperties(
        @Min(0) int maxRepairAttempts,
        @NotNull Duration taskTimeout,
        @NotNull Duration testTimeout
) {}
