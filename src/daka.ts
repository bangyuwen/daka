import { RETRY_DELAY_MS, type PunchType } from './constants';
import type { DakaModule } from './modules/types';
import { sleep } from './utils/resource';

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

  async punch(): Promise<void> {
    try {
      await this.dakaModule.login({
        username: this.username,
        password: this.password,
      });

      const isDakaDay = await this.dakaModule.checkDakaDay({
        punchType: this.punchType,
      });

      if (isDakaDay) {
        await this.dakaModule.punch({ punchType: this.punchType });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);

      if (this.retryCount < this.maxRetryCount) {
        this.retryCount += 1;
        console.log(
          `Retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${this.retryCount}/${this.maxRetryCount})`
        );
        await sleep(RETRY_DELAY_MS);
        await this.punch();
        return;
      }
    }

    await this.dakaModule.logout();
  }
}

export default Daka;
