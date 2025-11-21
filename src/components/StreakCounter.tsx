import type { StreakData } from '../types'

export interface StreakCounterProps {
  streakData: StreakData
}

export function StreakCounter({ streakData }: StreakCounterProps) {
  const { current, best } = streakData
  
  const getStreakLevel = (streak: number) => {
    if (streak >= 365) return { label: 'LEGENDARY', color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/50' }
    if (streak >= 90) return { label: 'CHAMPION', color: 'from-yellow-500 to-orange-500', glow: 'shadow-yellow-500/50' }
    if (streak >= 30) return { label: 'MASTER', color: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/50' }
    if (streak >= 7) return { label: 'WARRIOR', color: 'from-green-500 to-emerald-500', glow: 'shadow-green-500/50' }
    return { label: 'BEGINNER', color: 'from-gray-500 to-gray-600', glow: 'shadow-gray-500/50' }
  }

  const currentLevel = getStreakLevel(current)
  const nextMilestone = current < 7 ? 7 : current < 30 ? 30 : current < 90 ? 90 : 365
  const progress = Math.min((current / nextMilestone) * 100, 100)

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentLevel.color} p-1 shadow-2xl ${currentLevel.glow}`}>
      <div className="bg-gray-900 rounded-xl p-8">
        {/* Level Badge */}
        <div className="text-center mb-6">
          <span className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${currentLevel.color} text-white font-bold text-sm tracking-wider shadow-lg`}>
            {currentLevel.label}
          </span>
        </div>

        {/* Streak Display */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Current Streak</p>
            <p className={`text-7xl font-black bg-gradient-to-r ${currentLevel.color} bg-clip-text text-transparent`}>
              {current}
            </p>
            <p className="text-gray-500 text-sm mt-1">days</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Best Streak</p>
            <p className="text-7xl font-black text-yellow-500">
              {best}
            </p>
            <p className="text-gray-500 text-sm mt-1">days</p>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {current < 365 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Next: {nextMilestone} days</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500 rounded-full`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Motivational Text */}
        {current > 0 && (
          <p className="text-center text-gray-300 mt-4 text-lg">
            {current >= 365 ? '🏆 You are unstoppable!' :
             current >= 90 ? '🔥 Keep crushing it!' :
             current >= 30 ? '💪 You got this!' :
             current >= 7 ? '⭐ Great progress!' :
             '🌟 Every day counts!'}
          </p>
        )}
      </div>
    </div>
  )
}
