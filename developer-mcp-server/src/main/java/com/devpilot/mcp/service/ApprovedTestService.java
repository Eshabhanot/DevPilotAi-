package com.devpilot.mcp.service;

import com.devpilot.mcp.config.WorkspaceProperties;
import com.devpilot.mcp.dto.TestExecution;
import org.springframework.stereotype.Service;

@Service
public class ApprovedTestService {

    private final WorkspaceSafety safety;
    private final WorkspaceProperties properties;
    private final ApprovedTestExecutor executor;

    public ApprovedTestService(WorkspaceSafety safety, WorkspaceProperties properties, ApprovedTestExecutor executor) {
        this.safety = safety;
        this.properties = properties;
        this.executor = executor;
    }

    public TestExecution runMavenTests(String projectPath) {
        return executor.execute(safety.resolveProjectDirectory(projectPath), properties.getTestTimeout(), properties.getMaxTestOutputCharacters());
    }
}
