package com.devpilot.orchestrator.service;

public class WorkflowCancelledException extends RuntimeException {

    public WorkflowCancelledException(String message) {
        super(message);
    }
}
