import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TaskDetailPage } from '../pages/TaskDetailPage';
import { taskApi } from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  taskApi: {
    getTask: vi.fn(),
    cancelTask: vi.fn(),
  },
}));

const mockTaskData = {
  taskId: 'task-test-123',
  ownerId: 'developer@example.com',
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  progress: 100,
  task: 'Create Eureka Service CircuitBreaker Route',
  workspaceId: 'D:/DevPilotAi',
  currentStep: 'Task completed',
  summary: 'Created and verified Eureka circuit breaker integration.',
  changedFiles: ['src/main/resources/application.yml'],
  changes: [
    {
      path: 'src/main/resources/application.yml',
      action: 'updated',
      rationale: 'Configured resilience4j circuitbreaker instance',
    },
  ],
  researchResult: {
    researchSummary: 'Verified Spring Cloud Gateway routes and CircuitBreaker config.',
    knowledgeServiceAvailable: true,
  },
  implementationPlan: {
    summary: 'Update gateway configuration and verify fallback endpoint',
    steps: ['Add route definition', 'Configure sliding window'],
  },
  testResult: {
    status: 'PASSED',
    exitCode: 0,
    command: 'mvn test',
    duration: 'PT2.5S',
    output: '[INFO] Tests run: 1, Failures: 0, Errors: 0\n[INFO] BUILD SUCCESS',
    summary: 'All approved tests passed.',
  },
  documentationResult: {
    successful: true,
    summary: 'Documentation verified.',
    localRunInstructions: ['mvn spring-boot:run'],
  },
  repairAttempts: 0,
};

function renderComponent(taskId = 'task-test-123') {
  return render(
    <MemoryRouter initialEntries={[`/tasks/${taskId}`]}>
      <Routes>
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task details, status, and summary upon loading', async () => {
    taskApi.getTask.mockResolvedValueOnce(mockTaskData);
    renderComponent();

    expect(await screen.findByText('Create Eureka Service CircuitBreaker Route')).toBeInTheDocument();
    expect(screen.getByText('task-test-123')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/created and verified eureka circuit breaker integration/i)).toBeInTheDocument();
  });

  it('switches between detail tabs: research, files, tests, and documentation', async () => {
    taskApi.getTask.mockResolvedValue(mockTaskData);
    renderComponent();

    await screen.findByText('Create Eureka Service CircuitBreaker Route');

    // Research tab
    fireEvent.click(screen.getByRole('button', { name: /research findings/i }));
    expect(await screen.findByText(/verified spring cloud gateway routes/i)).toBeInTheDocument();

    // Changed Files tab
    fireEvent.click(screen.getByRole('button', { name: /changed files/i }));
    expect(await screen.findByText('src/main/resources/application.yml')).toBeInTheDocument();
    expect(screen.getByText(/configured resilience4j circuitbreaker instance/i)).toBeInTheDocument();

    // Test Results tab
    fireEvent.click(screen.getByRole('button', { name: /test results/i }));
    expect(await screen.findByText(/all approved tests passed successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/build success/i)).toBeInTheDocument();

    // Documentation tab
    fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
    expect(await screen.findByText('mvn spring-boot:run')).toBeInTheDocument();
  });

  it('stops polling when task reaches terminal state (COMPLETED)', async () => {
    taskApi.getTask.mockResolvedValueOnce(mockTaskData);
    renderComponent();

    await screen.findByText('Create Eureka Service CircuitBreaker Route');

    // Terminal task should not poll further
    expect(taskApi.getTask).toHaveBeenCalledTimes(1);
  });
});
