'use client'

import { Button } from '@/components/ui/button'
import { handleManageBilling } from './actions'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await handleManageBilling()
      if (result?.portalUrl) {
        window.location.href = result.portalUrl
      } else {
        toast.error('Unable to access billing portal')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant="outline"
      className="border-gray-300 hover:border-gray-400 rounded-none"
    >
      {isLoading ? 'Loading...' : 'Manage Billing Portal'}
    </Button>
  )
}

