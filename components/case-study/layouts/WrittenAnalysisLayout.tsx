'use client'

import { ChallengeBlock } from '@/lib/case-study-store'
import DocumentViewerBlock from '../blocks/DocumentViewerBlock'
import FinancialModelBlock from '../blocks/FinancialModelBlock'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import RichTextEditorBlock from '../blocks/RichTextEditorBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'

interface WrittenAnalysisLayoutProps {
  challengeData: {
    blocks?: ChallengeBlock[]
    prompt?: string
    title?: string
    wordLimit?: number
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

export default function WrittenAnalysisLayout({ challengeData }: WrittenAnalysisLayoutProps) {
  const { blocks = [], prompt, wordLimit = 1500 } = challengeData

  // If no blocks defined, create default layout
  const defaultBlocks: ChallengeBlock[] = blocks.length > 0 ? blocks : [
    {
      blockId: 'prompt',
      blockType: 'PROMPT_BOX',
      props: {
        title: 'Objective',
        content: prompt || 'Analyze the provided case materials and produce a comprehensive assessment.',
        type: 'objective'
      }
    },
    {
      blockId: 'editor',
      blockType: 'RICH_TEXT_EDITOR',
      props: {
        title: 'Analysis',
        maxLength: wordLimit * 6, // Rough character estimate
        minLength: Math.floor(wordLimit * 0.7), // 70% of target
        placeholder: 'Analyze the provided data. Reference specific data points and case materials to support your arguments.',
        showWordCount: true,
        autoSave: true
      }
    },
    {
      blockId: 'submit',
      blockType: 'SUBMIT_BUTTON',
      props: {
        label: 'Submit Analysis',
        confirmationMessage: 'Confirm submission. This action cannot be undone.',
        requiresValidation: true,
        validationRules: {
          requiredBlocks: ['editor'],
          minWordCount: Math.floor(wordLimit * 0.7)
        }
      }
    }
  ]

  return (
    <div className="w-full space-y-8">
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
  )
}
