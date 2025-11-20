import React, { useState, useEffect } from 'react';
import type { Pill, PillLog } from '../types';

interface ReminderCardProps {
  pill: Pill;
  scheduledTime: string;
  onTaken: () => void;
  onSnooze: () => void;
  onMiss: () => void;
  log?: PillLog;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  pill,
  scheduledTime,
  onTaken,
  onSnooze,
  onMiss,
  log,
}) => {
  const [timeUntil, setTimeUntil] = useState<string>('');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const scheduled = new Date();
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      scheduled.setHours(hours, minutes, 0, 0);

      const diff = scheduled.getTime() - now.getTime();
      const past = diff < 0;
      setIsPast(past);

      if (past) {
        const absDiff = Math.abs(diff);
        const hoursLate = Math.floor(absDiff / (1000 * 60 * 60));
        const minutesLate = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hoursLate > 0) {
          setTimeUntil(`${hoursLate}h ${minutesLate}m overdue`);
        } else {
          setTimeUntil(`${minutesLate}m overdue`);
        }
      } else {
        const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
        const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hoursUntil > 0) {
          setTimeUntil(`in ${hoursUntil}h ${minutesUntil}m`);
        } else if (minutesUntil > 0) {
          setTimeUntil(`in ${minutesUntil}m`);
        } else {
          setTimeUntil('NOW');
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [scheduledTime]);

  const status = log?.status || 'pending';
  const isCompleted = status === 'taken';
  const isSnoozed = status === 'snoozed';
  const isMissed = status === 'missed';

  return (
    <div
      className={`p-6 rounded-lg border-4 ${
        isCompleted ? 'bg-green-900 border-green-500' :
        isMissed ? 'bg-red-900 border-red-500' :
        isPast ? 'bg-orange-900 border-orange-500' :
        'bg-gray-800 border-gray-600'
      }`}
      role="article"
      aria-label={`Reminder for ${pill.name}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white"
              style={{ backgroundColor: pill.color }}
              aria-hidden="true"
            />
            <h3 className="text-2xl font-bold">{pill.name}</h3>
          </div>
          <p className="text-xl text-gray-300">{pill.dosage}</p>
          {pill.notes && (
            <p className="text-lg text-gray-400 mt-2 italic">{pill.notes}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold mb-1">{scheduledTime}</div>
          <div className={`text-lg font-semibold ${
            isPast && !isCompleted ? 'text-orange-400' : 'text-gray-400'
          }`}>
            {timeUntil}
          </div>
        </div>
      </div>

      {isCompleted && log?.takenTime && (
        <div className="mb-4 p-4 bg-green-800 rounded-lg">
          <p className="text-lg font-semibold text-green-200">
            ✓ Taken at {new Date(log.takenTime).toLocaleTimeString()}
          </p>
        </div>
      )}

      {isMissed && (
        <div className="mb-4 p-4 bg-red-800 rounded-lg">
          <p className="text-lg font-semibold text-red-200">
            ✗ Marked as missed
          </p>
        </div>
      )}

      {isSnoozed && log?.snoozedUntil && (
        <div className="mb-4 p-4 bg-blue-800 rounded-lg">
          <p className="text-lg font-semibold text-blue-200">
            Snoozed until {new Date(log.snoozedUntil).toLocaleTimeString()}
          </p>
        </div>
      )}

      {!isCompleted && !isMissed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={onTaken}
            className="giant-button bg-green-600 hover:bg-green-700"
            aria-label={`Mark ${pill.name} as taken`}
          >
            ✓ Taken
          </button>
          <button
            onClick={onSnooze}
            className="giant-button bg-blue-600 hover:bg-blue-700"
            aria-label={`Snooze ${pill.name} reminder`}
          >
            ⏰ Snooze
          </button>
          <button
            onClick={onMiss}
            className="giant-button bg-red-600 hover:bg-red-700"
            aria-label={`Mark ${pill.name} as missed`}
          >
            ✗ Skip
          </button>
        </div>
      )}
    </div>
  );
};
