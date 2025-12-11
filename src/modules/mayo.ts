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
import type { DakaModule } from './types';

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

  private async getCsrfToken(): Promise<string> {
    const res = await fetch('https://auth.mayohr.com/HRM/Account/Login');
    this.cookie = parseCookies(res.headers.getSetCookie());
    const html = await res.text();
    const $ = cheerio.load(html);
    const csrfToken = $('[name=__RequestVerificationToken]').attr('value');
    if (!csrfToken) throw new Error('Failed to get CSRF token');
    return csrfToken;
  }

  private async authenticate(csrfToken: string, username: string, password: string): Promise<string> {
    const body = new URLSearchParams();
    body.append('__RequestVerificationToken', csrfToken);
    body.append('grant_type', 'password');
    body.append('password', password);
    body.append('userName', username);
    body.append('userStatus', '1');

    const res = await fetch('https://auth.mayohr.com/Token', {
      method: 'POST',
      headers: { cookie: this.cookie },
      body,
    });
    this.cookie += parseCookies(res.headers.getSetCookie());

    const { code } = (await res.json()) as TokenResponse;
    if (!code) throw new Error('Failed to get auth code');
    return code;
  }

  private async getSessionCookie(code: string): Promise<void> {
    const res = await fetch(
      `https://authcommon.mayohr.com/api/auth/checkticket?code=${code}`,
      { headers: { cookie: this.cookie } }
    );
    this.cookie += parseCookies(res.headers.getSetCookie());
  }

  async login({ username, password }: { username: string; password: string }): Promise<void> {
    const csrfToken = await this.getCsrfToken();
    const code = await this.authenticate(csrfToken, username, password);
    await this.getSessionCookie(code);
  }

  async logout(): Promise<void> {
    await fetch('https://auth.mayohr.com/api/accountapi/Logout', {
      method: 'GET',
      headers: { cookie: this.cookie },
    });
  }

  async checkDakaDay({ punchType }: { punchType: PunchType }): Promise<boolean> {
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

  async punch({ punchType }: { punchType: PunchType }): Promise<string> {
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

    return getCSTDate(new Date(punchResult.Data.punchDate))
      .toTimeString()
      .split(' ')[0];
  }
}

export default MayoModule;
