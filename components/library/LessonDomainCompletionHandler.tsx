'use client'

import { useState } from 'react'
import DomainCompletionModal from './DomainCompletionModal'
import ProgressTracker from './ProgressTracker'

interface LessonDomainCompletionHandlerProps {
  userId: string
  domainId: string
  moduleId: string
  lessonId: string
  domainTitle: string
  initialProgress?: number
  initialStatus?: 'not_started' | 'in_progress' | 'completed'
  initialTimeSpent?: number
  initialScrollPosition?: number
}

export default function LessonDomainCompletionHandler({
  userId,
  domainId,
  moduleId,
  lessonId,
  domainTitle,
  initialProgress,
  initialStatus,
  initialTimeSpent,
  initialScrollPosition,
}: LessonDomainCompletionHandlerProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleDomainCompleted = ({ domainId }: { domainId: string }) => {
    setModalOpen(true)
  }

  return (
    <>
      <ProgressTracker
        userId={userId}
        domainId={domainId}
        moduleId={moduleId}
        lessonId={lessonId}
        initialProgress={initialProgress}
        initialStatus={initialStatus}
        initialTimeSpent={initialTimeSpent}
        initialScrollPosition={initialScrollPosition}
        onDomainCompleted={handleDomainCompleted}
      />
      <DomainCompletionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        domainTitle={domainTitle}
        certificateUrl={`/certificates/${domainId}`}
      />
    </>
  )
}






