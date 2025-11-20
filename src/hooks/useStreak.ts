import { useMemo } from 'react';
import { PillLog, StreakData } from '../types';

export const useStreak = (logs: PillLog[]): StreakData => {
  return useMemo(() => {
    if (logs.length === 0) {
      return { current: 0, best: 0 };
    }

    // Sort logs by scheduled time
    const sortedLogs = [...logs].sort((a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const log of sortedLogs) {
      if (log.status === 'taken') {
        const logDate = new Date(log.scheduledTime);
        logDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          tempStreak = 1;
        } else {
          const daysDiff = Math.floor((logDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 0) {
            // Same day, don't increment
          } else if (daysDiff === 1) {
            tempStreak++;
          } else {
            // Streak broken
            tempStreak = 1;
          }
        }

        lastDate = logDate;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else if (log.status === 'missed') {
        tempStreak = 0;
      }
    }

    // Current streak is the temp streak if it's ongoing
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (lastDate) {
      const daysSinceLastTaken = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      currentStreak = daysSinceLastTaken <= 1 ? tempStreak : 0;
    }

    const lastTaken = logs
      .filter(l => l.status === 'taken' && l.takenTime)
      .sort((a, b) => new Date(b.takenTime!).getTime() - new Date(a.takenTime!).getTime())[0]
      ?.takenTime;

    return {
      current: currentStreak,
      best: bestStreak,
      lastTaken,
    };
  }, [logs]);
};
