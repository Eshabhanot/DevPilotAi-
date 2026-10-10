package com.devpilot.auth.dto;

public record AuthResponse(
    String message,
    String token,
    String tokenType,
    long expiresIn
) {}
