package com.devpilot.orchestrator.service;

public class TaskNotFoundException extends RuntimeException {

    public TaskNotFoundException(String taskId) {
        super("Task not found: " + taskId);
    }
}
