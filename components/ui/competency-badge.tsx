import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DollarSign, Shield, Target, TrendingUp, Users } from 'lucide-react'

interface CompetencyBadgeProps {
  competency: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  variant?: 'default' | 'outline' | 'solid'
  className?: string
}

const competencyConfig = {
  'Financial Acumen': {
    icon: DollarSign,
    color: 'blue',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    solidClassName: 'bg-blue-600 text-white',
  },
  'Strategic Thinking': {
    icon: Target,
    color: 'green',
    className: 'bg-green-100 text-green-800 border-green-200',
    solidClassName: 'bg-green-600 text-white',
  },
  'Market Awareness': {
    icon: TrendingUp,
    color: 'purple',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    solidClassName: 'bg-purple-600 text-white',
  },
  'Risk Management': {
    icon: Shield,
    color: 'orange',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    solidClassName: 'bg-orange-600 text-white',
  },
  'Leadership Judgment': {
    icon: Users,
    color: 'red',
    className: 'bg-red-100 text-red-800 border-red-200',
    solidClassName: 'bg-red-600 text-white',
  },
}

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2',
}

export default function CompetencyBadge({ 
  competency, 
  size = 'md', 
  showIcon = true, 
  variant = 'default',
  className 
}: CompetencyBadgeProps) {
  const config = competencyConfig[competency as keyof typeof competencyConfig] || {
    icon: Target,
    color: 'gray',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    solidClassName: 'bg-gray-600 text-white',
  }
  
  const Icon = config.icon

  const getVariantClassName = () => {
    switch (variant) {
      case 'solid':
        return config.solidClassName
      case 'outline':
        return `border-2 ${config.className.replace('bg-', 'border-').replace('text-', 'text-').replace('border-', 'bg-transparent border-')}`
      default:
        return config.className
    }
  }

  return (
    <Badge 
      variant={variant === 'solid' ? 'default' : 'outline'}
      className={cn(
        getVariantClassName(),
        sizeConfig[size],
        'font-medium border inline-flex items-center',
        className
      )}
    >
      {showIcon && <Icon className={cn(
        'mr-1',
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      )} />}
      {competency}
    </Badge>
  )
}
