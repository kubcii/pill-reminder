import { format, addMinutes, isAfter, isBefore, parseISO, startOfDay, differenceInDays } from 'date-fns';

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const parseTimeString = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
};

export const addSnoozeTime = (date: Date, minutes: number): Date => {
  return addMinutes(date, minutes);
};

export const isTimePast = (scheduledTime: string): boolean => {
  const scheduled = parseISO(scheduledTime);
  return isBefore(scheduled, new Date());
};

export const isTimeUpcoming = (scheduledTime: string, minutesWindow: number = 30): boolean => {
  const scheduled = parseISO(scheduledTime);
  const now = new Date();
  const windowEnd = addMinutes(now, minutesWindow);
  return isAfter(scheduled, now) && isBefore(scheduled, windowEnd);
};

export const calculateStreak = (logs: Array<{ takenTime?: string; status: string }>): number => {
  if (logs.length === 0) return 0;
  
  const sortedLogs = [...logs]
    .filter(log => log.status === 'taken' && log.takenTime)
    .sort((a, b) => new Date(b.takenTime!).getTime() - new Date(a.takenTime!).getTime());
  
  if (sortedLogs.length === 0) return 0;
  
  let streak = 1;
  let currentDay = startOfDay(new Date(sortedLogs[0].takenTime!));
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const logDay = startOfDay(new Date(sortedLogs[i].takenTime!));
    const dayDiff = differenceInDays(currentDay, logDay);
    
    if (dayDiff === 1) {
      streak++;
      currentDay = logDay;
    } else if (dayDiff > 1) {
      break;
    }
  }
  
  return streak;
};

export const getTimeUntilNext = (scheduledTime: string): string => {
  const scheduled = parseISO(scheduledTime);
  const now = new Date();
  const diff = scheduled.getTime() - now.getTime();
  
  if (diff <= 0) return 'Now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
