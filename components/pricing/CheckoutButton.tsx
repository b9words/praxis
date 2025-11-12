'use client'

import { useState, useRef } from 'react'
import { ConfirmModal } from '@/components/ui/modals/ConfirmModal'
import MockCheckout from './MockCheckout'
import PaddleCheckout from './PaddleCheckout'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  planId?: string
  planName: string
  price: string
  period: string
  isMock?: boolean
  className?: string
  children?: React.ReactNode
  variant?: 'upgrade' | 'downgrade' | 'new'
}

export default function CheckoutButton({
  planId,
  planName,
  price,
  period,
  isMock = false,
  className,
  children,
  variant = 'new',
}: CheckoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [shouldCheckout, setShouldCheckout] = useState(false)
  const checkoutRef = useRef<HTMLDivElement>(null)

  const handleConfirm = () => {
    setShowConfirm(false)
    setShouldCheckout(true)
    // Trigger checkout after a brief delay to allow modal to close
    setTimeout(() => {
      const button = checkoutRef.current?.querySelector('button') as HTMLButtonElement
      if (button) {
        button.click()
      }
      setShouldCheckout(false)
    }, 100)
  }

  const getConfirmMessage = () => {
    if (variant === 'upgrade') {
      return `Upgrade to ${planName} for ${price}${period}? This will change your subscription immediately.`
    }
    if (variant === 'downgrade') {
      return `Downgrade to ${planName} for ${price}${period}? Your subscription will change at the end of your current billing period.`
    }
    return `Subscribe to ${planName} for ${price}${period}? This will start your subscription immediately.`
  }

  return (
    <>
      <div ref={checkoutRef} className={shouldCheckout ? '' : 'hidden'}>
        {isMock ? (
          <MockCheckout
            planName={planName}
            className={className}
          >
            {children}
          </MockCheckout>
        ) : planId && planId.trim() !== '' ? (
          <PaddleCheckout
            planId={planId}
            planName={planName}
            className={className}
          >
            {children}
          </PaddleCheckout>
        ) : null}
      </div>
      
      <Button
        onClick={() => setShowConfirm(true)}
        className={className}
      >
        {children}
      </Button>

      <ConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`Confirm ${variant === 'upgrade' ? 'Upgrade' : variant === 'downgrade' ? 'Downgrade' : 'Subscription'}`}
        description={getConfirmMessage()}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
      />
    </>
  )
}

