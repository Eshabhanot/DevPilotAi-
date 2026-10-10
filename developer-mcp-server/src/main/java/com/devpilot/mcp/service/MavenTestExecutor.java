package com.devpilot.mcp.service;

import com.devpilot.mcp.dto.TestExecution;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Component
public class MavenTestExecutor implements ApprovedTestExecutor {

    private final MavenProcessStarter processStarter;

    public MavenTestExecutor() {
        this(projectDirectory -> new ProcessBuilder(List.of("mvn", "test"))
                .directory(projectDirectory.toFile())
                .redirectErrorStream(true)
                .start());
    }

    MavenTestExecutor(MavenProcessStarter processStarter) {
        this.processStarter = processStarter;
    }

    @Override
    public TestExecution execute(Path projectDirectory, Duration timeout, int maxOutputCharacters) {
        Instant startedAt = Instant.now();
        Process process;
        try {
            process = processStarter.start(projectDirectory);
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to start the approved Maven test command", exception);
        }

        CompletableFuture<BoundedOutput> output = CompletableFuture.supplyAsync(
                () -> readOutput(process.getInputStream(), maxOutputCharacters));
        boolean timedOut;
        try {
            timedOut = !process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            if (timedOut) {
                process.destroy();
                if (!process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                    process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
                }
            }
            BoundedOutput captured = output.get();
            int exitCode = process.isAlive() ? -1 : process.exitValue();
            return new TestExecution(
                    projectDirectory.toString(),
                    exitCode,
                    timedOut,
                    Duration.between(startedAt, Instant.now()),
                    captured.text(),
                    captured.truncated());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
            throw new WorkspaceAccessException("Approved Maven test command was interrupted", exception);
        } catch (ExecutionException exception) {
            throw new WorkspaceAccessException("Unable to capture Maven test output", exception.getCause());
        }
    }

    private BoundedOutput readOutput(InputStream input, int maxOutputCharacters) {
        try (input; ByteArrayOutputStream captured = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            boolean truncated = false;
            while ((read = input.read(buffer)) != -1) {
                int remaining = maxOutputCharacters - captured.size();
                if (remaining > 0) {
                    captured.write(buffer, 0, Math.min(remaining, read));
                }
                truncated |= read > remaining;
            }
            return new BoundedOutput(
                    TestOutputSanitizer.sanitize(
                            captured.toString(StandardCharsets.UTF_8)),
                    truncated);
        } catch (IOException exception) {
            throw new WorkspaceAccessException("Unable to read Maven test output", exception);
        }
    }

    private record BoundedOutput(String text, boolean truncated) {
    }

    @FunctionalInterface
    interface MavenProcessStarter {
        Process start(Path projectDirectory) throws IOException;
    }
}
