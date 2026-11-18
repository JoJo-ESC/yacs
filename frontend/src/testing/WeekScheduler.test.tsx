import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WeekScheduler, { computeEventPosition, parseTimeToMinutes, formatClock12h } from '@/features/schedule/components/WeekScheduler';
import { useSchedule } from '@/context/schedule/schedule-context';
import { makeCourse, makeMeeting } from './scheduleFixtures';
jest.mock('@/context/schedule/schedule-context', () => ({ useSchedule: jest.fn() }));
beforeEach(() => { (useSchedule as jest.Mock).mockReturnValue({ courses: [] }); });
test.each([['12:00AM', 0, '12AM'], ['12:30PM', 750, '12:30PM'], ['21:15', 1275, '9:15PM']])('formats %s correctly', (input, minutes, label) => {
  expect(parseTimeToMinutes(input)).toBe(minutes); expect(formatClock12h(input)).toBe(label);
});
test('positions meetings relative to the visible grid and clips outside hours', () => {
  expect(computeEventPosition('09:00AM', '10:00AM', 8, 12)).toEqual({ topPct: 25, heightPct: 25, duration: 60 });
  expect(computeEventPosition('07:00AM', '09:00AM', 8, 12)).toEqual({ topPct: 0, heightPct: 25, duration: 60 });
  expect(computeEventPosition('01:00PM', '02:00PM', 8, 12).heightPct).toBe(0);
});
test('expands weekday meetings, skips unscheduled courses and supports event clicks', () => {
  (useSchedule as jest.Mock).mockReturnValue({ courses: [makeCourse(), makeCourse({ id: 'NONE', title: 'Unscheduled', meetings: [makeMeeting({ days: [] })] })] });
  const click = jest.fn(); render(<WeekScheduler onEventClick={click} showWeekend={false} />);
  expect(screen.getAllByRole('button', { name: /Computer Science 1/ })).toHaveLength(2);
  expect(screen.queryByText('Unscheduled')).not.toBeInTheDocument(); expect(screen.queryByText('Sat')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button')[0]); expect(click).toHaveBeenCalledWith(expect.objectContaining({ id: 'CSCI-1100', day: 0 }));
});
test('warns for overlaps but allows adjacent meetings', () => {
  const first = { key: 'a', id: 'a', title: 'First', day: 0 as const, start: '09:00AM', end: '10:00AM' };
  const { rerender } = render(<WeekScheduler events={[first, { ...first, key: 'b', id: 'b', title: 'Second', start: '09:30AM' }]} />);
  expect(screen.getByText('Conflict detected')).toBeInTheDocument();
  rerender(<WeekScheduler events={[first, { ...first, key: 'b', start: '10:00AM', end: '11:00AM' }]} />);
  expect(screen.queryByText('Conflict detected')).not.toBeInTheDocument();
});
