export const PUNCH_TYPE = {
  START: 'S',
  END: 'E',
} as const;

export type PunchType = (typeof PUNCH_TYPE)[keyof typeof PUNCH_TYPE];

export const WORK_HOURS = {
  START: 10,
  END: 19,
} as const;

export const CST_OFFSET_MINUTES = -480;
export const RETRY_DELAY_MS = 3000;
export const PUNCH_WINDOW_MINUTES = 60;
export const WORK_DAY_HOURS = 9;

export const ALLOWED_MODULES = ['mayo'] as const;
export type ModuleName = (typeof ALLOWED_MODULES)[number];
