package com.devpilot.auth.dto;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String message
) {}
