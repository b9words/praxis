'use client'

import { ReactChannelIO } from 'react-channel-plugin'

interface ChannelIOProviderProps {
  children: React.ReactNode
}

export default function ChannelIOProvider({ children }: ChannelIOProviderProps) {
  const pluginKey = process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY

  // Only render if plugin key is configured
  if (!pluginKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('ChannelIO plugin key not configured. Set NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY environment variable.')
    }
    return <>{children}</>
  }

  return (
    <ReactChannelIO
      pluginKey={pluginKey}
      language="en"
      autoBoot
      autoBootTimeout={1000}
    >
      {children}
    </ReactChannelIO>
  )
}

