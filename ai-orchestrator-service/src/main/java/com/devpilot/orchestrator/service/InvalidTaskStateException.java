package com.devpilot.orchestrator.service;

public class InvalidTaskStateException extends RuntimeException {

    public InvalidTaskStateException(String message) {
        super(message);
    }
}
