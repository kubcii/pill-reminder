import { useState, useEffect } from 'react'
import { PillSchedule } from './components/PillSchedule'
import { ReminderCard } from './components/ReminderCard'
import { StreakCounter } from './components/StreakCounter'
import { ComplianceHeatmap } from './components/ComplianceHeatmap'
import { SettingsPanel } from './components/SettingsPanel'
import { usePills } from './hooks/usePills'
import { useStreak } from './hooks/useStreak'
import { useSettings } from './hooks/useSettings'
import { useNotifications } from './hooks/useNotifications'
import type { Pill } from './types'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showAddPill, setShowAddPill] = useState(false)

  const { pills, logs, addPill, deletePill, logPillTaken, logPillMissed, snoozePill } = usePills()
  const streakData = useStreak(logs)
  const { settings, updateSettings } = useSettings()
  const { permission, requestPermission, scheduleForPill, cancelAll } = useNotifications(logs)

  useEffect(() => {
    if (permission !== 'granted') {
      requestPermission()
    }
  }, [permission, requestPermission])

  useEffect(() => {
    if (settings.highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }
  }, [settings.highContrast])

  useEffect(() => {
    pills.forEach(pill => {
      scheduleForPill(pill, settings.notificationIntensity)
    })

    return () => cancelAll()
  }, [pills, settings.notificationIntensity, scheduleForPill, cancelAll])

  const handleSavePill = (pill: Omit<Pill, 'id'>) => {
    addPill(pill)
    setShowAddPill(false)
  }

  const handleSnooze = (pillId: string, scheduledTime: string) => {
    snoozePill(pillId, scheduledTime, settings.snoozeMinutes)
  }

  const pendingReminders = logs
    .filter(log => log.status === 'pending' || log.status === 'snoozed')
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Pill Reminder
          </h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="giant-button bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-label="Toggle settings"
          >
            Settings
          </button>
        </header>

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
          />
        )}

        <StreakCounter streakData={streakData} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upcoming Reminders
            </h2>
            <button
              onClick={() => setShowAddPill(!showAddPill)}
              className="giant-button bg-blue-600 text-white hover:bg-blue-700"
            >
              {showAddPill ? 'Cancel' : 'Add Pill'}
            </button>
          </div>

          {showAddPill && (
            <PillSchedule
              onSave={handleSavePill}
              onCancel={() => setShowAddPill(false)}
            />
          )}

          {pendingReminders.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-xl">
              No upcoming reminders. Add a pill to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingReminders.map(log => {
                const pill = pills.find(p => p.id === log.pillId)
                if (!pill) return null

                return (
                  <ReminderCard
                    key={log.id}
                    pill={pill}
                    scheduledTime={log.scheduledTime}
                    log={log}
                    onTaken={() => logPillTaken(log.pillId, log.scheduledTime)}
                    onSnooze={() => handleSnooze(log.pillId, log.scheduledTime)}
                    onMiss={() => logPillMissed(log.pillId, log.scheduledTime)}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            My Pills
          </h2>
          {pills.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No pills added yet
            </p>
          ) : (
            <div className="space-y-3">
              {pills.map((pill: Pill) => (
                <div
                  key={pill.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  style={{ borderLeftWidth: '4px', borderLeftColor: pill.color || '#3B82F6' }}
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {pill.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{pill.dosage}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Times: {pill.times.join(', ')}
                    </p>
                    {pill.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 italic mt-1">
                        {pill.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePill(pill.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ComplianceHeatmap logs={logs} />
      </div>
    </div>
  )
}

export default App
