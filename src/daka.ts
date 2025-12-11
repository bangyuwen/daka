import { RETRY_DELAY_MS, PUNCH_TYPE, type PunchType } from './constants';
import type { DakaModule } from './modules/types';
import { sleep } from './utils/resource';

export type DakaStatus = 'success' | 'skipped' | 'failed';

export interface DakaResult {
  status: DakaStatus;
  punchType: PunchType;
  time?: string;
  reason?: string;
}

interface DakaOptions {
  dakaModule: DakaModule;
  username: string;
  password: string;
  maxRetryCount: number;
  punchType: PunchType;
}

class Daka {
  private dakaModule: DakaModule;
  private username: string;
  private password: string;
  private retryCount = 0;
  private maxRetryCount: number;
  private punchType: PunchType;

  constructor(options: DakaOptions) {
    this.dakaModule = options.dakaModule;
    this.username = options.username;
    this.password = options.password;
    this.maxRetryCount = options.maxRetryCount;
    this.punchType = options.punchType;
  }

  async punch(): Promise<DakaResult> {
    try {
      await this.dakaModule.login({
        username: this.username,
        password: this.password,
      });

      const isDakaDay = await this.dakaModule.checkDakaDay({
        punchType: this.punchType,
      });

      if (!isDakaDay) {
        await this.dakaModule.logout();
        return { status: 'skipped', punchType: this.punchType, reason: 'day off or leave' };
      }

      const time = await this.dakaModule.punch({ punchType: this.punchType });
      await this.dakaModule.logout();
      return { status: 'success', punchType: this.punchType, time };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);

      if (this.retryCount < this.maxRetryCount) {
        this.retryCount += 1;
        console.log(
          `Retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${this.retryCount}/${this.maxRetryCount})`
        );
        await sleep(RETRY_DELAY_MS);
        return this.punch();
      }

      await this.dakaModule.logout().catch(() => {});
      return { status: 'failed', punchType: this.punchType, reason: message };
    }
  }
}

export function formatResult(result: DakaResult): string {
  const type = result.punchType === PUNCH_TYPE.START ? 'gogo' : 'bye';

  if (result.status === 'success') {
    return `${type}\ndaka success, time: ${result.time}`;
  }
  if (result.status === 'skipped') {
    return `${type}\nno daka - ${result.reason}`;
  }
  return `${type}\ndaka failed - ${result.reason}`;
}

export default Daka;
