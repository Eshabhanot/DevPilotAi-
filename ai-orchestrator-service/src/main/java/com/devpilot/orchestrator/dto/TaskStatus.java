package com.devpilot.orchestrator.dto;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum TaskStatus {
    ACCEPTED,
    RESEARCHING,
    PLANNING,
    CODING,
    TESTING,
    REPAIRING,
    DOCUMENTING,
    COMPLETED,
    FAILED,
    CANCELLED;

    private static final Map<TaskStatus, Set<TaskStatus>> TRANSITIONS =
            new EnumMap<>(TaskStatus.class);

    static {
        TRANSITIONS.put(ACCEPTED, EnumSet.of(RESEARCHING, CANCELLED));
        TRANSITIONS.put(RESEARCHING, EnumSet.of(PLANNING, FAILED, CANCELLED));
        TRANSITIONS.put(PLANNING, EnumSet.of(CODING, FAILED, CANCELLED));
        TRANSITIONS.put(CODING, EnumSet.of(TESTING, FAILED, CANCELLED));
        TRANSITIONS.put(TESTING, EnumSet.of(REPAIRING, DOCUMENTING, FAILED, CANCELLED));
        TRANSITIONS.put(REPAIRING, EnumSet.of(TESTING, FAILED, CANCELLED));
        TRANSITIONS.put(DOCUMENTING, EnumSet.of(COMPLETED, FAILED, CANCELLED));
        TRANSITIONS.put(COMPLETED, EnumSet.noneOf(TaskStatus.class));
        TRANSITIONS.put(FAILED, EnumSet.noneOf(TaskStatus.class));
        TRANSITIONS.put(CANCELLED, EnumSet.noneOf(TaskStatus.class));
    }

    public boolean canTransitionTo(TaskStatus next) {
        return TRANSITIONS.get(this).contains(next);
    }

    public boolean terminal() {
        return this == COMPLETED || this == FAILED || this == CANCELLED;
    }
}
