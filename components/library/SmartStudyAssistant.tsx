'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface SmartStudyAssistantProps {
  articleId: string
}

export default function SmartStudyAssistant({ articleId }: SmartStudyAssistantProps) {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleAsk = async () => {
    if (!question.trim()) return

    setLoading(true)
    const userQuestion = question
    setQuestion('')
    setConversation(prev => [...prev, { role: 'user', content: userQuestion }])

    try {
      const session = await supabase.auth.getSession()
      
      const response = await fetch('/api/ai/study-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          articleId,
          userQuestion,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const { answer } = await response.json()
      setConversation(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (error) {
      console.error('Error asking study assistant:', error)
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-900">
        Query Assistant
      </div>
      <div className="text-sm text-gray-600">
        Ask clarifying questions about this document. Responses are based solely on the article content.
      </div>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {conversation.map((message, index) => (
            <Card key={index} className={`p-3 ${message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                {message.role === 'user' ? 'You' : 'Query Assistant'}
              </p>
              <p className="text-sm text-gray-700">{message.content}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2">
        <Textarea
          placeholder="Ask a clarifying question. Precision is key."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAsk()
            }
          }}
          rows={3}
        />
        <Button 
          onClick={handleAsk} 
          disabled={loading || !question.trim()}
          className="w-full"
        >
          {loading ? 'Thinking...' : 'Ask Question'}
        </Button>
      </div>
    </div>
  )
}


