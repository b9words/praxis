// Architectural accent component - creates uniform design language across sections
export function SectionAccent({ variant, className = '' }: { variant: 'vertical' | 'horizontal' | 'corner' | 'edge' | 'center'; className?: string }) {
  const baseClasses = 'absolute pointer-events-none'
  
  switch (variant) {
    case 'vertical':
      return (
        <div className={`${baseClasses} left-0 top-0 bottom-0 w-px bg-neutral-200 ${className}`} />
      )
    case 'horizontal':
      return (
        <div className={`${baseClasses} left-0 right-0 top-0 h-px bg-neutral-200 ${className}`} />
      )
    case 'corner':
      return (
        <div className={`${baseClasses} left-0 top-0 w-12 h-px bg-neutral-900 ${className}`} />
      )
    case 'edge':
      return (
        <>
          <div className={`${baseClasses} left-0 top-0 bottom-0 w-px bg-neutral-100 ${className}`} />
          <div className={`${baseClasses} right-0 top-0 bottom-0 w-px bg-neutral-100 ${className}`} />
        </>
      )
    case 'center':
      return (
        <div className={`${baseClasses} left-1/2 top-0 bottom-0 w-px bg-white/10 transform -translate-x-1/2 ${className}`} />
      )
    default:
      return null
  }
}



