import React from 'react';
import type { StreakData } from '../types';

interface StreakCounterProps {
  streakData: StreakData;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ streakData }) => {
  const { current, best, lastTaken } = streakData;

  const getStreakEmoji = (days: number): string => {
    if (days === 0) return '';
    if (days < 3) return '[FIRE]';
    if (days < 7) return '[FIRE][FIRE]';
    if (days < 30) return '[FIRE][FIRE][FIRE]';
    return '[STAR][FIRE][FIRE][FIRE]';
  };

  const getMotivationalText = (days: number): string => {
    if (days === 0) return 'Start your streak today';
    if (days === 1) return 'Great start';
    if (days < 7) return 'Keep it up';
    if (days < 30) return 'Excellent consistency';
    if (days < 90) return 'You are crushing it';
    return 'Legendary streak';
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Streak</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-black bg-opacity-30 rounded-lg p-6 text-center">
          <div className="text-sm uppercase text-gray-300 mb-2">Current Streak</div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-yellow-400 mb-2">
              {current}
            </div>
            <div className="text-3xl mb-2" aria-hidden="true">
              {getStreakEmoji(current)}
            </div>
            <div className="text-lg font-semibold text-gray-200">
              {current === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        <div className="bg-black bg-opacity-30 rounded-lg p-6 text-center">
          <div className="text-sm uppercase text-gray-300 mb-2">Best Streak</div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-orange-400 mb-2">
              {best}
            </div>
            <div className="text-3xl mb-2" aria-hidden="true">
              {best > 0 ? '[TROPHY]' : ''}
            </div>
            <div className="text-lg font-semibold text-gray-200">
              {best === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xl font-bold text-yellow-300 mb-2">
          {getMotivationalText(current)}
        </p>
        {lastTaken && (
          <p className="text-sm text-gray-400">
            Last taken: {new Date(lastTaken).toLocaleString()}
          </p>
        )}
      </div>

      {current > 0 && (
        <div className="mt-6 bg-black bg-opacity-30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Progress to next milestone:</span>
            <span className="font-bold text-yellow-400">
              {current < 7 ? `${7 - current} days to 1 week` :
               current < 30 ? `${30 - current} days to 1 month` :
               current < 90 ? `${90 - current} days to 3 months` :
               current < 365 ? `${365 - current} days to 1 year` :
               'Legendary status achieved'}
            </span>
          </div>
          <div className="mt-3 bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  current < 7 ? (current / 7) * 100 :
                  current < 30 ? (current / 30) * 100 :
                  current < 90 ? (current / 90) * 100 :
                  current < 365 ? (current / 365) * 100 :
                  100
                )}%`
              }}
              role="progressbar"
              aria-valuenow={current}
              aria-valuemin={0}
              aria-valuemax={
                current < 7 ? 7 :
                current < 30 ? 30 :
                current < 90 ? 90 :
                365
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
