package com.devpilot.orchestrator.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.devpilot.orchestrator.dto.KnowledgeAskResponse;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.RetrievedSource;
import com.devpilot.orchestrator.dto.TechnicalEvidence;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.springframework.stereotype.Service;

@Service
public class ResearchAgent {

    private static final String INSUFFICIENT_EVIDENCE_MARKER =
            "could not find sufficient information";

    private final KnowledgeServiceClient knowledgeServiceClient;
    private final McpWorkspaceClient workspaceClient;

    public ResearchAgent(
            KnowledgeServiceClient knowledgeServiceClient,
            McpWorkspaceClient workspaceClient) {
        this.knowledgeServiceClient = knowledgeServiceClient;
        this.workspaceClient = workspaceClient;
    }

    public ResearchResult research(
            String task,
            List<String> conversationHistory) {

        return research(
                "unspecified-task",
                task,
                System.getProperty("user.dir"),
                conversationHistory);
    }

    public ResearchResult research(
            String taskId,
            String task,
            String workspaceId,
            List<String> conversationHistory) {

        List<String> validationErrors = validate(taskId, task, workspaceId);
        if (!validationErrors.isEmpty()) {
            return buildResult(
                    taskId,
                    task,
                    workspaceId,
                    "Research could not start because the task input is invalid.",
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    validationErrors,
                    validationErrors,
                    false,
                    false,
                    false,
                    "INVALID_TASK");
        }

        KnowledgeAskResponse response;
        try {
            response = knowledgeServiceClient.ask(task, conversationHistory);
        } catch (KnowledgeServiceUnavailableException exception) {
            return buildResult(
                    taskId,
                    task,
                    workspaceId,
                    "Research could not be completed because the Knowledge "
                            + "Service was unavailable.",
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of("Knowledge Service unavailable: "
                            + safeExceptionMessage(exception)),
                    List.of("Knowledge Service evidence was unavailable."),
                    List.of("Repository inspection was not attempted because "
                            + "retrieved evidence was unavailable."),
                    false,
                    false,
                    false,
                    "KNOWLEDGE_SERVICE_UNAVAILABLE");
        }

        String summary = safeText(response.answer());
        List<RetrievedSource> sources = mapSources(response);
        List<TechnicalEvidence> evidence = mapEvidence(summary, sources);
        boolean emptyRetrieval = sources.isEmpty()
                || summary.toLowerCase(Locale.ROOT)
                        .contains(INSUFFICIENT_EVIDENCE_MARKER);

        List<WorkspaceFileEvidence> files = inspectWorkspace(
                workspaceId,
                task,
                sources);
        List<String> missingInformation = new ArrayList<>();
        List<String> confidenceLimitations = new ArrayList<>();
        List<String> risks = new ArrayList<>();

        if (emptyRetrieval) {
            missingInformation.add("Knowledge Service returned no usable "
                    + "source-backed evidence for this task.");
        }

        if (files.isEmpty()) {
            confidenceLimitations.add("No relevant workspace files were "
                    + "identified by safe MCP workspace inspection.");
        }

        compareEvidenceWithRepository(sources, files, confidenceLimitations);
        risks.addAll(deriveRisks(emptyRetrieval, files));

        List<String> recommendations = deriveRecommendations(
                summary,
                files,
                emptyRetrieval);
        boolean complete = !emptyRetrieval && !files.isEmpty();

        return buildResult(
                taskId,
                task,
                workspaceId,
                summary,
                evidence,
                sources,
                files,
                recommendations,
                risks,
                missingInformation,
                confidenceLimitations,
                true,
                emptyRetrieval,
                complete,
                complete ? null : "INSUFFICIENT_EVIDENCE");
    }

    private List<String> validate(
            String taskId,
            String task,
            String workspaceId) {

        List<String> errors = new ArrayList<>();

        if (taskId == null || taskId.isBlank()) {
            errors.add("Task ID is required.");
        }

        if (task == null || task.isBlank()) {
            errors.add("Task description is required.");
        }

        if (workspaceId == null || workspaceId.isBlank()) {
            errors.add("Permitted workspace identifier is required.");
        }

        return errors;
    }

    private List<RetrievedSource> mapSources(KnowledgeAskResponse response) {
        if (response == null
                || response.sources() == null
                || response.sources().isEmpty()) {
            return List.of();
        }

        return response.sources().stream()
                .map(source -> new RetrievedSource(
                        source.title(),
                        source.headingPath(),
                        source.chunkIndex()))
                .toList();
    }

    private List<TechnicalEvidence> mapEvidence(
            String summary,
            List<RetrievedSource> sources) {

        if (sources.isEmpty()) {
            return List.of();
        }

        return sources.stream()
                .map(source -> new TechnicalEvidence(summary, source))
                .toList();
    }

    private List<WorkspaceFileEvidence> inspectWorkspace(
            String workspaceId,
            String task,
            List<RetrievedSource> sources) {

        try {
            return workspaceClient.searchRelevantFiles(
                    workspaceId,
                    searchTerms(task, sources));
        } catch (WorkspaceInspectionException exception) {
            return List.of(new WorkspaceFileEvidence(
                    "",
                    "inspection-failure",
                    safeExceptionMessage(exception)));
        }
    }

    private List<String> searchTerms(
            String task,
            List<RetrievedSource> sources) {

        Set<String> terms = new LinkedHashSet<>();

        for (String token : safeText(task).split("[^A-Za-z0-9_.-]+")) {
            if (token.length() >= 4) {
                terms.add(token);
            }
        }

        for (RetrievedSource source : sources) {
            addSourceTerms(terms, source.title());
            addSourceTerms(terms, source.headingPath());
        }

        terms.add("pom.xml");
        terms.add("application.yml");
        terms.add("src/test");

        return terms.stream().limit(20).toList();
    }

    private void addSourceTerms(Set<String> terms, String value) {
        if (value == null || value.isBlank()) {
            return;
        }

        for (String token : value.split("[^A-Za-z0-9_.-]+")) {
            if (token.length() >= 4) {
                terms.add(token);
            }
        }
    }

    private void compareEvidenceWithRepository(
            List<RetrievedSource> sources,
            List<WorkspaceFileEvidence> files,
            List<String> confidenceLimitations) {

        boolean hasDependencies = files.stream()
                .anyMatch(file -> "dependency".equals(file.evidenceType()));
        boolean hasClasses = files.stream()
                .anyMatch(file -> "class".equals(file.evidenceType()));
        boolean hasConfig = files.stream()
                .anyMatch(file -> "configuration".equals(file.evidenceType()));
        boolean hasTests = files.stream()
                .anyMatch(file -> "test".equals(file.evidenceType()));

        if (!sources.isEmpty() && !hasClasses) {
            confidenceLimitations.add("Retrieved guidance could not be "
                    + "connected to a concrete class in the workspace.");
        }

        if (!hasDependencies) {
            confidenceLimitations.add("Dependency manifests were not found in "
                    + "the relevant workspace evidence.");
        }

        if (!hasConfig) {
            confidenceLimitations.add("Configuration files were not found in "
                    + "the relevant workspace evidence.");
        }

        if (!hasTests) {
            confidenceLimitations.add("Existing tests were not found in the "
                    + "relevant workspace evidence.");
        }
    }

    private List<String> deriveRecommendations(
            String summary,
            List<WorkspaceFileEvidence> files,
            boolean emptyRetrieval) {

        List<String> recommendations = new ArrayList<>();

        if (!emptyRetrieval) {
            recommendations.addAll(extractRecommendations(summary));
        }

        if (!files.isEmpty()) {
            recommendations.add("Ground implementation changes in the "
                    + "identified classes, configuration, dependency "
                    + "manifests, and tests before editing code.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Do not begin implementation until additional "
                    + "source-backed guidance or repository evidence is "
                    + "available.");
        }

        return recommendations;
    }

    private List<String> deriveRisks(
            boolean emptyRetrieval,
            List<WorkspaceFileEvidence> files) {

        List<String> risks = new ArrayList<>();

        if (emptyRetrieval) {
            risks.add("Implementation may drift from project guidance because "
                    + "retrieval returned insufficient evidence.");
        }

        if (files.stream().noneMatch(file -> "test".equals(file.evidenceType()))) {
            risks.add("Test impact is uncertain because no existing tests were "
                    + "identified.");
        }

        if (files.stream().anyMatch(file -> "inspection-failure"
                .equals(file.evidenceType()))) {
            risks.add("Workspace inspection failed; repository comparison is "
                    + "incomplete.");
        }

        return risks;
    }

    private List<String> existingImplementation(
            List<WorkspaceFileEvidence> files) {

        if (files.isEmpty()) {
            return List.of();
        }

        return files.stream()
                .map(file -> file.evidenceType() + ": " + file.path())
                .toList();
    }

    private ResearchResult buildResult(
            String taskId,
            String task,
            String workspaceId,
            String researchSummary,
            List<TechnicalEvidence> evidence,
            List<RetrievedSource> sources,
            List<WorkspaceFileEvidence> files,
            List<String> recommendations,
            List<String> risks,
            List<String> missingInformation,
            List<String> confidenceLimitations,
            boolean knowledgeServiceAvailable,
            boolean emptyRetrieval,
            boolean complete,
            String failureReason) {

        return new ResearchResult(
                taskId,
                task,
                workspaceId,
                taskSummary(task),
                researchSummary,
                evidence,
                sources,
                files,
                existingImplementation(files),
                recommendations,
                risks,
                missingInformation,
                confidenceLimitations,
                mergeUncertainties(missingInformation, confidenceLimitations),
                knowledgeServiceAvailable,
                emptyRetrieval,
                complete,
                failureReason);
    }

    private String taskSummary(String task) {
        String value = safeText(task);

        if (value.length() <= 240) {
            return value;
        }

        return value.substring(0, 237) + "...";
    }

    private List<String> mergeUncertainties(
            List<String> missingInformation,
            List<String> confidenceLimitations) {

        List<String> uncertainties = new ArrayList<>();
        uncertainties.addAll(missingInformation);
        uncertainties.addAll(confidenceLimitations);

        return uncertainties;
    }

    private String safeText(String answer) {
        if (answer == null || answer.isBlank()) {
            return "Knowledge Service returned a blank answer.";
        }

        return answer.trim();
    }

    private String safeExceptionMessage(RuntimeException exception) {
        if (exception.getMessage() == null || exception.getMessage().isBlank()) {
            return exception.getClass().getSimpleName();
        }

        return exception.getMessage();
    }

    private List<String> extractRecommendations(String answer) {
        List<String> recommendations = new ArrayList<>();

        for (String line : answer.split("\\R")) {
            String trimmed = line.trim();

            if (trimmed.startsWith("- ")
                    || trimmed.startsWith("* ")
                    || trimmed.matches("\\d+[.)]\\s+.+")) {
                recommendations.add(trimmed);
            }
        }

        if (recommendations.isEmpty()) {
            recommendations.add(answer);
        }

        return recommendations;
    }
}
