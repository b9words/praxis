import { notFound } from 'next/navigation'
import { assemblePublicProfile } from '@/lib/profile-assembler'
import { User, Calendar, BookOpen, Target, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import MarkdownRenderer from '@/components/ui/Markdown'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const profileData = await assemblePublicProfile(username)

  if (!profileData) {
    notFound()
  }

  const { profile, stats, recentResponses } = profileData

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="border-b border-neutral-200 pb-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <User className="h-10 w-10 text-neutral-400" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-sm text-neutral-500 mb-4">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-neutral-700 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-4 text-xs text-neutral-500">
                <Calendar className="h-3 w-3" />
                <span>Joined {formatDistanceToNow(profile.createdAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-50 border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-neutral-400" />
              <div className="text-lg font-semibold text-neutral-900">{stats.lessonsCompleted}</div>
            </div>
            <div className="text-xs text-neutral-500">Lessons Completed</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-neutral-400" />
              <div className="text-lg font-semibold text-neutral-900">{stats.caseResponses}</div>
            </div>
            <div className="text-xs text-neutral-500">Case Responses</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-neutral-400" />
              <div className="text-lg font-semibold text-neutral-900">{stats.totalLikes}</div>
            </div>
            <div className="text-xs text-neutral-500">Total Likes</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <div className="text-lg font-semibold text-neutral-900">
                {Math.round(stats.totalTimeSpent / 3600)}h
              </div>
            </div>
            <div className="text-xs text-neutral-500">Time Invested</div>
          </div>
        </div>

        {/* Recent Responses */}
        {recentResponses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Contributions</h2>
            <div className="space-y-4">
              {recentResponses.map((response) => (
                <div key={response.id} className="border border-neutral-200 bg-white">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          href={`/library/case-studies/${response.caseId}`}
                          className="text-sm font-medium text-neutral-900 hover:text-neutral-700"
                        >
                          {response.caseTitle}
                        </Link>
                        <div className="text-xs text-neutral-500 mt-1">
                          {formatDistanceToNow(response.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{response.likesCount}</span>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <MarkdownRenderer content={response.content} />
                    </div>
                    <Link
                      href={`/library/case-studies/${response.caseId}`}
                      className="text-xs text-neutral-600 hover:text-neutral-900 mt-3 inline-block"
                    >
                      View full response →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

