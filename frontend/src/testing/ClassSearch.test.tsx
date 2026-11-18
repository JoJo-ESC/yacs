import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ClassSearch from '@/features/schedule/components/ClassSearch';
import { useSchedule } from '@/context/schedule/schedule-context';
import { makeCourse } from './scheduleFixtures';
jest.mock('@/context/schedule/schedule-context', () => ({ useSchedule: jest.fn() }));
jest.mock('@/context/semester/semester-context', () => ({ useSemester: () => ({ selectedSemester: '202609' }) }));
// JSDOM has no layout measurements; render every virtual row to exercise search behavior.
jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: ({ count }: { count: number }) => ({ getTotalSize: () => count * 40, getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 40 })) }) }));
const addCourse = jest.fn(); const loadCatalog = jest.fn().mockResolvedValue(undefined);
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); loadCatalog.mockResolvedValue(undefined); (useSchedule as jest.Mock).mockReturnValue({ catalog: [makeCourse(), makeCourse({ id: 'MATH-1010', title: 'Calculus' })], catalogStatus: 'ready', catalogLoading: false, addCourse, loadCatalog, hasCourse: () => false }); });
afterEach(() => { jest.useRealTimers(); });
function mount() { render(<><div id="class-search-results-slot" /><ClassSearch /></>); fireEvent.focus(screen.getByRole('combobox')); }
test('debounces title/code filtering and reports empty results', () => {
  mount(); const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'cALc' } });
  expect(screen.getAllByRole('option')).toHaveLength(2);
  act(() => { jest.advanceTimersByTime(120); }); expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('option')).toHaveTextContent('MATH-1010');
  fireEvent.change(input, { target: { value: 'nonexistent' } }); act(() => { jest.advanceTimersByTime(120); });
  expect(screen.getByText('No classes found.')).toBeInTheDocument();
});
test('adds the selected course with meetings and keeps search focused', () => {
  mount(); fireEvent.click(screen.getByRole('option', { name: /CSCI-1100/ }));
  expect(addCourse).toHaveBeenCalledWith(makeCourse()); expect(screen.getByRole('combobox')).toHaveFocus();
});
test('already selected courses cannot be added twice', () => {
  (useSchedule as jest.Mock).mockReturnValue({ catalog: [makeCourse()], hasCourse: () => true });
  mount(); expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('option')); expect(addCourse).not.toHaveBeenCalled();
});
test('shows loading and retries a failed catalog when opened', () => {
  (useSchedule as jest.Mock).mockReturnValue({ catalog: [], catalogStatus: 'error', catalogLoading: true, loadCatalog });
  mount(); expect(screen.getByText('Loading classes…')).toBeInTheDocument(); expect(loadCatalog).toHaveBeenCalledWith('202609');
});
test('Escape and outside clicks dismiss results', () => {
  mount(); fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' }); expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.focus(screen.getByRole('combobox')); fireEvent.mouseDown(document.body); expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
