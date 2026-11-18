import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LandingAuthPage from '@/features/auth/routes/LandingAuthPage';
import { useAuth } from '@/features/auth/hooks/useAuth';
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: jest.fn() }));
const login = jest.fn(); const signup = jest.fn(); const guest = jest.fn();
beforeEach(() => { jest.resetAllMocks(); (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isGuest: false, isBusy: false, clearError: jest.fn(), login, signup, continueAsGuest: guest }); });
function mount() { render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LandingAuthPage />} /><Route path="/" element={<div>Course browser</div>} /></Routes></MemoryRouter>); }
function credentials() { fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } }); fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } }); }
test('login submits credentials and navigates only after success', async () => {
  login.mockResolvedValueOnce(false).mockResolvedValueOnce(true); mount(); credentials();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Log in to YACS' })); });
  expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' }); expect(screen.queryByText('Course browser')).not.toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Log in to YACS' })); }); expect(screen.getByText('Course browser')).toBeInTheDocument();
});
test('signup submits name and selected entry year', async () => {
  signup.mockResolvedValue(true); mount(); fireEvent.click(screen.getByRole('button', { name: 'Sign up' })); credentials();
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ada' } });
  const year = new Date().getFullYear(); fireEvent.change(screen.getByLabelText('Year you started at RPI'), { target: { value: String(year) } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Create account' })); });
  expect(signup).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', password: 'password123', entryYear: year }); expect(screen.getByText('Course browser')).toBeInTheDocument();
});
test('guest button enters the course browser', () => { mount(); fireEvent.click(screen.getByRole('button', { name: 'Continue as Guest' })); expect(guest).toHaveBeenCalledTimes(1); expect(screen.getByText('Course browser')).toBeInTheDocument(); });
test('busy state disables submission and server errors are visible', () => {
  (useAuth as jest.Mock).mockReturnValue({ isBusy: true, error: 'Too many attempts', clearError: jest.fn() }); mount(); expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled(); expect(screen.getByText('Too many attempts')).toBeInTheDocument();
});
