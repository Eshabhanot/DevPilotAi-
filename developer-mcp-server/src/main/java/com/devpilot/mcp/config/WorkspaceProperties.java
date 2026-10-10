package com.devpilot.mcp.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.nio.file.Path;
import java.time.Duration;

@Validated
@ConfigurationProperties("devpilot.workspace")
public class WorkspaceProperties {

    @NotNull
    private Path root;

    @Min(1)
    private long maxFileBytes = 524_288;

    @Min(1)
    private int maxReadCharacters = 200_000;

    @Min(1)
    private int maxSearchResults = 50;

    @Min(1)
    private int maxListResults = 200;

    @NotNull
    private Duration testTimeout = Duration.ofSeconds(60);

    @Min(1)
    private int maxTestOutputCharacters = 32_000;

    public Path getRoot() { return root; }
    public void setRoot(Path root) { this.root = root; }
    public long getMaxFileBytes() { return maxFileBytes; }
    public void setMaxFileBytes(long maxFileBytes) { this.maxFileBytes = maxFileBytes; }
    public int getMaxReadCharacters() { return maxReadCharacters; }
    public void setMaxReadCharacters(int maxReadCharacters) { this.maxReadCharacters = maxReadCharacters; }
    public int getMaxSearchResults() { return maxSearchResults; }
    public void setMaxSearchResults(int maxSearchResults) { this.maxSearchResults = maxSearchResults; }
    public int getMaxListResults() { return maxListResults; }
    public void setMaxListResults(int maxListResults) { this.maxListResults = maxListResults; }
    public Duration getTestTimeout() { return testTimeout; }
    public void setTestTimeout(Duration testTimeout) { this.testTimeout = testTimeout; }
    public int getMaxTestOutputCharacters() { return maxTestOutputCharacters; }
    public void setMaxTestOutputCharacters(int maxTestOutputCharacters) { this.maxTestOutputCharacters = maxTestOutputCharacters; }
}
