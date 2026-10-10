package com.devpilot.orchestrator;

import com.devpilot.orchestrator.config.KnowledgeClientProperties;
import com.devpilot.orchestrator.config.OrchestratorProperties;
import com.devpilot.orchestrator.config.WorkspaceClientProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        KnowledgeClientProperties.class,
        OrchestratorProperties.class,
        WorkspaceClientProperties.class
})
public class AiOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiOrchestratorApplication.class, args);
    }
}
