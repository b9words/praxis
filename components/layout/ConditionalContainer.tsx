'use client'

import { usePathname } from 'next/navigation'
import Container from './Container'

interface ConditionalContainerProps {
  children: React.ReactNode
  variant?: 'app' | 'marketing'
}

export default function ConditionalContainer({ children, variant = 'app' }: ConditionalContainerProps) {
  const pathname = usePathname()
  const isLibraryRoute = pathname?.startsWith('/library') ?? false

  if (isLibraryRoute) {
    return <>{children}</>
  }

  return <Container variant={variant}>{children}</Container>
}


