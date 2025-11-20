import { useCallback, useEffect } from 'react';
import { AppSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_SETTINGS: AppSettings = {
  highContrast: false,
  notificationIntensity: 'normal',
  enableVibration: true,
  snoozeMinutes: 10,
};

interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toggleHighContrast: () => void;
  setNotificationIntensity: (intensity: 'quiet' | 'normal' | 'loud') => void;
  toggleVibration: () => void;
  setSnoozeMinutes: (minutes: number) => void;
}

/**
 * Manages app settings (high contrast, notification intensity, etc.)
 * Configuration for people who can't handle default settings
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings, clearSettings] = useLocalStorage<AppSettings>(
    'app-settings',
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  const resetSettings = useCallback(() => {
    clearSettings();
  }, [clearSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !settings.highContrast });
  }, [settings.highContrast, updateSettings]);

  const setNotificationIntensity = useCallback(
    (intensity: 'quiet' | 'normal' | 'loud') => {
      updateSettings({ notificationIntensity: intensity });
    },
    [updateSettings]
  );

  const toggleVibration = useCallback(() => {
    updateSettings({ enableVibration: !settings.enableVibration });
  }, [settings.enableVibration, updateSettings]);

  const setSnoozeMinutes = useCallback(
    (minutes: number) => {
      if (minutes > 0 && minutes <= 60) {
        updateSettings({ snoozeMinutes: minutes });
      }
    },
    [updateSettings]
  );

  // Apply high contrast mode to document
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings.highContrast]);

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleHighContrast,
    setNotificationIntensity,
    toggleVibration,
    setSnoozeMinutes,
  };
}
