package com.devpilot.mcp;

import com.devpilot.mcp.config.WorkspaceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(WorkspaceProperties.class)
public class DeveloperMcpApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeveloperMcpApplication.class, args);
    }
}
