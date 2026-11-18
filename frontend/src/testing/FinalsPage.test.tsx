import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FinalsPage from '@/features/finals/routes/FinalsPage';
import { getFinalsForCourses } from '@/features/finals/utils/finalsSchedule';
import { useSchedule } from '@/context/schedule/schedule-context';
import * as exports from '@/lib/schedule/exportSchedule';
import { makeCourse } from './scheduleFixtures';
jest.mock('@/context/schedule/schedule-context', () => ({ useSchedule: jest.fn() }));
jest.mock('@/lib/schedule/exportSchedule');
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); (useSchedule as jest.Mock).mockReturnValue({ courses: [makeCourse()] }); (exports.copyFinalsAsText as jest.Mock).mockResolvedValue(undefined); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
test('placeholder adapter only returns known selected courses and preserves their titles', () => {
  expect(getFinalsForCourses([makeCourse({ title: 'Custom title' }), makeCourse({ id: 'UNKNOWN' })])).toEqual([expect.objectContaining({ courseId: 'CSCI-1100', courseTitle: 'Custom title', location: 'DCC 308', semester: 'FALL 2024' })]);
});
test.each([{ courses: [] }, { courses: [makeCourse({ id: 'UNKNOWN' })] }])('missing finals hides export actions', ({ courses }) => {
  (useSchedule as jest.Mock).mockReturnValue({ courses }); render(<FinalsPage />);
  expect(screen.getByText('No placeholder finals entries exist for the currently selected courses yet.')).toBeInTheDocument(); expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
test('exports the displayed finals and resets clipboard confirmation', async () => {
  render(<FinalsPage />); expect(screen.getByText('CSCI-1100 final')).toBeInTheDocument();
  const finals = getFinalsForCourses([makeCourse()]);
  fireEvent.click(screen.getByRole('button', { name: 'Export finals ICS' })); expect(exports.downloadFinalsIcs).toHaveBeenCalledWith(finals);
  fireEvent.click(screen.getByRole('button', { name: 'Export finals PDF' })); expect(exports.printFinalsPdf).toHaveBeenCalledWith(finals);
  fireEvent.click(screen.getByRole('button', { name: 'Export finals PNG' })); expect(exports.downloadFinalsPng).toHaveBeenCalledWith(finals);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy finals text' })); });
  expect(exports.copyFinalsAsText).toHaveBeenCalledWith(finals); expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(2000); }); expect(screen.getByRole('button', { name: 'Copy finals text' })).toBeInTheDocument();
});
