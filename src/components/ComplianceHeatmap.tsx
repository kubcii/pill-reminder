import React, { useMemo } from 'react';
import { PillLog } from '../types';

interface ComplianceHeatmapProps {
  logs: PillLog[];
  daysToShow?: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  taken: number;
  missed: number;
  total: number;
  compliance: number;
}

export const ComplianceHeatmap: React.FC<ComplianceHeatmapProps> = ({
  logs,
  daysToShow = 30
}) => {
  const heatmapData = useMemo(() => {
    const data: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.scheduledTime);
        return logDate.toISOString().split('T')[0] === dateStr;
      });

      const taken = dayLogs.filter(log => log.status === 'taken').length;
      const missed = dayLogs.filter(log => log.status === 'missed').length;
      const total = taken + missed;
      const compliance = total > 0 ? (taken / total) * 100 : 0;

      data.push({
        date,
        dateStr,
        taken,
        missed,
        total,
        compliance,
      });
    }

    return data;
  }, [logs, daysToShow]);

  const getColorClass = (compliance: number, hasData: boolean): string => {
    if (!hasData) return 'bg-gray-700';
    if (compliance === 100) return 'bg-green-500';
    if (compliance >= 80) return 'bg-green-400';
    if (compliance >= 60) return 'bg-yellow-500';
    if (compliance >= 40) return 'bg-orange-500';
    if (compliance > 0) return 'bg-red-500';
    return 'bg-red-700';
  };

  const overallCompliance = useMemo(() => {
    const totalLogs = logs.filter(l => l.status === 'taken' || l.status === 'missed');
    const takenLogs = logs.filter(l => l.status === 'taken');
    return totalLogs.length > 0 ? (takenLogs.length / totalLogs.length) * 100 : 0;
  }, [logs]);

  const weeksData = useMemo(() => {
    const weeks: DayData[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeks.push(heatmapData.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapData]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Compliance Tracker</h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Overall Compliance</div>
          <div className="text-3xl font-bold text-yellow-400">
            {overallCompliance.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          {weeksData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-2 mb-2">
              {week.map((day) => {
                const hasData = day.total > 0;
                return (
                  <div
                    key={day.dateStr}
                    className={`
                      flex-1 min-w-12 h-12 rounded-lg border-2 border-gray-600
                      ${getColorClass(day.compliance, hasData)}
                      hover:scale-110 transition-transform cursor-pointer
                      flex items-center justify-center
                    `}
                    title={`${day.date.toLocaleDateString()}\n${day.taken} taken, ${day.missed} missed\n${day.compliance.toFixed(0)}% compliance`}
                    role="gridcell"
                    aria-label={`${day.date.toLocaleDateString()}: ${day.compliance.toFixed(0)}% compliance`}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-lg">
                      {day.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-700 rounded border border-gray-600" aria-hidden="true" />
            <span className="text-xs text-gray-400">No data</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-700 rounded border border-gray-600" aria-hidden="true" />
            <span className="text-xs text-gray-400">0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded border border-gray-600" aria-hidden="true" />
            <span className="text-xs text-gray-400">~50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded border border-gray-600" aria-hidden="true" />
            <span className="text-xs text-gray-400">~75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded border border-gray-600" aria-hidden="true" />
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>
        <div className="text-gray-400">
          Last {daysToShow} days
        </div>
      </div>
    </div>
  );
};
