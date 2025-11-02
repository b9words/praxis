'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getContentImageUrlById } from '@/lib/image-utils'
import { trackEvents } from '@/lib/analytics'

interface ThreadCardProps {
  id: string
  title: string
  url: string
  author: string
  engagement: number
}

export default function ThreadCard({
  id,
  title,
  url,
  author,
  engagement,
}: ThreadCardProps) {
  const imageUrl = getContentImageUrlById(id, 400, 400)

  const handleClick = () => {
    trackEvents.dashboardCardClicked('thread', id, 'Hot in The Network')
  }

  if (!url) {
    return null
  }

  return (
    <Link href={url} className="block group min-w-[180px] w-[180px]" onClick={handleClick}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all duration-200">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="180px"
            unoptimized
          />
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
          
          {/* Engagement badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 shadow-sm">
            <MessageCircle className="h-3 w-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-900">{engagement}</span>
          </div>
        </div>
        <div className="px-3 py-3">
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 font-medium line-clamp-1">{author}</p>
        </div>
      </div>
    </Link>
  )
}

