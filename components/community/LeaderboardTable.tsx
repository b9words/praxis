'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />
      default:
        return <span className="text-sm font-semibold text-gray-600">{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No leaderboard data yet</p>
        <p className="text-sm mt-2">Complete simulations to appear on the leaderboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
          <Card
            key={entry.id}
            className={`
              transition-all hover:shadow-md
              ${isCurrentUser ? 'border-blue-500 border-2 bg-blue-50' : ''}
              ${rank <= 3 ? 'shadow-lg' : ''}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full
                    ${getRankBadge(rank)}
                  `}
                >
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${entry.username}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {displayName}
                    {isCurrentUser && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {entry.simulations_completed} simulations • {entry.articles_completed} articles
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {entry.average_score.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-500">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

