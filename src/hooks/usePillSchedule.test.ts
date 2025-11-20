import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePillSchedule } from './usePillSchedule';
import type { Pill, PillLog } from '../types';

// Mock uuid with incrementing counter for predictable IDs
let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: vi.fn(() => `mock-uuid-${++uuidCounter}`),
}));

describe('usePillSchedule', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    uuidCounter = 0; // Reset counter for each test
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty pills and logs', () => {
      const { result } = renderHook(() => usePillSchedule());

      expect(result.current.pills).toEqual([]);
      expect(result.current.logs).toEqual([]);
      expect(result.current.streakData).toEqual({
        current: 0,
        best: 0,
        lastTaken: undefined,
      });
    });

    it('should load persisted pills from localStorage', () => {
      const mockPills: Pill[] = [
        { id: '1', name: 'Aspirin', dosage: '100mg', times: ['09:00'] },
      ];
      localStorage.setItem('pills', JSON.stringify(mockPills));

      const { result } = renderHook(() => usePillSchedule());
      expect(result.current.pills).toEqual(mockPills);
    });

    it('should load persisted logs from localStorage', () => {
      const mockLogs: PillLog[] = [
        {
          id: '1',
          pillId: '1',
          scheduledTime: '2025-01-20T09:00:00',
          status: 'pending',
        },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      expect(result.current.logs).toEqual(mockLogs);
    });
  });

  describe('addPill', () => {
    it('should add a new pill', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({
          name: 'Aspirin',
          dosage: '100mg',
          times: ['09:00', '21:00'],
        });
      });

      expect(result.current.pills).toHaveLength(1);
      expect(result.current.pills[0]).toMatchObject({
        name: 'Aspirin',
        dosage: '100mg',
        times: ['09:00', '21:00'],
      });
      expect(result.current.pills[0].id).toBeDefined();
    });

    it('should add pill with optional fields', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({
          name: 'Vitamin D',
          dosage: '1000 IU',
          times: ['09:00'],
          color: '#FF5733',
          notes: 'Take with food',
        });
      });

      expect(result.current.pills[0]).toMatchObject({
        name: 'Vitamin D',
        color: '#FF5733',
        notes: 'Take with food',
      });
    });

    it('should persist to localStorage', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({
          name: 'Aspirin',
          dosage: '100mg',
          times: ['09:00'],
        });
      });

      const stored = JSON.parse(localStorage.getItem('pills') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Aspirin');
    });
  });

  describe('updatePill', () => {
    it('should update pill properties', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({
          name: 'Aspirin',
          dosage: '100mg',
          times: ['09:00'],
        });
      });

      const pillId = result.current.pills[0].id;

      act(() => {
        result.current.updatePill(pillId, {
          dosage: '200mg',
          times: ['09:00', '21:00'],
        });
      });

      expect(result.current.pills[0]).toMatchObject({
        name: 'Aspirin',
        dosage: '200mg',
        times: ['09:00', '21:00'],
      });
    });

    it('should not affect other pills', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({ name: 'Aspirin', dosage: '100mg', times: ['09:00'] });
      });

      act(() => {
        result.current.addPill({ name: 'Vitamin D', dosage: '1000 IU', times: ['09:00'] });
      });

      const aspirinId = result.current.pills[0].id;

      act(() => {
        result.current.updatePill(aspirinId, { dosage: '200mg' });
      });

      const aspirin = result.current.pills.find(p => p.id === aspirinId);
      const vitaminD = result.current.pills.find(p => p.name === 'Vitamin D');

      expect(aspirin?.dosage).toBe('200mg');
      expect(vitaminD?.dosage).toBe('1000 IU');
    });

    it('should handle non-existent pill ID gracefully', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({ name: 'Aspirin', dosage: '100mg', times: ['09:00'] });
      });

      act(() => {
        result.current.updatePill('non-existent-id', { dosage: '200mg' });
      });

      expect(result.current.pills[0].dosage).toBe('100mg');
    });
  });

  describe('deletePill', () => {
    it('should delete pill', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({ name: 'Aspirin', dosage: '100mg', times: ['09:00'] });
      });

      const pillId = result.current.pills[0].id;

      act(() => {
        result.current.deletePill(pillId);
      });

      expect(result.current.pills).toHaveLength(0);
    });

    it('should delete associated logs', () => {
      const { result } = renderHook(() => usePillSchedule());

      vi.setSystemTime(new Date('2025-01-20T08:00:00'));

      act(() => {
        result.current.addPill({ name: 'Aspirin', dosage: '100mg', times: ['09:00'] });
      });

      const pillId = result.current.pills[0].id;

      // Wait for log generation
      vi.advanceTimersByTime(100);

      act(() => {
        result.current.deletePill(pillId);
      });

      const remainingLogs = result.current.logs.filter(log => log.pillId === pillId);
      expect(remainingLogs).toHaveLength(0);
    });

    it('should not affect other pills', () => {
      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.addPill({ name: 'Aspirin', dosage: '100mg', times: ['09:00'] });
      });

      act(() => {
        result.current.addPill({ name: 'Vitamin D', dosage: '1000 IU', times: ['09:00'] });
      });

      const aspirinId = result.current.pills.find(p => p.name === 'Aspirin')?.id;

      act(() => {
        if (aspirinId) {
          result.current.deletePill(aspirinId);
        }
      });

      expect(result.current.pills).toHaveLength(1);
      expect(result.current.pills[0].name).toBe('Vitamin D');
    });
  });

  describe('markPillTaken', () => {
    it('should mark log as taken', () => {
      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.markPillTaken('log-1');
      });

      expect(result.current.logs[0].status).toBe('taken');
      expect(result.current.logs[0].takenTime).toBeDefined();
    });

    it('should set takenTime to current time', () => {
      vi.setSystemTime(new Date('2025-01-20T09:15:00'));

      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.markPillTaken('log-1');
      });

      expect(result.current.logs[0].takenTime).toContain('2025-01-20 09:15');
    });

    it('should not affect other logs', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'pending' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-20T21:00:00', status: 'pending' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.markPillTaken('log-1');
      });

      expect(result.current.logs[0].status).toBe('taken');
      expect(result.current.logs[1].status).toBe('pending');
    });
  });

  describe('snoozePill', () => {
    it('should snooze log', () => {
      vi.setSystemTime(new Date('2025-01-20T09:00:00'));

      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.snoozePill('log-1', 15);
      });

      expect(result.current.logs[0].status).toBe('snoozed');
      expect(result.current.logs[0].snoozedUntil).toBeDefined();
    });

    it('should calculate snoozedUntil correctly', () => {
      vi.setSystemTime(new Date('2025-01-20T09:00:00'));

      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.snoozePill('log-1', 30);
      });

      expect(result.current.logs[0].snoozedUntil).toContain('09:30');
    });

    it('should handle different snooze durations', () => {
      vi.setSystemTime(new Date('2025-01-20T09:00:00'));

      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'pending' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-20T10:00:00', status: 'pending' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.snoozePill('log-1', 15);
      });

      act(() => {
        result.current.snoozePill('log-2', 30);
      });

      const log1 = result.current.logs.find(l => l.id === 'log-1');
      const log2 = result.current.logs.find(l => l.id === 'log-2');

      expect(log1?.snoozedUntil).toBeDefined();
      expect(log1?.snoozedUntil).toContain('09:15');
      expect(log2?.snoozedUntil).toBeDefined();
      expect(log2?.snoozedUntil).toContain('10:30');
    });
  });

  describe('markPillMissed', () => {
    it('should mark log as missed', () => {
      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.markPillMissed('log-1');
      });

      expect(result.current.logs[0].status).toBe('missed');
    });

    it('should not set takenTime', () => {
      const mockLog: PillLog = {
        id: 'log-1',
        pillId: 'pill-1',
        scheduledTime: '2025-01-20T09:00:00',
        status: 'pending',
      };
      localStorage.setItem('pill-logs', JSON.stringify([mockLog]));

      const { result } = renderHook(() => usePillSchedule());

      act(() => {
        result.current.markPillMissed('log-1');
      });

      expect(result.current.logs[0].takenTime).toBeUndefined();
    });
  });

  describe('getPendingLogs', () => {
    it('should return pending logs', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'pending' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-20T21:00:00', status: 'taken', takenTime: '2025-01-20T21:00:00' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      const pending = result.current.getPendingLogs();

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('log-1');
    });

    it('should return snoozed logs', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'snoozed', snoozedUntil: '2025-01-20T09:15:00' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-20T21:00:00', status: 'missed' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      const pending = result.current.getPendingLogs();

      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('snoozed');
    });

    it('should return empty array when no pending logs', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'taken', takenTime: '2025-01-20T09:00:00' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-20T21:00:00', status: 'missed' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      const pending = result.current.getPendingLogs();

      expect(pending).toHaveLength(0);
    });
  });

  describe('getTodayLogs', () => {
    it('should return today logs only', () => {
      vi.setSystemTime(new Date('2025-01-20T12:00:00'));

      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'pending' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-19T09:00:00', status: 'taken', takenTime: '2025-01-19T09:00:00' },
        { id: 'log-3', pillId: 'pill-1', scheduledTime: '2025-01-20T21:00:00', status: 'pending' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      const today = result.current.getTodayLogs();

      expect(today).toHaveLength(2);
      expect(today.map(log => log.id)).toEqual(['log-1', 'log-3']);
    });

    it('should return empty array when no logs today', () => {
      vi.setSystemTime(new Date('2025-01-20T12:00:00'));

      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-19T09:00:00', status: 'taken', takenTime: '2025-01-19T09:00:00' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());
      const today = result.current.getTodayLogs();

      expect(today).toHaveLength(0);
    });
  });

  describe('streakData', () => {
    it('should calculate current streak', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'taken', takenTime: '2025-01-20T09:00:00' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-19T09:00:00', status: 'taken', takenTime: '2025-01-19T09:00:00' },
        { id: 'log-3', pillId: 'pill-1', scheduledTime: '2025-01-18T09:00:00', status: 'taken', takenTime: '2025-01-18T09:00:00' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());

      expect(result.current.streakData.current).toBe(3);
    });

    it('should calculate best streak', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'taken', takenTime: '2025-01-20T09:00:00' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-19T09:00:00', status: 'taken', takenTime: '2025-01-19T09:00:00' },
        // Gap
        { id: 'log-3', pillId: 'pill-1', scheduledTime: '2025-01-17T09:00:00', status: 'taken', takenTime: '2025-01-17T09:00:00' },
        { id: 'log-4', pillId: 'pill-1', scheduledTime: '2025-01-16T09:00:00', status: 'taken', takenTime: '2025-01-16T09:00:00' },
        { id: 'log-5', pillId: 'pill-1', scheduledTime: '2025-01-15T09:00:00', status: 'taken', takenTime: '2025-01-15T09:00:00' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());

      expect(result.current.streakData.best).toBeGreaterThanOrEqual(2);
    });

    it('should set lastTaken to most recent log', () => {
      const mockLogs: PillLog[] = [
        { id: 'log-1', pillId: 'pill-1', scheduledTime: '2025-01-20T09:00:00', status: 'taken', takenTime: '2025-01-20T09:00:00' },
        { id: 'log-2', pillId: 'pill-1', scheduledTime: '2025-01-19T09:00:00', status: 'taken', takenTime: '2025-01-19T09:00:00' },
      ];
      localStorage.setItem('pill-logs', JSON.stringify(mockLogs));

      const { result } = renderHook(() => usePillSchedule());

      expect(result.current.streakData.lastTaken).toBe('2025-01-20T09:00:00');
    });

    it('should return zero streaks when no taken logs', () => {
      const { result } = renderHook(() => usePillSchedule());

      expect(result.current.streakData).toEqual({
        current: 0,
        best: 0,
        lastTaken: undefined,
      });
    });
  });

  describe('daily log generation', () => {
    it('should generate logs for new day', async () => {
      vi.setSystemTime(new Date('2025-01-20T08:00:00'));

      const { result } = renderHook(() => usePillSchedule());

      // Add a pill and wait for effects to run
      await act(async () => {
        result.current.addPill({
          name: 'Aspirin',
          dosage: '100mg',
          times: ['09:00', '21:00'],
        });
        // Give time for useEffect to run
        await vi.runAllTimersAsync();
      });

      // Logs should be generated for today
      const todayLogs = result.current.logs.filter(log => {
        const logDate = new Date(log.scheduledTime).toDateString();
        return logDate === new Date('2025-01-20').toDateString();
      });

      // Should have 2 logs (one for each time)
      expect(todayLogs.length).toBe(2);
    });
  });
});
