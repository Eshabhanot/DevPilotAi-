package com.devpilot.mcp;

import com.devpilot.mcp.tool.DeveloperWorkspaceTools;
import org.junit.jupiter.api.Test;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(properties = "server.port=0")
class DeveloperMcpApplicationTests {

    @Autowired
    private DeveloperWorkspaceTools tools;

    @Test
    void exposesTheExpectedMcpToolAnnotations() {
        assertNotNull(tools);
        long count = Arrays.stream(DeveloperWorkspaceTools.class.getDeclaredMethods())
                .map(method -> method.getAnnotation(McpTool.class))
                .filter(annotation -> annotation != null)
                .count();

        assertEquals(6, count);
    }
}
