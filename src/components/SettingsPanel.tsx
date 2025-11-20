import React from 'react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* High Contrast Mode */}
      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div className="flex-1">
          <label htmlFor="high-contrast-toggle" className="text-lg font-semibold block mb-1">
            High Contrast Mode
          </label>
          <p className="text-sm text-gray-400">
            Black background with yellow accents for maximum visibility
          </p>
        </div>
        <button
          id="high-contrast-toggle"
          role="switch"
          aria-checked={settings.highContrast}
          onClick={() => onUpdate({ highContrast: !settings.highContrast })}
          className={`
            relative w-20 h-10 rounded-full transition-colors
            ${settings.highContrast ? 'bg-yellow-500' : 'bg-gray-500'}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 w-8 h-8 bg-white rounded-full transition-transform
              ${settings.highContrast ? 'translate-x-10' : 'translate-x-0'}
            `}
          />
          <span className="sr-only">
            {settings.highContrast ? 'Disable' : 'Enable'} high contrast mode
          </span>
        </button>
      </div>

      {/* Notification Intensity */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <label htmlFor="notification-intensity" className="text-lg font-semibold block mb-3">
          Notification Intensity
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['quiet', 'normal', 'loud'] as const).map((intensity) => (
            <button
              key={intensity}
              onClick={() => onUpdate({ notificationIntensity: intensity })}
              className={`
                giant-button
                ${settings.notificationIntensity === intensity
                  ? 'bg-blue-600 border-4 border-blue-400'
                  : 'bg-gray-600 hover:bg-gray-500'
                }
              `}
              aria-pressed={settings.notificationIntensity === intensity}
            >
              {intensity === 'quiet' && '[QUIET] Quiet'}
              {intensity === 'normal' && '[NORMAL] Normal'}
              {intensity === 'loud' && '[LOUD] Loud'}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-3">
          {settings.notificationIntensity === 'quiet' && 'Silent notifications with minimal vibration'}
          {settings.notificationIntensity === 'normal' && 'Standard notifications with normal vibration'}
          {settings.notificationIntensity === 'loud' && 'Persistent notifications with strong vibration'}
        </p>
      </div>

      {/* Vibration */}
      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div className="flex-1">
          <label htmlFor="vibration-toggle" className="text-lg font-semibold block mb-1">
            Vibration
          </label>
          <p className="text-sm text-gray-400">
            Vibrate device when notifications appear
          </p>
        </div>
        <button
          id="vibration-toggle"
          role="switch"
          aria-checked={settings.enableVibration}
          onClick={() => onUpdate({ enableVibration: !settings.enableVibration })}
          className={`
            relative w-20 h-10 rounded-full transition-colors
            ${settings.enableVibration ? 'bg-blue-500' : 'bg-gray-500'}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 w-8 h-8 bg-white rounded-full transition-transform
              ${settings.enableVibration ? 'translate-x-10' : 'translate-x-0'}
            `}
          />
          <span className="sr-only">
            {settings.enableVibration ? 'Disable' : 'Enable'} vibration
          </span>
        </button>
      </div>

      {/* Snooze Duration */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <label htmlFor="snooze-slider" className="text-lg font-semibold block mb-3">
          Snooze Duration: {settings.snoozeMinutes} minutes
        </label>
        <input
          id="snooze-slider"
          type="range"
          min="5"
          max="60"
          step="5"
          value={settings.snoozeMinutes}
          onChange={(e) => onUpdate({ snoozeMinutes: parseInt(e.target.value) })}
          className="w-full h-4 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          aria-valuemin={5}
          aria-valuemax={60}
          aria-valuenow={settings.snoozeMinutes}
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>5 min</span>
          <span>30 min</span>
          <span>60 min</span>
        </div>
      </div>

      {/* Information */}
      <div className="p-4 bg-blue-900 bg-opacity-30 rounded-lg border-2 border-blue-700">
        <h3 className="font-semibold text-lg mb-2">Accessibility Features</h3>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>Large touch targets (60px+) for easy tapping</li>
          <li>High contrast mode for visual clarity</li>
          <li>Screen reader support with ARIA labels</li>
          <li>Keyboard navigation enabled</li>
          <li>Swipe gestures to prevent accidental actions</li>
        </ul>
      </div>
    </div>
  );
};
