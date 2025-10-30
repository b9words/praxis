'use client'

import { ChallengeBlock, useCaseStudyStore } from '@/lib/case-study-store'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import StrategicOptionsBlock from '../blocks/StrategicOptionsBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'
import CaseDataViewer from '../CaseDataViewer'

interface StrategicOptionsLayoutProps {
  challengeData: {
    blocks?: ChallengeBlock[]
    prompt?: string
    options?: Array<{
      id: string
      title: string
      description: string
    }>
    [key: string]: any
  }
}

const challengeBlockMap = {
  PROMPT_BOX: PromptBoxBlock,
  STRATEGIC_OPTIONS: StrategicOptionsBlock,
  SUBMIT_BUTTON: SubmitButtonBlock,
}

export default function StrategicOptionsLayout({ challengeData }: StrategicOptionsLayoutProps) {
  const { blocks = [], prompt, options = [] } = challengeData
  const { caseStudyData } = useCaseStudyStore()

  // Get all case file IDs for the data viewer
  const caseFileIds = caseStudyData?.caseFiles.map(file => file.fileId) || []

  // If no blocks defined, create default layout
  const defaultBlocks: ChallengeBlock[] = blocks.length > 0 ? blocks : [
    {
      blockId: 'prompt',
      blockType: 'PROMPT_BOX',
      props: {
        title: 'Strategic Decision',
        content: prompt || 'Choose your strategic path from the options below.',
        type: 'info'
      }
    },
    {
      blockId: 'options',
      blockType: 'STRATEGIC_OPTIONS',
      props: {
        options,
        allowMultiple: false,
        required: true
      }
    },
    {
      blockId: 'submit',
      blockType: 'SUBMIT_BUTTON',
      props: {
        label: 'Confirm Strategic Choice',
        confirmationMessage: 'Are you sure about this strategic choice? This decision will influence the rest of the case study.',
        requiresValidation: true
      }
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Case Materials */}
      <div className="space-y-6">
        <CaseDataViewer fileIds={caseFileIds} />
      </div>

      {/* Right Column: Decision Interface */}
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
              {...block.props}
            />
          )
        })}
      </div>
    </div>
  )
}
