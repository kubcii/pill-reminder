import { useState, useEffect, useCallback, useRef } from 'react';
import { Pill, PillLog } from '../types';
import { requestNotificationPermission, scheduleNotification, cancelNotification } from '../utils/notifications';
import { parseTimeString } from '../utils/time';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleForPill: (pill: Pill, intensity: 'quiet' | 'normal' | 'loud') => void;
  cancelForPill: (pillId: string) => void;
  cancelAll: () => void;
}

/**
 * Handles notification permissions and scheduling
 * Because you definitely won't remember to take your pills otherwise
 */
export function useNotifications(logs: PillLog[]): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  // Store timeout IDs for cleanup
  const scheduledNotifications = useRef<Map<string, number[]>>(new Map());

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const scheduleForPill = useCallback(
    (pill: Pill, intensity: 'quiet' | 'normal' | 'loud' = 'normal') => {
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Cancel existing notifications for this pill
      const existingTimeouts = scheduledNotifications.current.get(pill.id);
      if (existingTimeouts) {
        existingTimeouts.forEach(cancelNotification);
      }

      // Schedule new notifications for each time
      const timeoutIds: number[] = [];
      pill.times.forEach(timeStr => {
        const scheduledTime = parseTimeString(timeStr);
        const timeoutId = scheduleNotification(pill.name, scheduledTime, intensity);
        if (timeoutId >= 0) {
          timeoutIds.push(timeoutId);
        }
      });

      scheduledNotifications.current.set(pill.id, timeoutIds);
    },
    [permission]
  );

  const cancelForPill = useCallback((pillId: string) => {
    const timeoutIds = scheduledNotifications.current.get(pillId);
    if (timeoutIds) {
      timeoutIds.forEach(cancelNotification);
      scheduledNotifications.current.delete(pillId);
    }
  }, []);

  const cancelAll = useCallback(() => {
    scheduledNotifications.current.forEach(timeoutIds => {
      timeoutIds.forEach(cancelNotification);
    });
    scheduledNotifications.current.clear();
  }, []);

  // Update notification permission when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const checkPermission = () => {
      setPermission(Notification.permission);
    };

    // Check permission periodically in case it changes
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup all notifications on unmount
  useEffect(() => {
    return () => {
      cancelAll();
    };
  }, [cancelAll]);

  // Auto-reschedule notifications when logs change (pills taken/missed)
  useEffect(() => {
    // This effect could be enhanced to reschedule based on log status changes
    // For now, it's a placeholder for future enhancements
  }, [logs]);

  return {
    permission,
    requestPermission,
    scheduleForPill,
    cancelForPill,
    cancelAll,
  };
}
