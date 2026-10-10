package com.devpilot.orchestrator.controller;

import java.time.Instant;
import java.util.List;

import com.devpilot.orchestrator.dto.ApiError;
import com.devpilot.orchestrator.service.AuthenticationRequiredException;
import com.devpilot.orchestrator.service.InvalidTaskStateException;
import com.devpilot.orchestrator.service.TaskNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        List<String> details = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": "
                        + error.getDefaultMessage())
                .toList();

        return error(HttpStatus.BAD_REQUEST,
                "Validation failed.",
                request,
                details);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiError> missingHeader(
            MissingRequestHeaderException exception,
            HttpServletRequest request) {

        return error(HttpStatus.UNAUTHORIZED,
                "Authenticated user header is required.",
                request,
                List.of(exception.getHeaderName()));
    }

    @ExceptionHandler(AuthenticationRequiredException.class)
    public ResponseEntity<ApiError> authenticationRequired(
            AuthenticationRequiredException exception,
            HttpServletRequest request) {

        return error(HttpStatus.UNAUTHORIZED,
                exception.getMessage(),
                request,
                List.of());
    }

    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<ApiError> notFound(
            TaskNotFoundException exception,
            HttpServletRequest request) {

        return error(HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                List.of());
    }

    @ExceptionHandler(InvalidTaskStateException.class)
    public ResponseEntity<ApiError> invalidState(
            InvalidTaskStateException exception,
            HttpServletRequest request) {

        return error(HttpStatus.CONFLICT,
                exception.getMessage(),
                request,
                List.of());
    }

    private ResponseEntity<ApiError> error(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            List<String> details) {

        return ResponseEntity.status(status)
                .body(new ApiError(
                        Instant.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        message,
                        request.getRequestURI(),
                        details));
    }
}
