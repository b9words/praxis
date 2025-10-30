import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, Lock } from 'lucide-react'

interface StatusBadgeProps {
  status: 'completed' | 'in_progress' | 'locked' | 'available'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  locked: {
    label: 'Locked',
    icon: Lock,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  available: {
    label: 'Available',
    icon: Circle,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
}

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
}

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        sizeConfig[size],
        'font-medium border',
        className
      )}
    >
      {showIcon && <Icon className={cn(
        'mr-1',
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      )} />}
      {config.label}
    </Badge>
  )
}
