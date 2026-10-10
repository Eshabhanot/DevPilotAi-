import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AuthPage } from '../pages/AuthPage';
import { tokenStorage } from '../utils/tokenStorage';
import { authApi } from '../api/authApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    checkHealth: vi.fn().mockResolvedValue(true),
  },
}));

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthPage & Authentication Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.clear();
  });

  it('renders login tab by default with required email and password fields', () => {
    renderWithProviders(<AuthPage />);

    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('validates client inputs and displays validation errors for empty fields', async () => {
    renderWithProviders(<AuthPage />);

    const submitBtn = screen.getByRole('button', { name: /sign in to workspace/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('validates password length on client', async () => {
    renderWithProviders(<AuthPage />);

    const emailInput = screen.getByLabelText(/work email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in to workspace/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('switches to registration mode and validates full name requirement', async () => {
    renderWithProviders(<AuthPage />);

    const registerTab = screen.getByRole('button', { name: /^register$/i });
    fireEvent.click(registerTab);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /create devpilot account/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  });

  it('successfully logs in, saves bearer token to tokenStorage, and calls authApi', async () => {
    authApi.login.mockResolvedValueOnce({
      token: 'jwt-token-12345',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    renderWithProviders(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/work email address/i), {
      target: { value: 'dev@devpilot.ai' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in to workspace/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'dev@devpilot.ai',
        password: 'password123',
      });
      expect(tokenStorage.getToken()).toBe('jwt-token-12345');
    });
  });

  it('displays backend error message if login credentials are invalid', async () => {
    const error = new Error('Invalid email or password');
    error.userMessage = 'Invalid email or password';
    authApi.login.mockRejectedValueOnce(error);

    renderWithProviders(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/work email address/i), {
      target: { value: 'wrong@devpilot.ai' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in to workspace/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
