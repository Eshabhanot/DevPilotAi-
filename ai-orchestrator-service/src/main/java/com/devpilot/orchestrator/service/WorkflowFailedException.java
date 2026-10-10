package com.devpilot.orchestrator.service;

public class WorkflowFailedException extends RuntimeException {

    public WorkflowFailedException(String message) {
        super(message);
    }
}
