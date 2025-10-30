'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCaseFile } from '@/hooks/useCaseFile'
import { ChallengeBlock } from '@/lib/case-study-store'
import { FileText, MessageSquare } from 'lucide-react'
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
        title: 'Your Detailed Critique',
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
        confirmationMessage: 'Are you ready to submit your board presentation critique? Make sure you have provided detailed, actionable feedback.',
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-neutral-600">Loading presentation...</span>
              </div>
            ) : documentData.error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                Error loading document: {documentData.error}
              </div>
            ) : documentData.fileType === 'PRESENTATION_DECK' && documentData.content ? (
              <div className="prose prose-neutral max-w-none">
                <div dangerouslySetInnerHTML={{ __html: documentData.content }} />
              </div>
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
