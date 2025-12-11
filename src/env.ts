function parseNumber(value: string | undefined, defaultValue: number): number {
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

export const USERNAME = process.env.USERNAME;
export const PASSWORD = process.env.PASSWORD;
export const MAX_DELAY_MINS = parseNumber(process.env.MAX_DELAY_MINS, 30);
export const MAX_RETRY_COUNT = parseNumber(process.env.MAX_RETRY_COUNT, 3);
