import { useState, useEffect } from 'react';
import { Pill, PillLog } from '../types';

const PILLS_STORAGE_KEY = 'pill-reminder-pills';
const LOGS_STORAGE_KEY = 'pill-reminder-logs';

export const usePills = () => {
  const [pills, setPills] = useState<Pill[]>(() => {
    const stored = localStorage.getItem(PILLS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [logs, setLogs] = useState<PillLog[]>(() => {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(PILLS_STORAGE_KEY, JSON.stringify(pills));
  }, [pills]);

  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const addPill = (pill: Omit<Pill, 'id'>) => {
    const newPill: Pill = {
      ...pill,
      id: crypto.randomUUID(),
    };
    setPills(prev => [...prev, newPill]);
    return newPill;
  };

  const updatePill = (id: string, updates: Partial<Pill>) => {
    setPills(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePill = (id: string) => {
    setPills(prev => prev.filter(p => p.id !== id));
    setLogs(prev => prev.filter(l => l.pillId !== id));
  };

  const logPillTaken = (pillId: string, scheduledTime: string) => {
    const log: PillLog = {
      id: crypto.randomUUID(),
      pillId,
      scheduledTime,
      takenTime: new Date().toISOString(),
      status: 'taken',
    };
    setLogs(prev => [...prev, log]);
  };

  const logPillMissed = (pillId: string, scheduledTime: string) => {
    const log: PillLog = {
      id: crypto.randomUUID(),
      pillId,
      scheduledTime,
      status: 'missed',
    };
    setLogs(prev => [...prev, log]);
  };

  const snoozePill = (pillId: string, scheduledTime: string, snoozeMinutes: number) => {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + snoozeMinutes);

    const log: PillLog = {
      id: crypto.randomUUID(),
      pillId,
      scheduledTime,
      status: 'snoozed',
      snoozedUntil: snoozedUntil.toISOString(),
    };
    setLogs(prev => [...prev, log]);
  };

  return {
    pills,
    logs,
    addPill,
    updatePill,
    deletePill,
    logPillTaken,
    logPillMissed,
    snoozePill,
  };
};
