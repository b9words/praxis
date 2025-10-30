'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { Bot, Send, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIPersonaChatBlockProps {
  blockId: string
  title?: string
  personaName: string
  personaRole: string
  personaDescription: string
  initialMessage?: string
  maxMessages?: number
  placeholder?: string
}

export default function AIPersonaChatBlock({
  blockId,
  title = 'AI Persona Chat',
  personaName,
  personaRole,
  personaDescription,
  initialMessage = `Hello, I'm ${personaName}. How can I help you today?`,
  maxMessages = 20,
  placeholder = 'Type your message...'
}: AIPersonaChatBlockProps) {
  const { getBlockState, updateBlockState, currentStageId } = useCaseStudyStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load existing conversation
  useEffect(() => {
    if (currentStageId) {
      const blockState = getBlockState(currentStageId, blockId)
      if (blockState?.content?.messages) {
        setMessages(blockState.content.messages)
      } else {
        // Initialize with persona's first message
        const initialMsg: Message = {
          id: '1',
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date()
        }
        setMessages([initialMsg])
      }
    }
  }, [currentStageId, blockId, getBlockState, initialMessage])

  // Save conversation to store
  useEffect(() => {
    if (currentStageId && messages.length > 0) {
      updateBlockState(currentStageId, blockId, {
        content: {
          messages,
          messageCount: messages.length,
          lastActivity: new Date().toISOString()
        },
        isValid: messages.length > 1, // Valid if user has sent at least one message
        lastUpdated: new Date().toISOString()
      })
    }
  }, [messages, currentStageId, blockId, updateBlockState])

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI response - in production, this would call OpenAI/Anthropic
    setIsLoading(true)
    
    // Simple response simulation based on persona
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
    
    const responses = [
      `As ${personaRole}, I think ${userMessage.toLowerCase().includes('strategy') ? 'we need to consider the strategic implications carefully' : 'that\'s an interesting point'}.`,
      `From my perspective as ${personaRole}, ${userMessage.toLowerCase().includes('risk') ? 'the risks are significant but manageable' : 'we should explore this further'}.`,
      `In my experience, ${userMessage.toLowerCase().includes('cost') ? 'cost considerations are crucial here' : 'this requires careful analysis'}.`,
      `Let me be direct: ${userMessage.toLowerCase().includes('timeline') ? 'the timeline is aggressive but achievable' : 'I have concerns about this approach'}.`
    ]
    
    setIsLoading(false)
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Generate AI response
    try {
      const aiResponse = await generateAIResponse(userMessage.content)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <CardDescription>
          <div className="space-y-1">
            <div><strong>{personaName}</strong> - {personaRole}</div>
            <div className="text-xs text-neutral-600">{personaDescription}</div>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-96 w-full border rounded-lg p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-neutral-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-neutral-100 text-neutral-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || messages.length >= maxMessages}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || messages.length >= maxMessages}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {messages.length - 1} messages sent • {maxMessages - messages.length} remaining
          </span>
          {messages.length > 1 && (
            <span className="text-green-600 font-medium">
              Conversation active ✓
            </span>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded">
          <strong>Conversation Tips:</strong> Be specific in your questions. This AI persona has knowledge 
          limited to their role and the case context. Ask about their perspective, concerns, and recommendations.
        </div>
      </CardContent>
    </Card>
  )
}
