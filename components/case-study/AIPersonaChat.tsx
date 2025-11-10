'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchJson } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { useMutation } from '@tanstack/react-query'
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
  const supabase = createClient()

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const session = await supabase.auth.getSession()
      return fetchJson<{ reply: string }>(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-persona-chat`, {
        method: 'POST',
        body: {
          caseData,
          personaName,
          personaRole,
          chatHistory: messages,
          userMessage,
        },
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
      })
    },
    onSuccess: (data, userMessage) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    },
    onError: (error) => {
      console.error('Error in AI chat:', error)
      toast.error('Failed to get response. Please try again.')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, I'm having trouble responding right now. Could you rephrase your question?`
      }])
    },
  })

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    sendMessageMutation.mutate(userMessage)
  }

  const loading = sendMessageMutation.isPending

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
            <AvatarFallback className="bg-gray-900 text-white">
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
            <div className={`max-w-[80%] p-3 border border-gray-200 ${
              message.role === 'user' 
                ? 'bg-gray-900 text-white' 
                : 'bg-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 bg-white border border-gray-200">
              <p className="text-sm text-gray-500">Typing...</p>
            </div>
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
            className="rounded-none"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-none bg-gray-900 hover:bg-gray-800 text-white">
            Send
          </Button>
        </div>
        {messages.length > 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleComplete}
            className="mt-2 w-full rounded-none border-gray-300 hover:border-gray-400"
          >
            End Conversation
          </Button>
        )}
      </div>
    </div>
  )
}


