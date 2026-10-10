package com.devpilot.mcp.dto;

import java.util.List;

public record ToolResult<T>(boolean success, String message, T data, List<String> changedPaths) {

    public static <T> ToolResult<T> success(String message, T data) {
        return new ToolResult<>(true, message, data, List.of());
    }

    public static <T> ToolResult<T> changed(String message, T data, List<String> changedPaths) {
        return new ToolResult<>(true, message, data, List.copyOf(changedPaths));
    }

    public static ToolResult<Void> failure(String message) {
        return new ToolResult<>(false, message, null, List.of());
    }
}
