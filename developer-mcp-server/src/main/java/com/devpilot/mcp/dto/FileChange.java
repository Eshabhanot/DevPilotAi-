package com.devpilot.mcp.dto;

public record FileChange(String path, String backupPath, String previousSha256, String currentSha256) {
}
