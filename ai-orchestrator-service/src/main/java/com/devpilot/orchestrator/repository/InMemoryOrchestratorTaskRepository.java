package com.devpilot.orchestrator.repository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import com.devpilot.orchestrator.domain.OrchestratorTask;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryOrchestratorTaskRepository
        implements OrchestratorTaskRepository {

    private final ConcurrentMap<String, OrchestratorTask> tasks =
            new ConcurrentHashMap<>();

    @Override
    public OrchestratorTask save(OrchestratorTask task) {
        tasks.put(task.taskId(), task);
        return task;
    }

    @Override
    public Optional<OrchestratorTask> findById(String taskId) {
        return Optional.ofNullable(tasks.get(taskId));
    }

    @Override
    public Optional<OrchestratorTask> findByIdAndOwnerId(
            String taskId,
            String ownerId) {

        return findById(taskId)
                .filter(task -> task.ownerId().equals(ownerId));
    }

    @Override
    public List<OrchestratorTask> findAllByOwnerId(String ownerId) {
        return tasks.values().stream()
                .filter(task -> task.ownerId().equals(ownerId))
                .sorted(Comparator.comparing(
                        task -> task.toResponse().createdAt(),
                        Comparator.reverseOrder()))
                .toList();
    }
}
