import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { taskApi } from '../api/taskApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    checkHealth: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../api/knowledgeApi', () => ({
  knowledgeApi: {
    checkHealth: vi.fn().mockResolvedValue(true),
    listDocuments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../api/taskApi', () => ({
  taskApi: {
    listTasks: vi.fn(),
    cancelTask: vi.fn(),
  },
}));

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    taskApi.listTasks.mockReturnValueOnce(new Promise(() => {}));
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/querying tasks from api gateway/i)).toBeInTheDocument();
  });

  it('renders empty state when no tasks are present', async () => {
    taskApi.listTasks.mockResolvedValueOnce([]);
    renderWithRouter(<DashboardPage />);

    expect(await screen.findByText(/no software tasks created yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /describe software task/i })).toBeInTheDocument();
  });

  it('renders tasks with metrics, status badges, and IDs', async () => {
    const mockTasks = [
      {
        taskId: 'task-111-222-333',
        status: 'COMPLETED',
        task: 'Implement JWT Filter in Api Gateway',
        workspaceId: 'D:/DevPilotAi/api-gateway',
        progress: 100,
        createdAt: new Date().toISOString(),
        currentStep: 'Task completed',
      },
      {
        taskId: 'task-444-555-666',
        status: 'RESEARCHING',
        task: 'Analyze eureka service heartbeat timeout',
        workspaceId: 'D:/DevPilotAi/eureka-service',
        progress: 25,
        createdAt: new Date().toISOString(),
        currentStep: 'Research Agent running',
      },
    ];

    taskApi.listTasks.mockResolvedValueOnce(mockTasks);
    renderWithRouter(<DashboardPage />);

    expect((await screen.findAllByText('Implement JWT Filter in Api Gateway')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Analyze eureka service heartbeat timeout')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Researching')).toBeInTheDocument();
    // Metrics check
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
  });

  it('filters tasks based on search query', async () => {
    const mockTasks = [
      {
        taskId: 'task-111',
        status: 'COMPLETED',
        task: 'Refactor Auth Controller',
        workspaceId: 'D:/DevPilotAi',
        progress: 100,
        createdAt: new Date().toISOString(),
      },
      {
        taskId: 'task-222',
        status: 'PLANNING',
        task: 'Add PostgreSQL Migration',
        workspaceId: 'D:/DevPilotAi',
        progress: 30,
        createdAt: new Date().toISOString(),
      },
    ];

    taskApi.listTasks.mockResolvedValueOnce(mockTasks);
    renderWithRouter(<DashboardPage />);

    await screen.findAllByText('Refactor Auth Controller');

    const searchInput = screen.getByLabelText(/search tasks/i);
    fireEvent.change(searchInput, { target: { value: 'PostgreSQL' } });

    expect(screen.queryByText('Refactor Auth Controller')).not.toBeInTheDocument();
    expect(screen.getByText('Add PostgreSQL Migration')).toBeInTheDocument();
  });

  it('shows error banner when API call fails', async () => {
    const error = new Error('Network error');
    error.userMessage = 'Failed to connect to API Gateway';
    taskApi.listTasks.mockRejectedValueOnce(error);

    renderWithRouter(<DashboardPage />);

    expect(await screen.findByText(/could not load tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to connect to api gateway/i)).toBeInTheDocument();
  });
});
