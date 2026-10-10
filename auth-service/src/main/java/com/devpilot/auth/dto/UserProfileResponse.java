package com.devpilot.auth.dto;

import java.time.Instant;

public record UserProfileResponse(
        Long id,
        String name,
        String email,
        String role,
        Instant createdAt
) {}
