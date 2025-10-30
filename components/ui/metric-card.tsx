import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
  href?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  className?: string
}

const colorConfig = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    card: 'border-blue-200 hover:border-blue-300',
    value: 'text-blue-600',
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    card: 'border-green-200 hover:border-green-300',
    value: 'text-green-600',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    card: 'border-purple-200 hover:border-purple-300',
    value: 'text-purple-600',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    card: 'border-orange-200 hover:border-orange-300',
    value: 'text-orange-600',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    card: 'border-red-200 hover:border-red-300',
    value: 'text-red-600',
  },
  gray: {
    icon: 'bg-gray-100 text-gray-600',
    card: 'border-gray-200 hover:border-gray-300',
    value: 'text-gray-600',
  },
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'blue',
  href,
  trend,
  className
}: MetricCardProps) {
  const config = colorConfig[color]
  
  const CardWrapper = href ? Link : 'div'
  const cardProps = href ? { href } : {}

  return (
    <CardWrapper {...(cardProps as any)}>
      <Card className={cn(
        'transition-all duration-200',
        config.card,
        href && 'hover:shadow-md cursor-pointer hover:-translate-y-0.5',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('p-2 rounded-lg', config.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{title}</p>
                  {description && (
                    <p className="text-xs text-gray-500">{description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-2xl font-bold', config.value)}>
                  {value}
                </span>
                {trend && (
                  <span className={cn(
                    'text-sm font-medium',
                    trend.direction === 'up' ? 'text-green-600' :
                    trend.direction === 'down' ? 'text-red-600' :
                    'text-gray-500'
                  )}>
                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                    {Math.abs(trend.value)}% {trend.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
