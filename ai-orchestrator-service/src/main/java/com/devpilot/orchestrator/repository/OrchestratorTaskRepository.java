package com.devpilot.orchestrator.repository;

import java.util.List;
import java.util.Optional;

import com.devpilot.orchestrator.domain.OrchestratorTask;

public interface OrchestratorTaskRepository {

    OrchestratorTask save(OrchestratorTask task);

    Optional<OrchestratorTask> findById(String taskId);

    Optional<OrchestratorTask> findByIdAndOwnerId(String taskId, String ownerId);

    List<OrchestratorTask> findAllByOwnerId(String ownerId);
}
