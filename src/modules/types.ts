import type { PunchType } from '../constants';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface PunchOptions {
  punchType: PunchType;
}

export interface DakaModule {
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  checkDakaDay(options: PunchOptions): Promise<boolean>;
  punch(options: PunchOptions): Promise<void>;
}
