import { TODAY_ISO } from '../data/initialData';

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function isOverdue(isoDate: string, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  return isoDate < TODAY_ISO;
}

export function isDueToday(isoDate: string): boolean {
  return isoDate === TODAY_ISO;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getWeekDays(startIso: string): { iso: string; dayName: string; dayNum: string; monthLabel: string }[] {
  const result: { iso: string; dayName: string; dayNum: string; monthLabel: string }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const iso = addDaysISO(startIso, i);
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    result.push({
      iso,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dayNum: String(day).padStart(2, '0'),
      monthLabel: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    });
  }
  return result;
}
