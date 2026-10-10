
package com.devpilot.knowledge.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

@Service
public class RetrievalEvaluationService {

    public record EvaluationResult(
            int relevantRetrieved,
            int retrievedCount,
            int relevantExpected,
            double precisionAtK,
            double recallAtK
    ) {}

    public EvaluationResult evaluate(
            List<String> retrievedChunkIds,
            Set<String> expectedRelevantChunkIds) {

        if (retrievedChunkIds == null
                || expectedRelevantChunkIds == null) {
            throw new IllegalArgumentException(
                    "Retrieved IDs and expected IDs are required");
        }

        Set<String> uniqueRetrieved =
                new HashSet<>(retrievedChunkIds);

        long relevantRetrieved = uniqueRetrieved.stream()
                .filter(expectedRelevantChunkIds::contains)
                .count();

        double precision = uniqueRetrieved.isEmpty()
                ? 0.0
                : (double) relevantRetrieved / uniqueRetrieved.size();

        double recall = expectedRelevantChunkIds.isEmpty()
                ? 0.0
                : (double) relevantRetrieved
                    / expectedRelevantChunkIds.size();

        return new EvaluationResult(
                (int) relevantRetrieved,
                uniqueRetrieved.size(),
                expectedRelevantChunkIds.size(),
                precision,
                recall
        );
    }
}
