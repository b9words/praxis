'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { toast } from 'sonner'

interface AIPersonaChatProps {
  caseData: any
  personaName: string
  personaRole: string
  onComplete?: (chatHistory: any[]) => void
}

export default function AIPersonaChat({ 
  caseData, 
  personaName, 
  personaRole,
  onComplete 
}: AIPersonaChatProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    {
      role: 'assistant',
      content: `Hi, I'm ${personaName}, ${personaRole}. I understand you'd like to discuss the case with me. How can I help you?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const session = await supabase.auth.getSession()

      // Call AI persona endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-persona-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          caseData,
          personaName,
          personaRole,
          chatHistory: messages,
          userMessage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const { reply } = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (error) {
      console.error('Error in AI chat:', error)
      toast.error('Failed to get response. Please try again.')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, I'm having trouble responding right now. Could you rephrase your question?`
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete(messages)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-blue-600 text-white">
              {personaName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{personaName}</h3>
            <p className="text-sm text-gray-600">{personaRole}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] p-3 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-3 bg-gray-100">
              <p className="text-sm text-gray-500">Typing...</p>
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
        {messages.length > 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleComplete}
            className="mt-2 w-full"
          >
            End Conversation
          </Button>
        )}
      </div>
    </div>
  )
}


