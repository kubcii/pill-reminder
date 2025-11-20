export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

export const showNotification = async (
  title: string,
  options: NotificationOptions & { intensity?: 'quiet' | 'normal' | 'loud' } = {}
): Promise<void> => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }
  
  const { intensity = 'normal', ...notificationOptions } = options;
  
  const notifOptions: NotificationOptions = {
    ...notificationOptions,
    requireInteraction: true,
    silent: intensity === 'quiet',
    ...(intensity !== 'quiet' && { vibrate: intensity === 'loud' ? [200, 100, 200, 100, 200] : [200, 100, 200] }),
  } as NotificationOptions & { vibrate?: number[] };
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, notifOptions);
    });
  } else {
    new Notification(title, notifOptions);
  }
};

export const scheduleNotification = (
  pillName: string,
  scheduledTime: Date,
  intensity: 'quiet' | 'normal' | 'loud' = 'normal'
): number => {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();
  
  if (delay <= 0) {
    const tag = 'pill-' + pillName + '-' + scheduledTime.getTime();
    showNotification('Time to take ' + pillName, {
      body: 'Tap to confirm',
      intensity,
      tag,
    });
    return -1;
  }
  
  const timeoutId = window.setTimeout(() => {
    const tag = 'pill-' + pillName + '-' + scheduledTime.getTime();
    showNotification('Time to take ' + pillName, {
      body: 'Tap to confirm',
      intensity,
      tag,
    });
  }, delay);
  
  return timeoutId;
};

export const cancelNotification = (timeoutId: number): void => {
  if (timeoutId >= 0) {
    clearTimeout(timeoutId);
  }
};
