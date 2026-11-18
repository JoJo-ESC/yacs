import { copyScheduleAsText, copyFinalsAsText, downloadScheduleIcs, downloadFinalsIcs, printSchedulePdf, printFinalsPdf } from '@/lib/schedule/exportSchedule';
import { makeCourse } from './scheduleFixtures';
import { getFinalsForCourses } from '@/features/finals/utils/finalsSchedule';
const courses = [makeCourse()]; const finals = getFinalsForCourses(courses);
afterEach(() => { jest.restoreAllMocks(); });
test('schedule and finals clipboard exports write readable text', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try { await copyScheduleAsText(courses); await copyFinalsAsText(finals); expect(writeText).toHaveBeenCalledTimes(2); for (const [text] of writeText.mock.calls) expect(text).toContain('CSCI-1100'); }
  finally { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); }
});
test('ICS downloads click temporary links and release blob URLs', () => {
  const create = jest.fn().mockReturnValue('blob:test'); const revoke = jest.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create }); Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  const names: string[] = []; jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) { names.push(this.download); expect(this.href).toBe('blob:test'); });
  downloadScheduleIcs(courses); downloadFinalsIcs(finals);
  expect(names).toEqual(['yacs-schedule.ics', 'yacs-finals-fall-2024.ics']); expect(create).toHaveBeenCalledWith(expect.any(Blob)); expect(revoke).toHaveBeenCalledTimes(2); expect(document.querySelector('a[download]')).toBeNull();
});
test('PDF windows receive content before printing, preventing blank exports', () => {
  const order: string[] = [];
  const popup = { opener: {}, document: { open: jest.fn(), write: jest.fn((html: string) => { expect(html).toContain('CSCI-1100'); order.push('write'); }), close: jest.fn(() => order.push('close')) }, focus: jest.fn(), print: jest.fn(() => order.push('print')) };
  jest.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
  printSchedulePdf(courses); printFinalsPdf(finals); expect(order).toEqual(['write', 'close', 'print', 'write', 'close', 'print']); expect(popup.opener).toBeNull();
});
test('blocked print popups do not crash', () => { jest.spyOn(window, 'open').mockReturnValue(null); expect(() => { printSchedulePdf(courses); printFinalsPdf(finals); }).not.toThrow(); });
