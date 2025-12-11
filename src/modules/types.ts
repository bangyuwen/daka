import type { PunchType } from '../constants';

export interface DakaModule {
  login(credentials: { username: string; password: string }): Promise<void>;
  logout(): Promise<void>;
  checkDakaDay(options: { punchType: PunchType }): Promise<boolean>;
  punch(options: { punchType: PunchType }): Promise<string>; // returns punch time
}
