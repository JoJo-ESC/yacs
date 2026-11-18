import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfilePage from '@/features/profile/ProfilePage';
import { apiFetch } from '@/api/client';
jest.mock('@/api/client', () => ({ apiFetch: jest.fn() }));
const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ logout: mockLogout }) }));
const profile = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', major: 'CS', degree: 'BS', profile_image_url: null };
beforeEach(() => { jest.clearAllMocks(); (apiFetch as jest.Mock).mockResolvedValue(profile); });
function mount() { render(<MemoryRouter><Routes><Route path="/" element={<ProfilePage />} /><Route path="/login" element={<div>Sign in again</div>} /></Routes></MemoryRouter>); }
test('loads profile and saves edited values using PATCH', async () => {
  mount(); expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: profile.name })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grace Hopper' } });
  (apiFetch as jest.Mock).mockResolvedValue({ ...profile, name: 'Grace Hopper' });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('heading', { name: 'Grace Hopper' })).toBeInTheDocument();
  expect(apiFetch).toHaveBeenLastCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'Grace Hopper', email: profile.email, major: 'CS', degree: 'BS' }) }));
});
test('cancel discards unsaved edits', async () => {
  mount(); await screen.findByText(profile.email); fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Unsaved' } }); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' })); expect(screen.getByLabelText('Name')).toHaveValue(profile.name);
  expect(apiFetch).toHaveBeenCalledTimes(1);
});
test('failed save keeps edits available and displays the API error', async () => {
  mount(); await screen.findByText(profile.email); fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));
  (apiFetch as jest.Mock).mockRejectedValue(new Error('Save unavailable')); fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.getAllByText('Save unavailable')).toHaveLength(2)); expect(screen.getByLabelText('Name')).toHaveValue(profile.name);
});
test('load failure is visible', async () => {
  (apiFetch as jest.Mock).mockRejectedValue(new Error('Profile unavailable')); mount(); expect(await screen.findByText('Profile unavailable')).toBeInTheDocument();
});
test('logout returns to login', async () => {
  mount(); await screen.findByText(profile.email); fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(await screen.findByText('Sign in again')).toBeInTheDocument(); expect(mockLogout).toHaveBeenCalledTimes(1);
});
