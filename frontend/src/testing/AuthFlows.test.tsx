import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as api from '@/features/auth/api/authApi';
import RequireAuthenticated from '@/features/auth/components/RequireAuthenticated';
import RequireAppAccess from '@/features/auth/components/RequireAppAccess';
jest.mock('@/features/auth/api/authApi');
jest.mock('@/lib/analytics', () => ({ identifyUser: jest.fn(), resetUser: jest.fn(), track: jest.fn() }));
let auth: ReturnType<typeof useAuth>;
function Probe() { auth = useAuth(); return <div>{auth.state}:{auth.error}</div>; }
const session = api.getCurrentSessionUser as jest.Mock;
const login = api.loginUser as jest.Mock;
beforeEach(() => { localStorage.clear(); jest.resetAllMocks(); session.mockResolvedValue({ statusCode: 401 }); });
async function mount() { const view = render(<AuthProvider><Probe /></AuthProvider>); await waitFor(() => expect(auth.isBusy).toBe(false)); return view; }
test('successful login persists the server user and logout clears it even offline', async () => {
  await mount();
  login.mockResolvedValue({ ok: true, success: true, user: { name: 'Ada', email: 'ada@example.com', entry_year: 2026 } });
  await act(async () => { expect(await auth.login({ email: 'ada@example.com', password: 'secret' })).toBe(true); });
  expect(auth.user?.entryYear).toBe(2026);
  expect(JSON.parse(localStorage.getItem('yacs.auth.user')!).name).toBe('Ada');
  (api.logoutUser as jest.Mock).mockRejectedValue(new Error('offline'));
  await act(async () => { await auth.logout(); });
  expect(auth.state).toBe('anonymous'); expect(localStorage.getItem('yacs.auth.user')).toBeNull();
});
test.each([[{ statusCode: 401 }, 'Invalid email or password.'], [{ statusCode: 429 }, 'Too many failed login attempts. Please wait and try again.']])('failed login reports %j', async (response, message) => {
  await mount(); login.mockResolvedValue(response);
  await act(async () => { expect(await auth.login({ email: 'a', password: 'b' })).toBe(false); });
  expect(screen.getByText(`anonymous:${message}`)).toBeInTheDocument(); expect(auth.isBusy).toBe(false);
  act(() => auth.clearError()); expect(auth.error).toBeNull();
});
test('network login failure shows a recoverable error', async () => {
  await mount(); login.mockRejectedValue(new Error('offline'));
  await act(async () => { await auth.login({ email: 'a', password: 'b' }); });
  expect(auth.error).toMatch(/connection/); expect(auth.isBusy).toBe(false);
});
test('expired server session removes the cached identity', async () => {
  localStorage.setItem('yacs.auth.user', JSON.stringify({ name: 'Ada', email: 'a' }));
  await mount(); expect(auth.state).toBe('anonymous'); expect(localStorage.getItem('yacs.auth.user')).toBeNull();
});
test('offline hydration preserves a cached user', async () => {
  localStorage.setItem('yacs.auth.user', JSON.stringify({ name: 'Ada', email: 'a' }));
  session.mockRejectedValue(new Error('offline')); await mount(); expect(auth.user?.name).toBe('Ada');
});
test('guest choice persists across remounts without requesting a session', async () => {
  const view = await mount(); act(() => auth.continueAsGuest()); expect(auth.isGuest).toBe(true);
  expect(localStorage.getItem('yacs.auth.guest')).toBe('true');
  view.unmount(); session.mockClear(); await mount(); expect(auth.isGuest).toBe(true); expect(session).not.toHaveBeenCalled();
});
test('signup reports failure if the account is created but automatic login fails', async () => {
  await mount(); (api.signupUser as jest.Mock).mockResolvedValue({ ok: true }); login.mockResolvedValue({ ok: false });
  await act(async () => { expect(await auth.signup({ name: 'Ada', email: 'a', password: 'b' })).toBe(false); });
  expect(auth.error).toMatch(/Account created but login failed/);
});
test.each(['guest', 'anonymous', 'authenticated'])('route guards enforce %s access', async state => {
  if (state === 'guest') localStorage.setItem('yacs.auth.guest', 'true');
  if (state === 'authenticated') { localStorage.setItem('yacs.auth.user', JSON.stringify({ name: 'Ada' })); session.mockResolvedValue({ statusCode: 503 }); }
  render(<AuthProvider><MemoryRouter initialEntries={['/private']}><Routes>
    <Route element={<RequireAppAccess />}><Route path="/" element={<div>Guest home</div>} /></Route>
    <Route element={<RequireAuthenticated />}><Route path="/private" element={<div>Private profile</div>} /></Route>
    <Route path="/login" element={<div>Login required</div>} />
  </Routes></MemoryRouter></AuthProvider>);
  expect(await screen.findByText(state === 'guest' ? 'Guest home' : state === 'authenticated' ? 'Private profile' : 'Login required')).toBeInTheDocument();
});
