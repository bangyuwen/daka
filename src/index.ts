import 'dotenv/config';

import { PUNCH_TYPE, type PunchType } from './constants';
import { USERNAME, PASSWORD, MAX_DELAY_MINS, MAX_RETRY_COUNT } from './env';
import { delay, HOUR } from './utils/resource';
import Daka, { formatResult } from './daka';
import MayoModule from './modules/mayo';

async function main(): Promise<void> {
  console.log('===== start =====');

  const arg = process.argv[2];
  const punchType: PunchType = arg === 'S' || arg === 'E' ? arg : PUNCH_TYPE.START;

  if (MAX_DELAY_MINS > 0) {
    await delay(MAX_DELAY_MINS);
  }

  const daka = new Daka({
    dakaModule: new MayoModule(),
    username: USERNAME!,
    password: PASSWORD!,
    maxRetryCount: MAX_RETRY_COUNT,
    punchType,
  });

  const result = await daka.punch();
  console.log(formatResult(result));

  console.log('===== end =====');
  process.exit(result.status === 'failed' ? 1 : 0);
}

if (!USERNAME || !PASSWORD) {
  console.error('Missing required env: USERNAME, PASSWORD');
  process.exit(1);
}

main();
