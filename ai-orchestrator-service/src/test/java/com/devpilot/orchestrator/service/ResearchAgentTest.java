package com.devpilot.orchestrator.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import com.devpilot.orchestrator.dto.KnowledgeAskResponse;
import com.devpilot.orchestrator.dto.ResearchResult;
import com.devpilot.orchestrator.dto.ApprovedTestExecution;
import com.devpilot.orchestrator.dto.WorkspaceFileEvidence;
import org.junit.jupiter.api.Test;

class ResearchAgentTest {

    @Test
    void producesReportWithRetrievedSourceMetadataAndWorkspaceEvidence() {
        FakeKnowledgeServiceClient knowledgeClient = new FakeKnowledgeServiceClient(
                new KnowledgeAskResponse(
                        "Implement the DevPilot Research Agent",
                        "- Preserve retrieved source metadata.\n"
                                + "- Compare guidance with repository files.",
                        List.of(new KnowledgeAskResponse.SourceReference(
                                "DevPilot Agent Architecture",
                                "Agents > Research > Evidence",
                                7))));
        FakeMcpWorkspaceClient workspaceClient = new FakeMcpWorkspaceClient(
                List.of(
                        new WorkspaceFileEvidence(
                                "ai-orchestrator-service/pom.xml",
                                "dependency",
                                "<artifactId>spring-boot-starter-webmvc</artifactId>"),
                        new WorkspaceFileEvidence(
                                "ai-orchestrator-service/src/main/java/com/devpilot/"
                                        + "orchestrator/service/ResearchAgent.java",
                                "class",
                                "public class ResearchAgent"),
                        new WorkspaceFileEvidence(
                                "ai-orchestrator-service/src/main/resources/"
                                        + "application.yml",
                                "configuration",
                                "spring:"),
                        new WorkspaceFileEvidence(
                                "ai-orchestrator-service/src/test/java/com/devpilot/"
                                        + "orchestrator/service/ResearchAgentTest.java",
                                "test",
                                "class ResearchAgentTest")));

        ResearchAgent agent = new ResearchAgent(knowledgeClient, workspaceClient);

        ResearchResult result = agent.research(
                "TASK-123",
                "Implement the DevPilot Research Agent",
                "D:/DevPilotAi",
                List.of("Use existing Knowledge Service integration."));

        assertThat(result.complete()).isTrue();
        assertThat(result.failureReason()).isNull();
        assertThat(result.taskId()).isEqualTo("TASK-123");
        assertThat(result.workspaceId()).isEqualTo("D:/DevPilotAi");
        assertThat(result.retrievedSources()).singleElement()
                .satisfies(source -> {
                    assertThat(source.title())
                            .isEqualTo("DevPilot Agent Architecture");
                    assertThat(source.headingPath())
                            .isEqualTo("Agents > Research > Evidence");
                    assertThat(source.chunkIndex()).isEqualTo(7);
                });
        assertThat(result.retrievedTechnicalEvidence()).singleElement()
                .satisfies(evidence -> assertThat(evidence.source().title())
                        .isEqualTo("DevPilot Agent Architecture"));
        assertThat(result.relevantFiles())
                .extracting(WorkspaceFileEvidence::evidenceType)
                .contains("dependency", "class", "configuration", "test");
        assertThat(result.existingImplementation())
                .contains("class: ai-orchestrator-service/src/main/java/"
                        + "com/devpilot/orchestrator/service/ResearchAgent.java");
        assertThat(result.implementationRecommendations())
                .contains("- Preserve retrieved source metadata.");
        assertThat(workspaceClient.workspaceId).isEqualTo("D:/DevPilotAi");
        assertThat(workspaceClient.searchTerms)
                .contains("Implement", "Research", "DevPilot");
    }

    @Test
    void distinguishesKnowledgeServiceFailureFromEmptyRetrieval() {
        FakeKnowledgeServiceClient knowledgeClient =
                new FakeKnowledgeServiceClient(null);
        knowledgeClient.failure = new KnowledgeServiceUnavailableException(
                "Knowledge Service is down.",
                null);
        FakeMcpWorkspaceClient workspaceClient =
                new FakeMcpWorkspaceClient(List.of());

        ResearchAgent agent = new ResearchAgent(knowledgeClient, workspaceClient);

        ResearchResult result = agent.research(
                "TASK-124",
                "Implement research",
                "D:/DevPilotAi",
                List.of());

        assertThat(result.complete()).isFalse();
        assertThat(result.knowledgeServiceAvailable()).isFalse();
        assertThat(result.emptyRetrievalResult()).isFalse();
        assertThat(result.failureReason())
                .isEqualTo("KNOWLEDGE_SERVICE_UNAVAILABLE");
        assertThat(result.missingInformation())
                .contains("Knowledge Service evidence was unavailable.");
        assertThat(workspaceClient.calls).isZero();
    }

    @Test
    void reportsEmptyRetrievalWithoutManufacturingEvidence() {
        FakeKnowledgeServiceClient knowledgeClient = new FakeKnowledgeServiceClient(
                new KnowledgeAskResponse(
                        "Implement research",
                        "I could not find sufficient information.",
                        List.of()));
        FakeMcpWorkspaceClient workspaceClient =
                new FakeMcpWorkspaceClient(List.of());

        ResearchAgent agent = new ResearchAgent(knowledgeClient, workspaceClient);

        ResearchResult result = agent.research(
                "TASK-125",
                "Implement research",
                "D:/DevPilotAi",
                List.of());

        assertThat(result.complete()).isFalse();
        assertThat(result.knowledgeServiceAvailable()).isTrue();
        assertThat(result.emptyRetrievalResult()).isTrue();
        assertThat(result.failureReason()).isEqualTo("INSUFFICIENT_EVIDENCE");
        assertThat(result.retrievedSources()).isEmpty();
        assertThat(result.retrievedTechnicalEvidence()).isEmpty();
        assertThat(result.missingInformation())
                .contains("Knowledge Service returned no usable "
                        + "source-backed evidence for this task.");
    }

    private static class FakeKnowledgeServiceClient
            implements KnowledgeServiceClient {

        private final KnowledgeAskResponse response;
        private KnowledgeServiceUnavailableException failure;

        FakeKnowledgeServiceClient(KnowledgeAskResponse response) {
            this.response = response;
        }

        @Override
        public KnowledgeAskResponse ask(
                String task,
                List<String> conversationHistory) {

            if (failure != null) {
                throw failure;
            }

            return response;
        }
    }

    private static class FakeMcpWorkspaceClient implements McpWorkspaceClient {

        private final List<WorkspaceFileEvidence> files;
        private int calls;
        private String workspaceId;
        private List<String> searchTerms = new ArrayList<>();

        FakeMcpWorkspaceClient(List<WorkspaceFileEvidence> files) {
            this.files = files;
        }

        @Override
        public List<WorkspaceFileEvidence> searchRelevantFiles(
                String workspaceId,
                List<String> searchTerms) {

            calls++;
            this.workspaceId = workspaceId;
            this.searchTerms = searchTerms;

            return files;
        }

        @Override
        public ApprovedTestExecution runApprovedTests(String workspaceId) {
            return new ApprovedTestExecution(
                    "mvn test",
                    0,
                    false,
                    java.time.Duration.ZERO,
                    "Tests not used by ResearchAgentTest.",
                    false);
        }
    }
}
