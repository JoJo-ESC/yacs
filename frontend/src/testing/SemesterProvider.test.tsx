import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { SemesterProvider, useSemester } from '@/context/semester/semester-context';
import { fetchSemesters } from '@/api';
jest.mock('@/api', () => ({ fetchSemesters: jest.fn() }));
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
let semester: ReturnType<typeof useSemester>;
function Probe() { semester = useSemester(); return <div>{semester.selectedSemester}</div>; }
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
test('starts with cached latest term, then corrects and caches the server latest', async () => {
  localStorage.setItem('yacs:latestSemester', '202601');
  let resolve!: (value: unknown) => void;
  (fetchSemesters as jest.Mock).mockReturnValue(new Promise(r => { resolve = r; }));
  render(<SemesterProvider><Probe /></SemesterProvider>);
  expect(screen.getByText('202601')).toBeInTheDocument(); expect(semester.semestersLoading).toBe(true);
  await act(async () => { resolve([{ term: '202609' }, { term: '202601' }]); });
  expect(semester.selectedSemester).toBe('202609'); expect(semester.semesters).toHaveLength(2);
  expect(localStorage.getItem('yacs:latestSemester')).toBe('202609'); expect(semester.semestersLoading).toBe(false);
});
test('late server response does not replace an explicit user choice', async () => {
  let resolve!: (value: unknown) => void;
  (fetchSemesters as jest.Mock).mockReturnValue(new Promise(r => { resolve = r; }));
  render(<SemesterProvider><Probe /></SemesterProvider>);
  act(() => semester.setSelectedSemester('202501'));
  await act(async () => { resolve([{ term: '202609' }]); });
  expect(semester.selectedSemester).toBe('202501');
});
test.each([false, true])('empty or failed response ends loading and preserves startup term (failure=%s)', async fail => {
  localStorage.setItem('yacs:latestSemester', '202609');
  (fetchSemesters as jest.Mock).mockImplementation(() => fail ? Promise.reject(new Error('offline')) : Promise.resolve([]));
  render(<SemesterProvider><Probe /></SemesterProvider>);
  await waitFor(() => expect(semester.semestersLoading).toBe(false));
  expect(semester.selectedSemester).toBe('202609'); expect(semester.semesters).toEqual([]);
});
