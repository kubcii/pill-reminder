import { useCallback, useMemo, useEffect } from 'react';
import type { Pill, PillLog, StreakData } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { calculateStreak, parseTimeString, formatDateTime } from '../utils/time';
import { v4 as uuidv4 } from 'uuid';

interface UsePillScheduleReturn {
  pills: Pill[];
  logs: PillLog[];
  streakData: StreakData;
  addPill: (pill: Omit<Pill, 'id'>) => void;
  updatePill: (id: string, updates: Partial<Pill>) => void;
  deletePill: (id: string) => void;
  markPillTaken: (logId: string) => void;
  snoozePill: (logId: string, snoozeMinutes: number) => void;
  markPillMissed: (logId: string) => void;
  getPendingLogs: () => PillLog[];
  getTodayLogs: () => PillLog[];
}

/**
 * Manages pill schedules, logs, and persistence
 * Because keeping track of when to take pills is apparently too hard
 */
export function usePillSchedule(): UsePillScheduleReturn {
  const [pills, setPills] = useLocalStorage<Pill[]>('pills', []);
  const [logs, setLogs] = useLocalStorage<PillLog[]>('pill-logs', []);
  const [lastScheduleDate, setLastScheduleDate] = useLocalStorage<string>('last-schedule-date', '');

  // Generate daily logs for all pills
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastScheduleDate !== today) {
      const newLogs: PillLog[] = [];

      pills.forEach(pill => {
        pill.times.forEach(timeStr => {
          const scheduledTime = parseTimeString(timeStr);
          newLogs.push({
            id: uuidv4(),
            pillId: pill.id,
            scheduledTime: formatDateTime(scheduledTime),
            status: 'pending',
          });
        });
      });

      setLogs(prev => [...prev, ...newLogs]);
      setLastScheduleDate(today);
    }
  }, [pills, lastScheduleDate, setLogs, setLastScheduleDate]);

  const addPill = useCallback((pill: Omit<Pill, 'id'>) => {
    const newPill: Pill = {
      ...pill,
      id: uuidv4(),
    };
    setPills(prev => [...prev, newPill]);
  }, [setPills]);

  const updatePill = useCallback((id: string, updates: Partial<Pill>) => {
    setPills(prev =>
      prev.map(pill => pill.id === id ? { ...pill, ...updates } : pill)
    );
  }, [setPills]);

  const deletePill = useCallback((id: string) => {
    setPills(prev => prev.filter(pill => pill.id !== id));
    setLogs(prev => prev.filter(log => log.pillId !== id));
  }, [setPills, setLogs]);

  const markPillTaken = useCallback((logId: string) => {
    setLogs(prev =>
      prev.map(log =>
        log.id === logId
          ? { ...log, status: 'taken' as const, takenTime: formatDateTime(new Date()) }
          : log
      )
    );
  }, [setLogs]);

  const snoozePill = useCallback((logId: string, snoozeMinutes: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeMinutes);

    setLogs(prev =>
      prev.map(log =>
        log.id === logId
          ? {
              ...log,
              status: 'snoozed' as const,
              snoozedUntil: formatDateTime(snoozeUntil)
            }
          : log
      )
    );
  }, [setLogs]);

  const markPillMissed = useCallback((logId: string) => {
    setLogs(prev =>
      prev.map(log =>
        log.id === logId ? { ...log, status: 'missed' as const } : log
      )
    );
  }, [setLogs]);

  const getPendingLogs = useCallback(() => {
    return logs.filter(log => log.status === 'pending' || log.status === 'snoozed');
  }, [logs]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toDateString();
    return logs.filter(log => {
      const logDate = new Date(log.scheduledTime).toDateString();
      return logDate === today;
    });
  }, [logs]);

  const streakData = useMemo<StreakData>(() => {
    const currentStreak = calculateStreak(logs);
    const allStreaks = logs
      .filter(log => log.status === 'taken')
      .map((_, idx, arr) => calculateStreak(arr.slice(0, idx + 1)));

    const bestStreak = Math.max(currentStreak, ...allStreaks, 0);
    const lastTakenLog = logs
      .filter(log => log.status === 'taken' && log.takenTime)
      .sort((a, b) => new Date(b.takenTime!).getTime() - new Date(a.takenTime!).getTime())[0];

    return {
      current: currentStreak,
      best: bestStreak,
      lastTaken: lastTakenLog?.takenTime,
    };
  }, [logs]);

  return {
    pills,
    logs,
    streakData,
    addPill,
    updatePill,
    deletePill,
    markPillTaken,
    snoozePill,
    markPillMissed,
    getPendingLogs,
    getTodayLogs,
  };
}
