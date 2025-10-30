'use client'

import { ChallengeBlock } from '@/lib/case-study-store'
import AIPersonaChatBlock from '../blocks/AIPersonaChatBlock'
import DocumentViewerBlock from '../blocks/DocumentViewerBlock'
import FinancialModelBlock from '../blocks/FinancialModelBlock'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import RichTextEditorBlock from '../blocks/RichTextEditorBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'
import TimerBlock from '../blocks/TimerBlock'

interface NegotiationLayoutProps {
  challengeData: {
    blocks?: ChallengeBlock[]
    prompt?: string
    personas?: Array<{
      name: string
      role: string
      description: string
    }>
    fileIds?: string[]
    timeLimit?: number
    [key: string]: any
  }
}

const challengeBlockMap = {
  PROMPT_BOX: PromptBoxBlock,
  RICH_TEXT_EDITOR: RichTextEditorBlock,
  SUBMIT_BUTTON: SubmitButtonBlock,
  DOCUMENT_VIEWER: DocumentViewerBlock,
  FINANCIAL_MODEL: FinancialModelBlock,
  AI_PERSONA_CHAT: AIPersonaChatBlock,
  TIMER: TimerBlock,
}

export default function NegotiationLayout({ challengeData }: NegotiationLayoutProps) {
  const { 
    blocks = [], 
    prompt, 
    personas = [],
    fileIds = [],
    timeLimit
  } = challengeData

  // If no blocks defined, create default layout
  const defaultBlocks: ChallengeBlock[] = blocks.length > 0 ? blocks : [
    {
      blockId: 'challenge_prompt',
      blockType: 'PROMPT_BOX',
      props: {
        title: 'Negotiation Challenge',
        content: prompt || 'Engage in strategic negotiations with key stakeholders to achieve your objectives.',
        type: 'challenge',
        metadata: {
          difficulty: 'advanced',
          timeLimit: timeLimit
        }
      }
    },
    ...(timeLimit ? [{
      blockId: 'timer',
      blockType: 'TIMER',
      props: {
        title: 'Negotiation Timer',
        durationMinutes: timeLimit,
        autoStart: false,
        showControls: true,
        warningThreshold: 5
      }
    }] : []),
    ...(fileIds.length > 0 ? [{
      blockId: 'case_materials',
      blockType: 'DOCUMENT_VIEWER',
      props: {
        title: 'Background Materials',
        fileIds: fileIds,
        showTabs: true
      }
    }] : []),
    ...personas.map((persona, index) => ({
      blockId: `persona_${index}`,
      blockType: 'AI_PERSONA_CHAT',
      props: {
        title: `Negotiate with ${persona.name}`,
        personaName: persona.name,
        personaRole: persona.role,
        personaDescription: persona.description,
        initialMessage: `Hello, I'm ${persona.name}, ${persona.role}. I understand we need to discuss some important matters. What would you like to talk about?`,
        maxMessages: 20,
        placeholder: `Type your message to ${persona.name}...`
      }
    })),
    {
      blockId: 'strategy_notes',
      blockType: 'RICH_TEXT_EDITOR',
      props: {
        title: 'Negotiation Strategy & Outcomes',
        maxLength: 8000,
        minLength: 500,
        placeholder: 'Document your negotiation strategy and outcomes here:\n\n1. PREPARATION:\n- What were your key objectives?\n- What was your BATNA (Best Alternative to Negotiated Agreement)?\n- What did you learn about each stakeholder\'s interests?\n\n2. NEGOTIATION PROCESS:\n- What tactics did you use?\n- How did each stakeholder respond?\n- What concessions were made by each party?\n\n3. OUTCOMES:\n- What agreements were reached?\n- How well did you achieve your objectives?\n- What would you do differently next time?\n\n4. STRATEGIC INSIGHTS:\n- What did you learn about stakeholder management?\n- How did this negotiation affect broader business relationships?\n- What are the implications for future decisions?',
        showWordCount: true,
        autoSave: true
      }
    },
    {
      blockId: 'submit_negotiation',
      blockType: 'SUBMIT_BUTTON',
      props: {
        label: 'Submit Negotiation Results',
        confirmationMessage: 'Ready to submit your negotiation outcomes? Ensure you\'ve documented your strategy, process, and results.',
        requiresValidation: true,
        validationRules: {
          requiredBlocks: ['strategy_notes'],
          minWordCount: 500
        }
      }
    }
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context and Materials */}
        <div className="lg:col-span-1 space-y-6">
          {defaultBlocks
            .filter(block => ['challenge_prompt', 'timer', 'case_materials'].includes(block.blockId))
            .map((block) => {
              const BlockComponent = challengeBlockMap[block.blockType as keyof typeof challengeBlockMap]
              
              if (!BlockComponent) {
                console.warn(`Unknown block type: ${block.blockType}`)
                return null
              }

              return (
                <BlockComponent
                  key={block.blockId}
                  blockId={block.blockId}
                  {...(block.props as any)}
                />
              )
            })}
        </div>

        {/* Middle Column: Negotiations */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Stakeholder Negotiations</h3>
            {defaultBlocks
              .filter(block => block.blockId.startsWith('persona_'))
              .map((block) => {
                const BlockComponent = challengeBlockMap[block.blockType as keyof typeof challengeBlockMap]
                
                if (!BlockComponent) {
                  console.warn(`Unknown block type: ${block.blockType}`)
                  return null
                }

                return (
                  <BlockComponent
                    key={block.blockId}
                    blockId={block.blockId}
                    {...(block.props as any)}
                  />
                )
              })}
          </div>
        </div>

        {/* Right Column: Strategy and Submission */}
        <div className="lg:col-span-1 space-y-6">
          {defaultBlocks
            .filter(block => ['strategy_notes', 'submit_negotiation'].includes(block.blockId))
            .map((block) => {
              const BlockComponent = challengeBlockMap[block.blockType as keyof typeof challengeBlockMap]
              
              if (!BlockComponent) {
                console.warn(`Unknown block type: ${block.blockType}`)
                return null
              }

              return (
                <BlockComponent
                  key={block.blockId}
                  blockId={block.blockId}
                  {...(block.props as any)}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}
