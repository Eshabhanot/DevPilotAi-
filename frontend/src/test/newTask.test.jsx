import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NewTaskPage } from '../pages/NewTaskPage';
import { taskApi } from '../api/taskApi';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock('../api/taskApi', () => ({
  taskApi: {
    createTask: vi.fn(),
  },
}));

function renderComponent() {
  return render(
    <BrowserRouter>
      <NewTaskPage />
    </BrowserRouter>
  );
}

describe('NewTaskPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task request form with description and workspace input', () => {
    renderComponent();
    expect(screen.getByLabelText(/software change request/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target workspace directory/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit task to gateway/i })).toBeInTheDocument();
  });

  it('validates empty task description on client before submitting', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /submit task to gateway/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/please provide a clear description of the software change/i)
    ).toBeInTheDocument();
    expect(taskApi.createTask).not.toHaveBeenCalled();
  });

  it('allows adding and removing guidelines/constraints', () => {
    renderComponent();

    const constraintInput = screen.getByPlaceholderText(/add another constraint or guideline/i);
    fireEvent.change(constraintInput, { target: { value: 'Ensure 100% test branch coverage' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('Ensure 100% test branch coverage')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText(/remove constraint 1/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Ensure 100% test branch coverage')).not.toBeInTheDocument();
  });

  it('submits valid task and redirects to Task Detail page on success', async () => {
    taskApi.createTask.mockResolvedValueOnce({
      taskId: 'new-task-uuid-999',
      status: 'ACCEPTED',
      progress: 0,
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/software change request/i), {
      target: { value: 'Fix NPE in KnowledgeSearchController' },
    });
    fireEvent.change(screen.getByLabelText(/target workspace directory/i), {
      target: { value: 'D:/DevPilotAi/knowledge-service' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit task to gateway/i }));

    await waitFor(() => {
      expect(taskApi.createTask).toHaveBeenCalledWith({
        task: 'Fix NPE in KnowledgeSearchController',
        workspaceId: 'D:/DevPilotAi/knowledge-service',
        conversationHistory: expect.any(Array),
      });
      expect(mockedNavigate).toHaveBeenCalledWith('/tasks/new-task-uuid-999');
    });
  });
});
