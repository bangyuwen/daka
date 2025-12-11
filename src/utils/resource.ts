import { subMinutes, eachDayOfInterval } from 'date-fns';
import {
  CST_OFFSET_MINUTES,
  PUNCH_TYPE,
  WORK_HOURS,
  PUNCH_WINDOW_MINUTES,
  type PunchType,
} from '../constants';

// Types
export interface CalendarEvent {
  startDateTime: string;
  endDateTime: string;
}

interface DailyEvent {
  date: string;
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
}

interface ParsedDateTime {
  date: string;
  hour: string;
  min: string;
}

// Date utilities
export function getCSTDate(date: Date): Date {
  const offset =
    date.getTimezoneOffset() !== 0
      ? date.getTimezoneOffset()
      : CST_OFFSET_MINUTES;
  return subMinutes(date, offset);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysArray(start: string, end: string): string[] {
  return eachDayOfInterval({
    start: new Date(start),
    end: new Date(end),
  }).map((day) => formatDate(getCSTDate(day)));
}

// Time constants (computed at runtime)
const UTC_TODAY = new Date();
export const TODAY = getCSTDate(UTC_TODAY);
export const HOUR = TODAY.getUTCHours();

// Delay utilities
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function delay(maxMins: number): Promise<void> {
  const delaySecs = Math.floor(Math.random() * maxMins * 60);
  if (delaySecs) {
    console.log(`daka delay ${(delaySecs / 60).toFixed(2)} mins`);
  }
  return sleep(delaySecs * 1000);
}

// Cookie utilities
export function parseCookies(setCookie: string[]): string {
  return setCookie.map((cookie) => `${cookie.split(';')[0]};`).join('');
}

// Event checking helpers
function parseEventDateTime(dateTimeStr: string): ParsedDateTime {
  const [date, time] = dateTimeStr.split('T');
  const [hour, min] = time.split(':');
  return { date, hour, min };
}

function expandMultiDayEvent(event: CalendarEvent): DailyEvent[] {
  const start = parseEventDateTime(event.startDateTime);
  const end = parseEventDateTime(event.endDateTime);

  if (start.date === end.date) {
    return [
      {
        date: start.date,
        startHour: start.hour,
        startMin: start.min,
        endHour: end.hour,
        endMin: end.min,
      },
    ];
  }

  const days = getDaysArray(start.date, end.date);
  return days.map((day) => {
    const dailyEvent: DailyEvent = {
      date: day,
      startHour: String(WORK_HOURS.START),
      startMin: '00',
      endHour: String(WORK_HOURS.END),
      endMin: '00',
    };

    if (day === start.date) {
      dailyEvent.startHour = start.hour;
      dailyEvent.startMin = start.min;
    } else if (day === end.date) {
      dailyEvent.endHour = end.hour;
      dailyEvent.endMin = end.min;
    }

    return dailyEvent;
  });
}

function isWithinPunchWindow(
  event: DailyEvent,
  hour: string,
  min: string,
  punchType: PunchType
): boolean {
  const { startHour, startMin, endHour, endMin } = event;

  // Between event start and end
  if (startHour <= hour && hour <= endHour) {
    return true;
  }

  // Check if punch time is within window of event boundary
  if (punchType === PUNCH_TYPE.START) {
    const timeDiff =
      (Number(startHour) - Number(hour)) * 60 +
      (Number(startMin) - Number(min));
    return timeDiff <= PUNCH_WINDOW_MINUTES;
  }

  if (punchType === PUNCH_TYPE.END) {
    const timeDiff =
      (Number(hour) - Number(endHour)) * 60 + (Number(min) - Number(endMin));
    return timeDiff <= PUNCH_WINDOW_MINUTES;
  }

  return false;
}

// Main event checking function
interface CheckPersonalEventsOptions {
  events?: CalendarEvent[];
  today?: string;
  hour?: string;
  min?: string;
  punchType?: PunchType;
}

export function checkPersonalEvents(
  options: CheckPersonalEventsOptions = {}
): boolean {
  const { events = [], today = '', hour = '', min = '', punchType = '' } = options;

  const expandedEvents = events.flatMap(expandMultiDayEvent);

  for (const event of expandedEvents) {
    if (event.date !== today) continue;

    if (punchType && isWithinPunchWindow(event, hour, min, punchType as PunchType)) {
      return true;
    }
  }

  return false;
}
