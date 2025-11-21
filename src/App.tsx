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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="sticky top-0 z-50 flex justify-between items-center backdrop-blur-lg bg-gray-900/80 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-700/50">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Pill Reminder
            </h1>
            <p className="text-sm text-gray-400 mt-1">Stay consistent, stay healthy</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="giant-button bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
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

        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">
              Upcoming Reminders
            </h2>
            <button
              onClick={() => setShowAddPill(!showAddPill)}
              className="giant-button bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105"
            >
              {showAddPill ? 'Cancel' : '+ Add Pill'}
            </button>
          </div>

          {showAddPill && (
            <PillSchedule
              onSave={handleSavePill}
              onCancel={() => setShowAddPill(false)}
            />
          )}

          {pendingReminders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-50">[PILL]</div>
              <p className="text-gray-400 text-xl">
                No upcoming reminders. Add a pill to get started.
              </p>
            </div>
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

        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <h2 className="text-3xl font-bold text-white mb-6">
            My Pills
          </h2>
          {pills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                No pills added yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pills.map((pill: Pill) => (
                <div
                  key={pill.id}
                  className="group flex items-center justify-between p-5 bg-gray-800/50 hover:bg-gray-700/50 border-l-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  style={{ borderLeftColor: pill.color || '#3B82F6' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full shadow-lg"
                      style={{ backgroundColor: pill.color }}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {pill.name}
                      </h3>
                      <p className="text-gray-300">{pill.dosage}</p>
                      <p className="text-sm text-gray-500">
                        Times: {pill.times.join(', ')}
                      </p>
                      {pill.notes && (
                        <p className="text-sm text-gray-400 italic mt-1">
                          {pill.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deletePill(pill.id)}
                    className="px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-bold transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50"
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
