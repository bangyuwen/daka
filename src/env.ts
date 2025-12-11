function parseNumber(value: string | undefined, defaultValue: number): number {
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

export const MODULE = process.env.MODULE;
export const USERNAME = process.env.USERNAME;
export const PASSWORD = process.env.PASSWORD;
export const MODULE_OPTIONS = process.env.MODULE_OPTIONS;

export const IMMEDIATE_DAKA = process.env.IMMEDIATE_DAKA
  ? process.env.IMMEDIATE_DAKA !== '0'
  : false;

export const DELAY_START_MINS = parseNumber(process.env.DELAY_START_MINS, 5);
export const DELAY_END_MINS = parseNumber(process.env.DELAY_END_MINS, 15);
export const MAX_RETRY_COUNT = parseNumber(process.env.MAX_RETRY_COUNT, 3);
