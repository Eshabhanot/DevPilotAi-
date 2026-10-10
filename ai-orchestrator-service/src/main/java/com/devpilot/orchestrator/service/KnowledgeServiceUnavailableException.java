package com.devpilot.orchestrator.service;

public class KnowledgeServiceUnavailableException extends RuntimeException {

    public KnowledgeServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
