/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatTime,
  formatDateTime,
  parseTimeString,
  addSnoozeTime,
  isTimePast,
  isTimeUpcoming,
  calculateStreak,
  getTimeUntilNext,
} from './time';

describe('Time Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2025-01-20T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });

    it('should pad single digits', () => {
      const date = new Date('2025-01-20T09:05:00');
      expect(formatTime(date)).toBe('09:05');
    });

    it('should handle midnight', () => {
      const date = new Date('2025-01-20T00:00:00');
      expect(formatTime(date)).toBe('00:00');
    });

    it('should handle noon', () => {
      const date = new Date('2025-01-20T12:00:00');
      expect(formatTime(date)).toBe('12:00');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime with seconds', () => {
      const date = new Date('2025-01-20T14:30:45');
      expect(formatDateTime(date)).toBe('2025-01-20 14:30:45');
    });

    it('should handle edge of year', () => {
      const date = new Date('2024-12-31T23:59:59');
      expect(formatDateTime(date)).toBe('2024-12-31 23:59:59');
    });
  });

  describe('parseTimeString', () => {
    it('should parse valid time string', () => {
      vi.setSystemTime(new Date('2025-01-20T00:00:00'));
      const result = parseTimeString('14:30');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle midnight', () => {
      const result = parseTimeString('00:00');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should handle single digit hours', () => {
      const result = parseTimeString('9:15');
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(15);
    });

    it('should use current date', () => {
      const now = new Date('2025-01-20T00:00:00');
      vi.setSystemTime(now);
      const result = parseTimeString('14:30');
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getFullYear()).toBe(now.getFullYear());
    });
  });

  describe('addSnoozeTime', () => {
    it('should add minutes correctly', () => {
      const date = new Date('2025-01-20T14:30:00');
      const result = addSnoozeTime(date, 15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(45);
    });

    it('should handle hour overflow', () => {
      const date = new Date('2025-01-20T14:50:00');
      const result = addSnoozeTime(date, 20);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(10);
    });

    it('should handle day overflow', () => {
      const date = new Date('2025-01-20T23:50:00');
      const result = addSnoozeTime(date, 20);
      expect(result.getDate()).toBe(21);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(10);
    });

    it('should handle negative minutes', () => {
      const date = new Date('2025-01-20T14:30:00');
      const result = addSnoozeTime(date, -15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(15);
    });
  });

  describe('isTimePast', () => {
    it('should return true for past time', () => {
      vi.setSystemTime(new Date('2025-01-20T14:30:00'));
      const pastTime = '2025-01-20T14:00:00';
      expect(isTimePast(pastTime)).toBe(true);
    });

    it('should return false for future time', () => {
      vi.setSystemTime(new Date('2025-01-20T14:30:00'));
      const futureTime = '2025-01-20T15:00:00';
      expect(isTimePast(futureTime)).toBe(false);
    });

    it('should return false for current time', () => {
      const now = new Date('2025-01-20T14:30:00');
      vi.setSystemTime(now);
      expect(isTimePast(now.toISOString())).toBe(false);
    });
  });

  describe('isTimeUpcoming', () => {
    it('should return true for time within default 30min window', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      const upcomingTime = '2025-01-20T14:15:00';
      expect(isTimeUpcoming(upcomingTime)).toBe(true);
    });

    it('should return false for time beyond 30min window', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      const farTime = '2025-01-20T14:45:00';
      expect(isTimeUpcoming(farTime)).toBe(false);
    });

    it('should return false for past time', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      const pastTime = '2025-01-20T13:30:00';
      expect(isTimeUpcoming(pastTime)).toBe(false);
    });

    it('should respect custom time window', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      const upcomingTime = '2025-01-20T14:50:00';
      expect(isTimeUpcoming(upcomingTime, 60)).toBe(true);
      expect(isTimeUpcoming(upcomingTime, 30)).toBe(false);
    });

    it('should handle edge of window', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      const edgeTime = '2025-01-20T14:30:00';
      expect(isTimeUpcoming(edgeTime, 30)).toBe(false); // Exactly at boundary
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for empty logs', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('should return 0 when no taken logs', () => {
      const logs = [
        { status: 'missed', takenTime: undefined },
        { status: 'pending', takenTime: undefined },
      ];
      expect(calculateStreak(logs)).toBe(0);
    });

    it('should return 1 for single taken log', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(1);
    });

    it('should calculate consecutive days correctly', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'taken', takenTime: '2025-01-19T14:00:00' },
        { status: 'taken', takenTime: '2025-01-18T14:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(3);
    });

    it('should stop at first gap', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'taken', takenTime: '2025-01-19T14:00:00' },
        // Gap here
        { status: 'taken', takenTime: '2025-01-17T14:00:00' },
        { status: 'taken', takenTime: '2025-01-16T14:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(2);
    });

    it('should handle multiple logs on same day', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'taken', takenTime: '2025-01-20T09:00:00' },
        { status: 'taken', takenTime: '2025-01-19T21:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(2);
    });

    it('should ignore missed and pending logs', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'missed', takenTime: '2025-01-19T14:00:00' },
        { status: 'taken', takenTime: '2025-01-19T09:00:00' },
        { status: 'pending', takenTime: undefined },
        { status: 'taken', takenTime: '2025-01-18T14:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(3);
    });

    it('should handle unsorted logs', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-18T14:00:00' },
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'taken', takenTime: '2025-01-19T14:00:00' },
      ];
      expect(calculateStreak(logs)).toBe(3);
    });

    it('should handle logs without takenTime', () => {
      const logs = [
        { status: 'taken', takenTime: '2025-01-20T14:00:00' },
        { status: 'taken', takenTime: undefined },
      ];
      expect(calculateStreak(logs)).toBe(1);
    });
  });

  describe('getTimeUntilNext', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
    });

    it('should return "Now" for past time', () => {
      const pastTime = '2025-01-20T13:00:00';
      expect(getTimeUntilNext(pastTime)).toBe('Now');
    });

    it('should return "Now" for current time', () => {
      const now = new Date('2025-01-20T14:00:00').toISOString();
      expect(getTimeUntilNext(now)).toBe('Now');
    });

    it('should return minutes only for under 1 hour', () => {
      const time = '2025-01-20T14:30:00';
      expect(getTimeUntilNext(time)).toBe('30m');
    });

    it('should return hours and minutes', () => {
      const time = '2025-01-20T16:15:00';
      expect(getTimeUntilNext(time)).toBe('2h 15m');
    });

    it('should handle exactly 1 hour', () => {
      const time = '2025-01-20T15:00:00';
      expect(getTimeUntilNext(time)).toBe('1h 0m');
    });

    it('should handle next day', () => {
      const time = '2025-01-21T02:30:00';
      expect(getTimeUntilNext(time)).toBe('12h 30m');
    });

    it('should round down minutes', () => {
      const time = '2025-01-20T14:05:45'; // 5 minutes 45 seconds
      expect(getTimeUntilNext(time)).toBe('5m');
    });

    it('should handle 0 minutes remaining', () => {
      const time = '2025-01-20T14:00:30'; // 30 seconds
      expect(getTimeUntilNext(time)).toBe('0m');
    });
  });
});
