import { env } from 'cloudflare:workers';

export const TIME_ZONE = 'America/Sao_Paulo';
export const SLOT_STEP_MINUTES = 30;

export type Slot = { start: string; time: string };
export type ScheduleDay = { date: string; dayLabel: string; dateLabel: string; disabled: boolean; reason?: string; slots: Slot[] };
export type ScheduleWeek = { startsOn: string; label: string; occupancy: number; days: ScheduleDay[] };

const DEFAULT_WINDOWS: Record<number, Array<{ start: string; end: string }>> = {
  1: [{ start: '13:00', end: '19:00' }],
  2: [{ start: '13:00', end: '19:00' }],
  4: [{ start: '13:00', end: '19:00' }],
  5: [{ start: '12:00', end: '15:00' }],
  6: [{ start: '13:00', end: '19:00' }],
};

type AppointmentWindow = { starts_at: string; ends_at: string; duration_minutes: number };
type AvailabilityRow = { weekday: number; start_time: string; end_time: string };
type ExceptionRow = { date: string; start_time: string | null; end_time: string | null; kind: 'open' | 'blocked' };

export function localToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function addDays(date: string, amount: number): string {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + amount);
  return result.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function mondayOf(date: string): string {
  const day = weekday(date);
  // Aos domingos, a agenda útil seguinte começa na segunda-feira que vem.
  return addDays(date, day === 0 ? 1 : 1 - day);
}

function minutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function endTimestamp(start: string, durationMinutes: number): string {
  const [date, time] = start.split('T');
  return `${date}T${timeFromMinutes(minutes(time) + durationMinutes)}:00`;
}

function overlaps(start: string, end: string, appointment: AppointmentWindow): boolean {
  return start < appointment.ends_at && end > appointment.starts_at;
}

function weekLabel(startsOn: string): string {
  const endsOn = addDays(startsOn, 5);
  const first = new Date(`${startsOn}T12:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const last = new Date(`${endsOn}T12:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${first} — ${last}`;
}

export async function buildSchedule(durationMinutes: number): Promise<{ weeks: ScheduleWeek[]; nextWeekLocked: boolean }> {
  const today = localToday();
  const currentMonday = mondayOf(today);
  const through = addDays(currentMonday, 14);
  let availability: AvailabilityRow[] = [];
  let appointments: AppointmentWindow[] = [];
  let exceptions: ExceptionRow[] = [];

  try {
    const [availabilityResult, appointmentResult, exceptionResult] = await Promise.all([
      env.DB.prepare('SELECT weekday, start_time, end_time FROM weekly_availability WHERE active = true ORDER BY weekday, start_time').all<AvailabilityRow>(),
      env.DB.prepare("SELECT starts_at, ends_at, duration_minutes FROM appointments WHERE status IN ('pending','confirmed') AND starts_at >= ? AND starts_at < ? ORDER BY starts_at").bind(`${currentMonday}T00:00:00`, `${through}T00:00:00`).all<AppointmentWindow>(),
      env.DB.prepare('SELECT date, start_time, end_time, kind FROM availability_exceptions WHERE date >= ? AND date < ? ORDER BY date, start_time').bind(currentMonday, through).all<ExceptionRow>(),
    ]);
    availability = availabilityResult.results;
    appointments = appointmentResult.results;
    exceptions = exceptionResult.results;
  } catch {
    availability = Object.entries(DEFAULT_WINDOWS).flatMap(([day, windows]) => windows.map((window) => ({ weekday: Number(day), start_time: window.start, end_time: window.end })));
  }

  const totalMinutes = availability.reduce((total, item) => total + minutes(item.end_time) - minutes(item.start_time), 0);
  const currentWeekEnd = `${addDays(currentMonday, 7)}T00:00:00`;
  const bookedMinutes = appointments.filter((item) => item.starts_at < currentWeekEnd).reduce((total, item) => total + item.duration_minutes, 0);
  const occupancy = totalMinutes ? Math.min(bookedMinutes / totalMinutes, 1) : 0;
  const weekStarts = occupancy >= 0.6 ? [currentMonday, addDays(currentMonday, 7)] : [currentMonday];

  const weeks = weekStarts.map((weekStart, weekIndex): ScheduleWeek => {
    const days = Array.from({ length: 6 }, (_, offset): ScheduleDay => {
      const date = addDays(weekStart, offset);
      const dayNumber = weekday(date);
      const dayExceptions = exceptions.filter((item) => item.date === date);
      const fullyBlocked = dayExceptions.some((item) => item.kind === 'blocked' && !item.start_time && !item.end_time);
      const openExceptions = dayExceptions.filter((item) => item.kind === 'open' && item.start_time && item.end_time);
      const baseWindows = availability.filter((item) => item.weekday === dayNumber).map((item) => ({ start: item.start_time, end: item.end_time }));
      const windows = openExceptions.length ? openExceptions.map((item) => ({ start: item.start_time!, end: item.end_time! })) : baseWindows;
      const slots: Slot[] = [];

      if (!fullyBlocked && date >= today) {
        for (const window of windows) {
          for (let value = minutes(window.start); value + durationMinutes <= minutes(window.end); value += SLOT_STEP_MINUTES) {
            const time = timeFromMinutes(value);
            const start = `${date}T${time}:00`;
            const end = endTimestamp(start, durationMinutes);
            const blockedByException = dayExceptions.some((item) => item.kind === 'blocked' && item.start_time && item.end_time && start < `${date}T${item.end_time}:00` && end > `${date}T${item.start_time}:00`);
            if (!blockedByException && !appointments.some((item) => overlaps(start, end, item))) slots.push({ start, time });
          }
        }
      }

      const label = new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
      return { date, dayLabel: label, dateLabel: date.slice(8), disabled: windows.length === 0 || fullyBlocked, reason: windows.length === 0 || fullyBlocked ? 'Sem atendimento' : undefined, slots };
    });
    return { startsOn: weekStart, label: weekLabel(weekStart), occupancy: weekIndex === 0 ? occupancy : 0, days };
  });

  return { weeks, nextWeekLocked: occupancy < 0.6 };
}

export async function validateSlot(start: string, durationMinutes: number, allowRequestedOverlap: boolean): Promise<boolean> {
  const schedule = await buildSchedule(durationMinutes);
  const offered = schedule.weeks.some((week) => week.days.some((day) => day.slots.some((slot) => slot.start === start)));
  if (!offered) return false;
  if (allowRequestedOverlap) return true;
  const end = endTimestamp(start, durationMinutes);
  const conflict = await env.DB.prepare("SELECT id FROM appointments WHERE status IN ('pending','confirmed') AND starts_at < ? AND ends_at > ? LIMIT 1").bind(end, start).first();
  return !conflict;
}
