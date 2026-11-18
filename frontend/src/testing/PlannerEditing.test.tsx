import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import FourYearPlannerPage from '@/features/planner/FourYearPlannerPage';
import { apiFetch } from '@/api/client';
jest.mock('@/api/client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: { entryYear: 2026 } }) }));
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
const course = { id: 'CSCI-1100', title: 'Computer Science 1', credits: 4 };
beforeEach(() => { jest.useFakeTimers(); localStorage.clear(); jest.clearAllMocks(); (apiFetch as jest.Mock).mockResolvedValue({ plan: {} }); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
async function mount() { render(<FourYearPlannerPage />); await act(async () => {}); }
function term(label: string) { return screen.getByText(label).parentElement!.parentElement!.parentElement!; }
function drop(label: string, payload = JSON.stringify(course)) { fireEvent.drop(term(label).querySelector('[class*="border-dashed"]')!, { dataTransfer: { getData: () => payload } }); }
test('adding/removing courses updates term totals and persists the final plan locally and remotely', async () => {
  await mount(); drop('FALL 2026'); expect(within(term('FALL 2026')).getByText('4 credits')).toBeInTheDocument();
  drop('SPRING 2027'); expect(within(term('SPRING 2027')).getByText(course.id)).toBeInTheDocument();
  fireEvent.click(within(term('FALL 2026')).getByRole('button', { name: '✕' }));
  expect(within(term('FALL 2026')).getByText('0 credits')).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('four_year_plan_v1')!); expect(saved['FALL 2026']).toEqual([]); expect(saved['SPRING 2027'][0]).toMatchObject(course);
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(apiFetch).toHaveBeenLastCalledWith('/api/plan', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ plan: saved }) }));
});
test('invalid drag payload leaves the plan unchanged', async () => {
  await mount(); drop('FALL 2026', 'invalid JSON'); expect(within(term('FALL 2026')).getByText('0 credits')).toBeInTheDocument(); expect(localStorage.getItem('four_year_plan_v1')).toBeNull();
});
test('server plan restores valid terms and ignores terms outside the four year window', async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ plan: { 'FALL 2026': [{ ...course, key: 'saved' }], 'FALL 2000': [{ ...course, key: 'old' }] } });
  await mount(); expect(screen.getAllByText(course.id)).toHaveLength(1); expect(screen.queryByText('FALL 2000')).not.toBeInTheDocument();
});
test('malformed local storage falls back to an empty plan', async () => {
  localStorage.setItem('four_year_plan_v1', '{invalid'); await mount(); expect(screen.getAllByText('0 credits')).toHaveLength(8);
});
