package com.devpilot.orchestrator.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.devpilot.orchestrator.dto.CodingChange;
import com.devpilot.orchestrator.dto.DocumentationContext;
import com.devpilot.orchestrator.dto.DocumentationResult;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.TestResult;
import com.devpilot.orchestrator.dto.TestStatus;
import com.devpilot.orchestrator.dto.WorkspaceFileChange;
import com.devpilot.orchestrator.dto.WorkspaceFileContents;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.junit.jupiter.api.Test;

class SummaryDocumentationAgentTest {

    @Test
    void documentsObservedEndpointConfigurationAndPassedTests() {
        FakeMcpWorkspaceClient client = new FakeMcpWorkspaceClient();
        client.files.put("README.md", "# Existing Project\n");
        client.files.put("pom.xml", "<artifactId>spring-boot-starter-webmvc</artifactId>");
        client.files.put("application.yml",
                "base-url: ${KNOWLEDGE_SERVICE_BASE_URL:http://localhost:8083}");
        client.files.put("src/main/java/com/example/StatusController.java", """
                package com.example;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;
                @RestController
                class StatusController {
                    @GetMapping("/api/status")
                    String status() { return "ok"; }
                }
                """);

        DocumentationResult result = new SummaryDocumentationAgent(client)
                .documentSuccess(context(false, passedTests()));

        assertThat(result.successful()).isTrue();
        assertThat(result.filesChanged())
                .contains("src/main/java/com/example/StatusController.java");
        assertThat(result.apiEndpoints()).contains("GET /api/status");
        assertThat(result.configurationRequirements()).contains("KNOWLEDGE_SERVICE_BASE_URL");
        assertThat(result.localRunInstructions())
                .contains("From the permitted workspace, run: mvn spring-boot:run");
        assertThat(result.testOutcome()).isEqualTo("Approved tests passed.");
        assertThat(result.readmeUpdated()).isFalse();
        assertThat(client.updatedPaths).isEmpty();
    }

    @Test
    void updatesExistingReadmeOnlyWhenDocumentationStageAuthorizesIt() {
        FakeMcpWorkspaceClient client = new FakeMcpWorkspaceClient();
        client.files.put("README.md", "# Existing Project\n");
        client.files.put("pom.xml", "<artifactId>spring-boot-starter-webmvc</artifactId>");
        client.files.put("application.yml",
                "base-url: ${KNOWLEDGE_SERVICE_BASE_URL:http://localhost:8083}");
        client.files.put("src/main/java/com/example/StatusController.java", """
                @GetMapping("/api/status")
                class StatusController {}
                """);

        DocumentationResult result = new SummaryDocumentationAgent(client)
                .documentSuccess(context(true, passedTests()));

        assertThat(result.readmeUpdated()).isTrue();
        assertThat(client.updatedPaths).containsExactly("README.md");
        assertThat(client.files.get("README.md"))
                .contains("# Existing Project", "## DevPilot Change Summary",
                        "GET /api/status", "Approved tests passed.");
    }

    @Test
    void preservesActualFailedTestOutcomeInFailureDocumentation() {
        FakeMcpWorkspaceClient client = new FakeMcpWorkspaceClient();
        client.files.put("README.md", "# Existing Project\n");
        client.files.put("pom.xml", "<artifactId>spring-boot-starter-webmvc</artifactId>");
        client.files.put("application.yml",
                "base-url: ${KNOWLEDGE_SERVICE_BASE_URL:http://localhost:8083}");
        client.files.put("src/main/java/com/example/StatusController.java", "class StatusController {}");

        DocumentationResult result = new SummaryDocumentationAgent(client)
                .documentFailure(context(false, failedTests()), "Repair limit reached.");

        assertThat(result.successful()).isFalse();
        assertThat(result.testOutcome()).contains("exit code 1");
        assertThat(result.limitations()).contains("Workflow stopped before successful completion: Repair limit reached.");
        assertThat(result.readmeUpdated()).isFalse();
    }

    private static DocumentationContext context(
            boolean readmeUpdateAuthorized,
            TestResult testResult) {

        return new DocumentationContext(
                "Add a status endpoint",
                "D:/workspace",
                research(),
                List.of("src/main/java/com/example/StatusController.java"),
                List.of(new CodingChange(
                        "src/main/java/com/example/StatusController.java",
                        "created",
                        "Expose service status.")),
                List.of("The existing Spring MVC dependency supports the endpoint."),
                testResult,
                readmeUpdateAuthorized);
    }

    private static ResearchResult research() {
        return new ResearchResult(
                "task-1", "Add a status endpoint", "D:/workspace",
                "Add a status endpoint", "Use Spring MVC.", List.of(), List.of(),
                List.of(
                        new WorkspaceFileEvidence("pom.xml", "dependency", "spring-boot-starter-webmvc"),
                        new WorkspaceFileEvidence("application.yml", "configuration",
                                "base-url: ${KNOWLEDGE_SERVICE_BASE_URL:http://localhost:8083}")),
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                true, false, true, null);
    }

    private static TestResult passedTests() {
        return new TestResult(TestStatus.PASSED, 0, "mvn test",
                Duration.ofSeconds(1), "BUILD SUCCESS", false,
                "Approved tests passed.", List.of());
    }

    private static TestResult failedTests() {
        return new TestResult(TestStatus.FAILED, 1, "mvn test",
                Duration.ofSeconds(1), "BUILD FAILURE", false,
                "Approved tests failed with exit code 1.",
                List.of("BUILD FAILURE"));
    }

    private static class FakeMcpWorkspaceClient implements McpWorkspaceClient {

        private final Map<String, String> files = new HashMap<>();
        private final List<String> updatedPaths = new java.util.ArrayList<>();

        @Override
        public List<WorkspaceFileEvidence> searchRelevantFiles(
                String workspaceId,
                List<String> searchTerms) {
            return List.of();
        }

        @Override
        public WorkspaceFileContents readWorkspaceFile(
                String workspaceId,
                String path) {
            String content = files.get(path);
            if (content == null) {
                throw new WorkspaceInspectionException("File does not exist.", null);
            }
            return new WorkspaceFileContents(path, content, false);
        }

        @Override
        public WorkspaceFileChange updateWorkspaceFile(
                String workspaceId,
                String path,
                String content) {
            files.put(path, content);
            updatedPaths.add(path);
            return new WorkspaceFileChange(path, false, ".devpilot-backups/README.md");
        }

        @Override
        public com.devpilot.orchestrator.dto.ApprovedTestExecution runApprovedTests(
                String workspaceId) {
            throw new UnsupportedOperationException();
        }
    }
}
