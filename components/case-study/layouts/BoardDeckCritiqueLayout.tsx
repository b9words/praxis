'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingSkeleton from '@/components/ui/loading-skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SlidesRenderer from '@/components/admin/renderers/SlidesRenderer'
import { useCaseFile } from '@/hooks/useCaseFile'
import { ChallengeBlock } from '@/lib/case-study-store'
import { AlertCircle, FileText, MessageSquare } from 'lucide-react'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import RichTextEditorBlock from '../blocks/RichTextEditorBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'

interface BoardDeckCritiqueLayoutProps {
  challengeData: {
    blocks?: ChallengeBlock[]
    prompt?: string
    documentToCritique?: string
    [key: string]: any
  }
}

const challengeBlockMap = {
  PROMPT_BOX: PromptBoxBlock,
  RICH_TEXT_EDITOR: RichTextEditorBlock,
  SUBMIT_BUTTON: SubmitButtonBlock,
}

export default function BoardDeckCritiqueLayout({ challengeData }: BoardDeckCritiqueLayoutProps) {
  const { blocks = [], prompt, documentToCritique } = challengeData
  
  // Load the document to critique
  const documentData = useCaseFile(documentToCritique || '')

  // If no blocks defined, create default layout
  const defaultBlocks: ChallengeBlock[] = blocks.length > 0 ? blocks : [
    {
      blockId: 'prompt',
      blockType: 'PROMPT_BOX',
      props: {
        title: 'Board Presentation Critique',
        content: prompt || 'Review the board presentation and provide detailed, actionable feedback to improve the narrative and strengthen the argument.',
        type: 'info',
        estimatedTime: '45 min',
        difficulty: 'advanced'
      }
    },
    {
      blockId: 'critique',
      blockType: 'RICH_TEXT_EDITOR',
      props: {
        title: 'Critique',
        placeholder: 'Provide at least 8 specific, actionable comments on the presentation. Focus on:\n\n1. Narrative structure and flow\n2. Data presentation and clarity\n3. Addressing potential board objections\n4. Strategic positioning\n5. Financial justification\n6. Risk mitigation\n7. Implementation timeline\n8. Success metrics\n\nFor each comment, specify the slide number and provide concrete suggestions for improvement.',
        minLength: 500,
        maxLength: 5000,
        wordCount: true
      }
    },
    {
      blockId: 'submit',
      blockType: 'SUBMIT_BUTTON',
      props: {
        label: 'Submit Critique',
        confirmationMessage: 'Confirm submission. Ensure you have provided detailed, actionable feedback.',
        requiresValidation: true
      }
    }
  ]

  return (
    <Tabs defaultValue="document" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="document" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Board Presentation
        </TabsTrigger>
        <TabsTrigger value="critique" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Your Critique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="document" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {documentData.fileName || 'Board Presentation'}
            </CardTitle>
            <CardDescription>
              Review this presentation carefully before providing your critique
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentData.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSkeleton className="h-64 w-full" />
              </div>
            ) : documentData.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Error Loading Document</span>
                </div>
                <p className="text-xs text-red-700">{documentData.error}</p>
              </div>
            ) : documentData.fileType === 'PRESENTATION_DECK' && documentData.content ? (
              <SlidesRenderer content={documentData.content} />
            ) : (
              <div className="text-neutral-600 p-4 bg-neutral-50 rounded-lg">
                <p>Document preview not available. Please refer to the document details provided in the case materials.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="critique" className="space-y-6">
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
          title={block.props?.title || 'Block'}
          content={block.props?.content || ''}
          {...block.props}
        />
      )
        })}
      </TabsContent>
    </Tabs>
  )
}
