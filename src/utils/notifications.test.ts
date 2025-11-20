import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  requestNotificationPermission,
  showNotification,
  scheduleNotification,
  cancelNotification,
} from './notifications';

describe('Notification Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset Notification mock
    global.Notification = vi.fn() as unknown as typeof Notification;
    global.Notification.requestPermission = vi.fn().mockResolvedValue('granted' as NotificationPermission);
    global.Notification.permission = 'default' as NotificationPermission;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('should request permission when Notification API exists', async () => {
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(global.Notification.requestPermission).toHaveBeenCalledOnce();
    });

    it('should return denied when Notification API not supported', async () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - Testing unsupported browser
      delete global.Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');

      global.Notification = originalNotification;
    });

    it('should handle permission denied', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('denied' as NotificationPermission);
      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('should handle permission default (not yet decided)', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('default' as NotificationPermission);
      const result = await requestNotificationPermission();
      expect(result).toBe('default');
    });
  });

  describe('showNotification', () => {
    let showNotificationMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Reset service worker mock
      showNotificationMock = vi.fn();
      (navigator as any).serviceWorker = {
        controller: {},
        ready: Promise.resolve({
          showNotification: showNotificationMock,
        }),
      };
    });

    it('should show notification with service worker', async () => {
      await showNotification('Test Title', { body: 'Test Body' });

      // Wait for service worker ready promise
      await vi.waitFor(() => {
        expect(showNotificationMock).toHaveBeenCalledWith(
          'Test Title',
          expect.objectContaining({
            body: 'Test Body',
            requireInteraction: true,
          })
        );
      });
    });

    it('should use Notification constructor without service worker', async () => {
      // Remove serviceWorker entirely from navigator
      delete (navigator as any).serviceWorker;

      await showNotification('Test Title', { body: 'Test Body' });
      expect(global.Notification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test Body',
          requireInteraction: true,
        })
      );
    });

    it('should not show notification when permission denied', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('denied' as NotificationPermission);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await showNotification('Test');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Notification permission not granted');
      consoleWarnSpy.mockRestore();
    });

    it('should set silent:true for quiet intensity', async () => {
      delete (navigator as any).serviceWorker;

      await showNotification('Test', { intensity: 'quiet' });
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          silent: true,
          vibrate: undefined,
        })
      );
    });

    it('should set normal vibration pattern', async () => {
      delete (navigator as any).serviceWorker;

      await showNotification('Test', { intensity: 'normal' });
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          silent: false,
          vibrate: [200, 100, 200],
        })
      );
    });

    it('should set loud vibration pattern', async () => {
      delete (navigator as any).serviceWorker;

      await showNotification('Test', { intensity: 'loud' });
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          silent: false,
          vibrate: [200, 100, 200, 100, 200],
        })
      );
    });

    it('should default to normal intensity', async () => {
      delete (navigator as any).serviceWorker;

      await showNotification('Test');
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          silent: false,
          vibrate: [200, 100, 200],
        })
      );
    });

    it('should pass through other NotificationOptions', async () => {
      delete (navigator as any).serviceWorker;

      await showNotification('Test', {
        body: 'Body',
        icon: 'icon.png',
        badge: 'badge.png',
      });

      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          body: 'Body',
          icon: 'icon.png',
          badge: 'badge.png',
        })
      );
    });
  });

  describe('scheduleNotification', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      delete (navigator as any).serviceWorker;
    });

    it('should schedule notification for future time', async () => {
      const futureTime = new Date('2025-01-20T14:30:00');
      const timeoutId = scheduleNotification('Aspirin', futureTime);

      expect(timeoutId).toBeGreaterThanOrEqual(0);

      // Wait for any async operations
      await vi.waitFor(() => {
        expect(global.Notification).not.toHaveBeenCalled();
      });
    });

    it('should show notification immediately for past time', async () => {
      const pastTime = new Date('2025-01-20T13:30:00');
      const timeoutId = scheduleNotification('Aspirin', pastTime);

      expect(timeoutId).toBe(-1);

      // Wait for async showNotification to complete
      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalledWith(
          'Time to take Aspirin',
          expect.objectContaining({
            body: 'Tap to confirm',
          })
        );
      });
    });

    it('should show notification immediately for current time', async () => {
      const now = new Date('2025-01-20T14:00:00');
      const timeoutId = scheduleNotification('Vitamin D', now);

      expect(timeoutId).toBe(-1);

      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalled();
      });
    });

    it('should trigger notification after delay', async () => {
      const futureTime = new Date('2025-01-20T14:15:00');
      scheduleNotification('Ibuprofen', futureTime);

      expect(global.Notification).not.toHaveBeenCalled();

      // Fast-forward 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000);

      // Wait for async showNotification
      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalledWith(
          'Time to take Ibuprofen',
          expect.objectContaining({
            body: 'Tap to confirm',
          })
        );
      });
    });

    it('should pass intensity to notification', async () => {
      const pastTime = new Date('2025-01-20T13:30:00');
      scheduleNotification('Aspirin', pastTime, 'loud');

      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalledWith(
          'Time to take Aspirin',
          expect.objectContaining({
            intensity: 'loud',
          })
        );
      });
    });

    it('should create unique tag per pill and time', async () => {
      const time1 = new Date('2025-01-20T13:30:00');
      const time2 = new Date('2025-01-20T14:30:00');

      scheduleNotification('Aspirin', time1);
      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalledTimes(1);
      });

      const tag1 = (global.Notification as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].tag;

      scheduleNotification('Aspirin', time2);
      await vi.waitFor(() => {
        expect(global.Notification).toHaveBeenCalledTimes(2);
      });

      const tag2 = (global.Notification as unknown as ReturnType<typeof vi.fn>).mock.calls[1][1].tag;

      expect(tag1).not.toBe(tag2);
      expect(tag1).toContain('Aspirin');
      expect(tag2).toContain('Aspirin');
    });
  });

  describe('cancelNotification', () => {
    it('should clear timeout for valid ID', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const timeoutId = 123;

      cancelNotification(timeoutId);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);
    });

    it('should not clear timeout for -1', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      cancelNotification(-1);
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should handle 0 as valid timeout ID', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      cancelNotification(0);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(0);
    });

    it('should prevent scheduled notification from firing', () => {
      vi.setSystemTime(new Date('2025-01-20T14:00:00'));
      delete (navigator as any).serviceWorker;

      const futureTime = new Date('2025-01-20T14:15:00');
      const timeoutId = scheduleNotification('Aspirin', futureTime);

      cancelNotification(timeoutId);
      vi.advanceTimersByTime(15 * 60 * 1000);

      expect(global.Notification).not.toHaveBeenCalled();
    });
  });
});
