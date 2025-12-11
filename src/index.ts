import 'dotenv/config';

import { PUNCH_TYPE, ALLOWED_MODULES, type PunchType } from './constants';
import {
  MODULE,
  USERNAME,
  PASSWORD,
  IMMEDIATE_DAKA,
  MAX_RETRY_COUNT,
  DELAY_START_MINS,
  DELAY_END_MINS,
} from './env';
import { delay, HOUR } from './utils/resource';
import Daka from './daka';
import type { DakaModule } from './modules/types';

// Module factory - avoids dynamic require
function createModule(moduleName: string): DakaModule {
  if (!ALLOWED_MODULES.includes(moduleName as (typeof ALLOWED_MODULES)[number])) {
    throw new Error(
      `Invalid module: ${moduleName}. Allowed: ${ALLOWED_MODULES.join(', ')}`
    );
  }

  // Static imports for type safety
  switch (moduleName) {
    case 'mayo': {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MayoModule = require('./modules/mayo').default;
      return new MayoModule();
    }
    default:
      throw new Error(`Module not implemented: ${moduleName}`);
  }
}

function determinePunchType(): PunchType {
  const arg = process.argv[2];
  if (arg === PUNCH_TYPE.START || arg === PUNCH_TYPE.END) {
    return arg;
  }
  return HOUR >= 12 ? PUNCH_TYPE.END : PUNCH_TYPE.START;
}

async function main(): Promise<void> {
  console.log('===== start =====');

  const punchType = determinePunchType();

  if (!IMMEDIATE_DAKA) {
    await delay({
      punchType,
      delayStartMins: DELAY_START_MINS,
      delayEndMins: DELAY_END_MINS,
    });
  }

  const dakaModule = createModule(MODULE!);
  const daka = new Daka({
    dakaModule,
    username: USERNAME!,
    password: PASSWORD!,
    maxRetryCount: MAX_RETRY_COUNT,
    punchType,
  });

  await daka.punch();

  console.log('===== end =====');
}

// Validate required environment variables
if (!MODULE || !USERNAME || !PASSWORD) {
  console.error(
    'Missing required environment variables: MODULE, USERNAME, PASSWORD'
  );
  process.exit(1);
}

main();
