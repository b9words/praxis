'use client'

import { ChallengeBlock } from '@/lib/case-study-store'
import DocumentViewerBlock from '../blocks/DocumentViewerBlock'
import FinancialModelBlock from '../blocks/FinancialModelBlock'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import RichTextEditorBlock from '../blocks/RichTextEditorBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'

interface FinancialModelingLayoutProps {
  challengeData: {
    blocks?: ChallengeBlock[]
    prompt?: string
    modelType?: 'dcf' | 'lbo' | 'scenario' | 'custom'
    fileIds?: string[]
    [key: string]: any
  }
}

const challengeBlockMap = {
  PROMPT_BOX: PromptBoxBlock,
  RICH_TEXT_EDITOR: RichTextEditorBlock,
  SUBMIT_BUTTON: SubmitButtonBlock,
  DOCUMENT_VIEWER: DocumentViewerBlock,
  FINANCIAL_MODEL: FinancialModelBlock,
}

export default function FinancialModelingLayout({ challengeData }: FinancialModelingLayoutProps) {
  const { 
    blocks = [], 
    prompt, 
    modelType = 'scenario',
    fileIds = []
  } = challengeData

  // If no blocks defined, create default layout
  const defaultBlocks: ChallengeBlock[] = blocks.length > 0 ? blocks : [
    {
      blockId: 'prompt',
      blockType: 'PROMPT_BOX',
      props: {
        title: 'Financial Analysis Challenge',
        content: prompt || 'Build a financial model to analyze the strategic options and provide your recommendation.',
        type: 'challenge',
        metadata: {
          difficulty: 'advanced',
          timeLimit: 45
        }
      }
    },
    {
      blockId: 'documents',
      blockType: 'DOCUMENT_VIEWER',
      props: {
        title: 'Overview',
        fileIds: fileIds,
        showTabs: true
      }
    },
    {
      blockId: 'model',
      blockType: 'FINANCIAL_MODEL',
      props: {
        title: 'Financial Model',
        modelType: modelType,
        requiredFields: ['revenue', 'growthRate', 'discountRate'],
        calculations: {
          futureValue: 'revenue * (1 + growthRate/100)',
          presentValue: 'futureValue / (1 + discountRate/100)'
        }
      }
    },
    {
      blockId: 'analysis',
      blockType: 'RICH_TEXT_EDITOR',
      props: {
        title: 'Strategic Recommendation',
        maxLength: 8000,
        minLength: 500,
        placeholder: 'Based on your financial model, provide your strategic recommendation. Explain your key assumptions, discuss the scenarios you modeled, and justify your final recommendation with specific numbers from your analysis.',
        showWordCount: true,
        autoSave: true
      }
    },
    {
      blockId: 'submit',
      blockType: 'SUBMIT_BUTTON',
      props: {
        label: 'Submit Analysis & Model',
        confirmationMessage: 'Confirm submission. Ensure your model is complete and your recommendation is well-supported.',
        requiresValidation: true,
        validationRules: {
          requiredBlocks: ['model', 'analysis'],
          minWordCount: 500
        }
      }
    }
  ]

  // Render all blocks in order
  return (
    <div className="w-full">
      <div className="space-y-6">
        {defaultBlocks.map((block) => {
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
  )
}
