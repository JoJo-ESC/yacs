import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfessorsPage from '@/features/professors/routes/ProfessorsPage';
import ProfessorDetailPage from '@/features/professors/routes/ProfessorDetailPage';
import { buildProfessorList } from '@/features/professors/utils/professors';
import { useSchedule } from '@/context/schedule/schedule-context';
import { makeCourse, makeMeeting } from './scheduleFixtures';
jest.mock('@/context/schedule/schedule-context', () => ({ useSchedule: jest.fn() }));
jest.mock('@/context/semester/semester-context', () => ({ useSemester: () => ({ selectedSemester: '202609' }) }));
const catalog = [makeCourse({ meetings: [makeMeeting({ instructor: 'Ada Lovelace' }), makeMeeting({ instructor: 'Ada Lovelace' })] }), makeCourse({ id: 'MATH-1010', title: 'Calculus', meetings: [makeMeeting({ instructor: 'Grace Hopper' })] })];
beforeEach(() => { (useSchedule as jest.Mock).mockReturnValue({ catalog, catalogLoading: false }); });
function mount(path = '/professors') { return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/professors" element={<ProfessorsPage />} /><Route path="/professors/:professorSlug" element={<ProfessorDetailPage />} /></Routes></MemoryRouter>); }
test('deduplicates repeated meetings and omits blank instructors', () => {
  const list = buildProfessorList([...catalog, makeCourse({ meetings: [makeMeeting({ instructor: ' ' })] })]);
  expect(list).toHaveLength(2); expect(list[0]).toMatchObject({ slug: 'ada-lovelace', courseCount: 1 });
});
test('directory searches names case insensitively and links to course details', () => {
  mount(); expect(screen.getByText(/for 202609/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' ADA ' } }); expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: /Ada Lovelace/ }));
  expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument(); expect(screen.getByText('CSCI-1100')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View on Rate My Professors' })).toHaveAttribute('href', 'https://www.ratemyprofessors.com/search/professors?query=Ada+Lovelace');
});
test('unmatched search shows an empty result', () => {
  mount(); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } }); expect(screen.getByText('No professors match that search yet.')).toBeInTheDocument();
});
test('catalog changes replace the directory entries', () => {
  const { rerender } = mount(); (useSchedule as jest.Mock).mockReturnValue({ catalog: [catalog[1]], catalogLoading: false });
  rerender(<MemoryRouter><ProfessorsPage /></MemoryRouter>); expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument(); expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
});
test.each([true, false])('directory handles loading/empty catalog (loading=%s)', loading => {
  (useSchedule as jest.Mock).mockReturnValue({ catalog: [], catalogLoading: loading }); mount();
  expect(screen.getByText(loading ? 'Loading professor directory from the current course catalog.' : 'No professors are available in this catalog view yet.')).toBeInTheDocument();
});
test('missing professor has a recovery link', () => { mount('/professors/missing'); expect(screen.getByRole('heading', { name: 'Professor not found' })).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Back to professor directory' })).toHaveAttribute('href', '/professors'); });
