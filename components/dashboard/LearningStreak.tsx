'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-gray-900">{currentStreak}</div>
            <p className="text-sm text-gray-600 mt-1">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </div>
          
          {longestStreak > currentStreak && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Longest streak: <span className="font-semibold text-gray-900">{longestStreak} days</span>
              </p>
            </div>
          )}

          <div className="flex gap-1 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-10 flex-1 rounded ${
                  i < currentStreak % 7
                    ? 'bg-orange-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

