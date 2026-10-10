package com.devpilot.orchestrator.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.devpilot.orchestrator.dto.DocumentationContext;
import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.dto.WorkspaceFileContents;
import org.springframework.stereotype.Service;

@Service
public class SummaryDocumentationAgent implements DocumentationAgent {

    private static final Pattern ENDPOINT_MAPPING = Pattern.compile(
            "@(Get|Post|Put|Delete|Patch)Mapping(?:\\(\\s*(?:value\\s*=\\s*)?"
                    + "\\\"([^\\\"]*)\\\"[^)]*\\))?");
    private static final Pattern ENVIRONMENT_VARIABLE = Pattern.compile(
            "\\$\\{([A-Z][A-Z0-9_]+)");

    private final McpWorkspaceClient workspaceClient;

    public SummaryDocumentationAgent(McpWorkspaceClient workspaceClient) {
        this.workspaceClient = workspaceClient;
    }

    @Override
    public DocumentationResult documentSuccess(DocumentationContext context) {
        Evidence evidence = collectEvidence(context);
        List<String> limitations = new ArrayList<>(evidence.limitations());
        boolean readmeUpdated = updateReadmeWhenAuthorized(
                context, evidence, limitations);

        return new DocumentationResult(
                true,
                summary(context),
                context.changedFiles(),
                context.changes(),
                evidence.endpoints(),
                evidence.configurationRequirements(),
                evidence.localRunInstructions(),
                testOutcome(context.testResult()),
                limitations,
                readmeUpdated,
                null);
    }

    @Override
    public DocumentationResult documentFailure(
            DocumentationContext context,
            String failureReason) {

        Evidence evidence = collectEvidence(context);
        List<String> limitations = new ArrayList<>(evidence.limitations());
        limitations.add("Workflow stopped before successful completion: "
                + failureReason);

        return new DocumentationResult(
                false,
                "Task documentation captured the available project evidence.",
                context.changedFiles(),
                context.changes(),
                evidence.endpoints(),
                evidence.configurationRequirements(),
                evidence.localRunInstructions(),
                testOutcome(context.testResult()),
                limitations,
                false,
                failureReason);
    }

    private Evidence collectEvidence(DocumentationContext context) {
        List<String> limitations = new ArrayList<>();
        List<WorkspaceFileContents> changedFileContents = new ArrayList<>();
        List<WorkspaceFileContents> projectFileContents = new ArrayList<>();
        WorkspaceFileContents readme = readOptional(
                context.workspaceId(), "README.md", limitations);

        LinkedHashSet<String> paths = new LinkedHashSet<>(context.changedFiles());
        if (context.researchResult() != null
                && context.researchResult().relevantFiles() != null) {
            context.researchResult().relevantFiles().forEach(
                    file -> paths.add(file.path()));
        }

        for (String path : paths) {
            WorkspaceFileContents contents = readOptional(
                    context.workspaceId(), path, limitations);
            if (contents != null) {
                projectFileContents.add(contents);
                if (context.changedFiles().contains(path)) {
                    changedFileContents.add(contents);
                }
                if (contents.truncated()) {
                    limitations.add("Changed file content was truncated: "
                            + contents.path());
                }
            }
        }

        return new Evidence(
                readme,
                endpoints(changedFileContents),
                configurationRequirements(projectFileContents),
                localRunInstructions(projectFileContents, limitations),
                limitations);
    }

    private WorkspaceFileContents readOptional(
            String workspaceId,
            String path,
            List<String> limitations) {

        try {
            return workspaceClient.readWorkspaceFile(workspaceId, path);
        } catch (WorkspaceInspectionException | UnsupportedOperationException exception) {
            limitations.add("Could not read project file " + path + ": "
                    + safeMessage(exception));
            return null;
        }
    }

    private List<String> endpoints(List<WorkspaceFileContents> files) {
        List<String> endpoints = new ArrayList<>();
        for (WorkspaceFileContents file : files) {
            if (!file.path().endsWith(".java")) {
                continue;
            }
            Matcher matcher = ENDPOINT_MAPPING.matcher(file.content());
            while (matcher.find()) {
                String path = matcher.group(2);
                endpoints.add(matcher.group(1).toUpperCase() + " "
                        + (path == null || path.isBlank() ? "/" : path));
            }
        }
        return endpoints.stream().distinct().toList();
    }

    private List<String> configurationRequirements(
            List<WorkspaceFileContents> projectFiles) {
        List<String> requirements = new ArrayList<>();
        projectFiles.stream()
                .filter(file -> file.path().endsWith(".yml")
                        || file.path().endsWith(".yaml")
                        || file.path().endsWith(".properties"))
                .forEach(file -> {
                    Matcher matcher = ENVIRONMENT_VARIABLE.matcher(file.content());
                    while (matcher.find()) {
                        requirements.add(matcher.group(1));
                    }
                });
        return requirements.stream().distinct().toList();
    }

    private List<String> localRunInstructions(
            List<WorkspaceFileContents> projectFiles,
            List<String> limitations) {

        boolean hasMavenProject = projectFiles.stream()
                .anyMatch(file -> file.path().endsWith("pom.xml")
                        && file.content().contains("spring-boot"));
        if (!hasMavenProject) {
            limitations.add("Local run instructions were not inferred because "
                    + "no Maven project evidence was available.");
            return List.of();
        }
        return List.of("From the permitted workspace, run: mvn spring-boot:run");
    }

    private boolean updateReadmeWhenAuthorized(
            DocumentationContext context,
            Evidence evidence,
            List<String> limitations) {

        if (!context.readmeUpdateAuthorized()) {
            return false;
        }
        if (evidence.readme() == null) {
            limitations.add("README.md was not updated because it could not be read.");
            return false;
        }
        if (evidence.readme().truncated()) {
            limitations.add("README.md was not updated because its content was truncated.");
            return false;
        }

        String updated = evidence.readme().content().stripTrailing()
                + "\n\n" + readmeSection(context, evidence);
        try {
            workspaceClient.updateWorkspaceFile(
                    context.workspaceId(), "README.md", updated);
            return true;
        } catch (WorkspaceInspectionException | UnsupportedOperationException exception) {
            limitations.add("README.md could not be updated: "
                    + safeMessage(exception));
            return false;
        }
    }

    private String readmeSection(
            DocumentationContext context,
            Evidence evidence) {

        StringBuilder section = new StringBuilder("## DevPilot Change Summary\n\n")
                .append(summary(context)).append("\n");
        if (!context.changedFiles().isEmpty()) {
            section.append("\nChanged files:\n");
            context.changedFiles().forEach(file -> section.append("- ")
                    .append(file).append("\n"));
        }
        if (!evidence.endpoints().isEmpty()) {
            section.append("\nEndpoints:\n");
            evidence.endpoints().forEach(endpoint -> section.append("- ")
                    .append(endpoint).append("\n"));
        }
        section.append("\nTests: ").append(testOutcome(context.testResult()))
                .append("\n");
        return section.toString();
    }

    private String summary(DocumentationContext context) {
        if (context.changes().isEmpty()) {
            return "Task completed without recorded source file changes: "
                    + context.task();
        }
        return "Implemented " + context.changes().size()
                + " recorded change(s) for: " + context.task();
    }

    private String testOutcome(TestResult result) {
        return result == null
                ? "No approved test result was recorded."
                : result.summary();
    }

    private String safeMessage(RuntimeException exception) {
        return exception.getMessage() == null || exception.getMessage().isBlank()
                ? exception.getClass().getSimpleName()
                : exception.getMessage();
    }

    private record Evidence(
            WorkspaceFileContents readme,
            List<String> endpoints,
            List<String> configurationRequirements,
            List<String> localRunInstructions,
            List<String> limitations
    ) {}
}
