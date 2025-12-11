import { checkPersonalEvents, type CalendarEvent } from '../utils/resource';
import { PUNCH_TYPE } from '../constants';

const testEvents: CalendarEvent[] = [
  {
    startDateTime: '2022-09-27T10:00:00+00:00',
    endDateTime: '2022-09-30T19:00:00+00:00',
  },
  {
    startDateTime: '2022-10-04T10:00:00+00:00',
    endDateTime: '2022-10-04T19:00:00+00:00',
  },
  {
    startDateTime: '2022-10-05T13:00:00+00:00',
    endDateTime: '2022-10-05T17:00:00+00:00',
  },
  {
    startDateTime: '2022-10-17T14:00:00+00:00',
    endDateTime: '2022-10-17T19:00:00+00:00',
  },
  {
    startDateTime: '2022-10-21T10:00:00+00:00',
    endDateTime: '2022-10-21T15:00:00+00:00',
  },
];

describe('checkPersonalEvents', () => {
  it('returns false when no events', () => {
    expect(checkPersonalEvents()).toBe(false);
    expect(
      checkPersonalEvents({
        events: [],
        today: '2022-09-30',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
    expect(
      checkPersonalEvents({
        events: [],
        today: '2022-09-30',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(false);
  });

  it('handles partial event (13:00-17:00) - no overlap with punch times', () => {
    const events = [testEvents[2]];

    // Different day - should not match
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-03',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);

    // Same day but outside event hours
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-05',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-05',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(false);
  });

  it('handles afternoon event (14:00-19:00) - blocks end punch', () => {
    const events = [testEvents[3]];

    // Different day
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-05',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);

    // Same day - start punch not affected
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-17',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);

    // Same day - end punch within window of event end
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-17',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-17',
        hour: '18',
        min: '57',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);
  });

  it('handles morning event (10:00-15:00) - blocks start punch', () => {
    const events = [testEvents[4]];

    // Different day
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-05',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);

    // Same day - start punch within window
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-21',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-21',
        hour: '10',
        min: '7',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);

    // Same day - end punch not affected
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-21',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(false);
  });

  it('handles all-day event - blocks both punches', () => {
    const events = [testEvents[1]];

    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-04',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-04',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);

    // Different day - not affected
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-03',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
  });

  it('handles multi-day event - blocks both punches on covered days', () => {
    const events = [testEvents[0]];

    expect(
      checkPersonalEvents({
        events,
        today: '2022-09-30',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-09-30',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);

    // Day after event ends
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-03',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
  });

  it('handles multiple events correctly', () => {
    const events = testEvents;

    // Regular working day
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-03',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-03',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(false);

    // Day with afternoon event
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-17',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(false);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-17',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);

    // Day with morning event
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-21',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-21',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(false);

    // All-day event
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-04',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-10-04',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);

    // Multi-day event
    expect(
      checkPersonalEvents({
        events,
        today: '2022-09-30',
        hour: '9',
        min: '57',
        punchType: PUNCH_TYPE.START,
      })
    ).toBe(true);
    expect(
      checkPersonalEvents({
        events,
        today: '2022-09-30',
        hour: '19',
        min: '13',
        punchType: PUNCH_TYPE.END,
      })
    ).toBe(true);
  });
});
