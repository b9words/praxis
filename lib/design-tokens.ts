// Design tokens for consistent visual styling across the platform

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Competency colors
  competency: {
    financial: '#3b82f6', // Blue
    strategic: '#10b981', // Green
    market: '#8b5cf6', // Purple
    risk: '#f59e0b', // Orange
    leadership: '#ef4444', // Red
  }
}

export const spacing = {
  xs: '0.5rem', // 8px
  sm: '0.75rem', // 12px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
}

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
}

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
}

// Component-specific design tokens
export const components = {
  card: {
    background: 'white',
    border: colors.primary[200],
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
    padding: spacing.lg,
  },
  
  button: {
    primary: {
      background: colors.primary[600],
      backgroundHover: colors.primary[700],
      text: 'white',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
    },
    secondary: {
      background: 'white',
      backgroundHover: colors.primary[50],
      text: colors.primary[600],
      border: colors.primary[200],
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
    }
  },
  
  badge: {
    primary: {
      background: colors.primary[100],
      text: colors.primary[800],
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.sm}`,
    },
    success: {
      background: colors.success[100],
      text: colors.success[800],
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.sm}`,
    }
  }
}

// Icon mappings for consistent iconography
export const icons = {
  competencies: {
    financial: 'DollarSign',
    strategic: 'Target',
    market: 'TrendingUp',
    risk: 'Shield',
    leadership: 'Users',
  },
  
  actions: {
    read: 'BookOpen',
    practice: 'Target',
    discuss: 'MessageCircle',
    analyze: 'BarChart3',
    complete: 'CheckCircle2',
    next: 'ArrowRight',
    back: 'ArrowLeft',
  },
  
  status: {
    completed: 'CheckCircle2',
    inProgress: 'Clock',
    locked: 'Lock',
    available: 'Circle',
  }
}

// Utility functions for consistent styling
export const getCompetencyColor = (competency: string) => {
  const key = competency.toLowerCase().replace(/\s+/g, '') as keyof typeof colors.competency
  return colors.competency[key] || colors.primary[500]
}

export const getStatusIcon = (status: 'completed' | 'in_progress' | 'locked' | 'available') => {
  return icons.status[status === 'in_progress' ? 'inProgress' : status]
}

export const getActionIcon = (action: keyof typeof icons.actions) => {
  return icons.actions[action]
}
