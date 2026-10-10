package com.devpilot.mcp.service;

import com.devpilot.mcp.dto.TestExecution;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MavenTestExecutorTest {

    @Test
    void forceTerminatesAnApprovedTestThatTimesOut() {
        TimedOutProcess process = new TimedOutProcess();
        MavenTestExecutor executor = new MavenTestExecutor(directory -> process);

        TestExecution result = executor.execute(Path.of("."), Duration.ofMillis(1), 64);

        assertTrue(result.timedOut());
        assertTrue(process.forceDestroyed);
        assertEquals(143, result.exitCode());
    }

    private static final class TimedOutProcess extends Process {
        private boolean alive = true;
        private boolean forceDestroyed;

        @Override
        public OutputStream getOutputStream() {
            return OutputStream.nullOutputStream();
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream("still running".getBytes());
        }

        @Override
        public InputStream getErrorStream() {
            return InputStream.nullInputStream();
        }

        @Override
        public int waitFor() {
            return 143;
        }

        @Override
        public boolean waitFor(long timeout, java.util.concurrent.TimeUnit unit) {
            return !alive;
        }

        @Override
        public int exitValue() {
            if (alive) {
                throw new IllegalThreadStateException("Process is still running");
            }
            return 143;
        }

        @Override
        public void destroy() {
        }

        @Override
        public Process destroyForcibly() {
            forceDestroyed = true;
            alive = false;
            return this;
        }

        @Override
        public boolean isAlive() {
            return alive;
        }
    }
}
