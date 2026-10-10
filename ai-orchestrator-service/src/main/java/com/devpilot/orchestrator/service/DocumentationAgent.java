package com.devpilot.orchestrator.service;

import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.DocumentationContext;

public interface DocumentationAgent {

    DocumentationResult documentSuccess(DocumentationContext context);

    DocumentationResult documentFailure(
            DocumentationContext context,
            String failureReason);
}
