export interface Pill {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // Array of time strings like "09:00", "21:00"
  color?: string;
  notes?: string;
}

export interface PillLog {
  id: string;
  pillId: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'taken' | 'missed' | 'snoozed' | 'pending';
  snoozedUntil?: string;
}

export interface AppSettings {
  highContrast: boolean;
  notificationIntensity: 'quiet' | 'normal' | 'loud';
  enableVibration: boolean;
  snoozeMinutes: number;
}

export interface StreakData {
  current: number;
  best: number;
  lastTaken?: string;
}
