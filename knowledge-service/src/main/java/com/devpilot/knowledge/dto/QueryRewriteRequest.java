
package com.devpilot.knowledge.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QueryRewriteRequest(

        @NotBlank(message = "Question is required")
        @Size(max = 2000, message = "Question is too long")
        String question,

        @Size(max = 10, message = "Maximum 10 history messages allowed")
        List<@Size(max = 2000) String> conversationHistory
) {}
