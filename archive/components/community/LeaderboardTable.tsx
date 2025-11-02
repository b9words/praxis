'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Award, Medal, Trophy } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  simulations_completed: number
  articles_completed: number
  average_score: number
  last_activity: string
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-gray-700" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-600" />
      case 3:
        return <Award className="h-5 w-5 text-gray-600" />
      default:
        return <span className="text-sm font-semibold text-gray-600">{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gray-900 text-white'
      case 2:
        return 'bg-gray-700 text-white'
      case 3:
        return 'bg-gray-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-12 text-center">
        <p className="text-sm font-medium text-gray-900 mb-2">No leaderboard data yet</p>
        <p className="text-xs text-gray-500">Complete simulations to appear on the leaderboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const rank = index + 1
        const isCurrentUser = entry.id === currentUserId
        const displayName = entry.full_name || entry.username
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()

        return (
          <div
            key={entry.id}
            className={`
              bg-white border border-gray-200 p-4 transition-colors hover:border-gray-300
              ${isCurrentUser ? 'border-gray-900 bg-gray-50' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div
                className={`
                  flex items-center justify-center w-12 h-12
                  ${getRankBadge(rank)}
                `}
              >
                {getRankIcon(rank)}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-100 text-gray-700">{initials}</AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${entry.username}`}
                  className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                >
                  {displayName}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-gray-200 text-gray-700 border-gray-300">
                      You
                    </Badge>
                  )}
                </Link>
                <p className="text-xs text-gray-600">
                  {entry.simulations_completed} engagements completed
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-xl font-semibold text-gray-900">
                  {entry.average_score.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500">Mean Competency Score</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

