package com.devpilot.mcp.dto;

public record FileContents(String path, String content, boolean truncated) {
}
