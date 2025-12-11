import * as cheerio from 'cheerio';
import { PUNCH_TYPE, type PunchType } from '../constants';
import {
  checkPersonalEvents,
  parseCookies,
  formatDate,
  TODAY,
  HOUR,
  getCSTDate,
} from '../utils/resource';
import type { DakaModule, LoginCredentials, PunchOptions } from './types';

const CALENDAR_DAY_OFF_IDS = ['CY00003', 'CY00004'];
const ATTENDANCE_TYPE = { PUNCH_IN: 1, PUNCH_OUT: 2 } as const;

interface CalendarResponse {
  Data: {
    Calendars: Array<{
      ItemOptionId: string;
      LeaveSheets?: Array<{
        LeaveStartDatetime: string;
        LeaveEndDatetime: string;
      }>;
    }>;
  };
}

interface LocationResponse {
  Data: Array<{
    PunchesLocationId: string;
    Latitude: number;
    Longitude: number;
  }>;
}

interface PunchResponse {
  Meta?: {
    HttpStatusCode: string;
  };
  Data: {
    punchDate: string;
  };
}

interface TokenResponse {
  code?: string;
}

class MayoModule implements DakaModule {
  private cookie = '';

  async login({ username, password }: LoginCredentials): Promise<void> {
    // Get the CSRF token
    const res1 = await fetch('https://auth.mayohr.com/HRM/Account/Login');
    this.cookie = parseCookies(res1.headers.getSetCookie());
    const html = await res1.text();
    const $ = cheerio.load(html);
    const csrfToken = $('[name=__RequestVerificationToken]').attr('value');

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    // Login
    const body = new URLSearchParams();
    body.append('__RequestVerificationToken', csrfToken);
    body.append('grant_type', 'password');
    body.append('password', password);
    body.append('userName', username);
    body.append('userStatus', '1');

    const res2 = await fetch('https://auth.mayohr.com/Token', {
      method: 'POST',
      headers: { cookie: this.cookie },
      body,
    });
    this.cookie += parseCookies(res2.headers.getSetCookie());

    const { code } = (await res2.json()) as TokenResponse;
    if (!code) {
      throw new Error('Failed to get auth code');
    }

    // Get session cookie
    const res3 = await fetch(
      `https://authcommon.mayohr.com/api/auth/checkticket?code=${code}`,
      {
        method: 'GET',
        headers: { cookie: this.cookie },
      }
    );
    this.cookie += parseCookies(res3.headers.getSetCookie());
  }

  async logout(): Promise<void> {
    await fetch('https://auth.mayohr.com/api/accountapi/Logout', {
      method: 'GET',
      headers: { cookie: this.cookie },
    });
  }

  async checkDakaDay({ punchType }: PunchOptions): Promise<boolean> {
    const dakaDay = formatDate(TODAY);
    const year = TODAY.getUTCFullYear();
    const month = TODAY.getUTCMonth() + 1;
    const day = TODAY.getUTCDate();
    const minute = TODAY.getUTCMinutes();

    const res = await fetch(
      `https://apolloxe.mayohr.com/backend/pt/api/EmployeeCalendars/scheduling/V2?year=${year}&month=${month}`,
      {
        method: 'GET',
        headers: { cookie: this.cookie },
      }
    );

    const { Data } = (await res.json()) as CalendarResponse;
    if (!Data.Calendars) {
      throw new Error('Failed to get calendar');
    }

    const calendarIndex = day - 1;
    const currentDayCalendar = Data.Calendars[calendarIndex];
    if (!currentDayCalendar) {
      throw new Error('Failed to get current day calendar');
    }

    if (CALENDAR_DAY_OFF_IDS.includes(currentDayCalendar.ItemOptionId)) {
      console.log(dakaDay, "It's day off, no daka");
      return false;
    }

    const leaveSheets = currentDayCalendar.LeaveSheets;
    if (leaveSheets?.length) {
      const events = leaveSheets.map((event) => ({
        startDateTime: getCSTDate(
          new Date(event.LeaveStartDatetime)
        ).toISOString(),
        endDateTime: getCSTDate(new Date(event.LeaveEndDatetime)).toISOString(),
      }));

      if (
        checkPersonalEvents({
          events,
          today: dakaDay,
          hour: String(HOUR),
          min: String(minute),
          punchType,
        })
      ) {
        console.log(dakaDay, "It's a personal event, no daka");
        return false;
      }
    }

    console.log(dakaDay, 'daka');
    return true;
  }

  async punch({ punchType }: PunchOptions): Promise<void> {
    console.log(punchType === PUNCH_TYPE.END ? 'bye' : 'gogo');
    console.log("✅ remember to commit your today's work!!!!!");

    // Get location
    const res1 = await fetch(
      'https://apolloxe.mayohr.com/backend/pt/api/locations',
      {
        method: 'GET',
        headers: { cookie: this.cookie },
      }
    );

    const { Data } = (await res1.json()) as LocationResponse;
    if (!Data?.length) {
      throw new Error('No location found');
    }

    const { PunchesLocationId, Latitude, Longitude } = Data[0];

    // Punch
    const res2 = await fetch('https://pt.mayohr.com/api/checkin/punch/locate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: this.cookie,
      },
      body: JSON.stringify({
        AttendanceType:
          punchType === PUNCH_TYPE.START
            ? ATTENDANCE_TYPE.PUNCH_IN
            : ATTENDANCE_TYPE.PUNCH_OUT,
        Latitude,
        Longitude,
        PunchesLocationId,
      }),
    });

    const punchResult = (await res2.json()) as PunchResponse;

    if (punchResult.Meta?.HttpStatusCode !== '200') {
      throw new Error(`Punch failed: ${JSON.stringify(punchResult)}`);
    }

    const punchTime = getCSTDate(new Date(punchResult.Data.punchDate))
      .toTimeString()
      .split(' ')[0];

    console.log(`daka success, time: ${punchTime}`);
  }
}

export default MayoModule;
