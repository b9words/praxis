'use client'

import { Flame } from 'lucide-react'

interface LearningStreakProps {
  currentStreak: number
  longestStreak: number
}

export default function LearningStreak({
  currentStreak,
  longestStreak,
}: LearningStreakProps) {
  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Flame className="h-4 w-4 text-gray-600" />
          Learning Streak
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <div className="text-3xl font-semibold text-gray-900">{currentStreak}</div>
          <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </p>
        </div>
        
        {longestStreak > currentStreak && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Longest streak: <span className="font-semibold text-gray-900">{longestStreak} days</span>
            </p>
          </div>
        )}

        <div className="flex gap-1 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-10 flex-1 ${
                i < currentStreak % 7
                  ? 'bg-gray-900'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

