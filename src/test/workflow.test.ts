import * as fs from 'node:fs';
import * as path from 'node:path';

function readWorkflow(): string {
  return fs.readFileSync(
    path.join(process.cwd(), '.github/workflows/daka.yaml'),
    'utf8'
  );
}

function getScheduleCrons(workflow: string): string[] {
  return [...workflow.matchAll(/^\s+- cron: '([^']+)'/gm)].map(
    (match) => match[1]
  );
}

function getStepSchedule(workflow: string, stepName: string): string {
  const pattern = new RegExp(
    `- name: ${stepName}\\s+if: github\\.event\\.schedule == '([^']+)'`,
    'm'
  );
  const match = workflow.match(pattern);

  if (!match) {
    throw new Error(`Missing schedule condition for ${stepName}`);
  }

  return match[1];
}

describe('Daka workflow schedule', () => {
  it('keeps schedule triggers and step conditions in sync', () => {
    const workflow = readWorkflow();
    const [checkInCron, checkOutCron] = getScheduleCrons(workflow);

    expect(getScheduleCrons(workflow)).toHaveLength(2);
    expect(getStepSchedule(workflow, 'Check in')).toBe(checkInCron);
    expect(getStepSchedule(workflow, 'Check out')).toBe(checkOutCron);
  });
});
