'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface EmbeddedQuizProps {
  questions: QuizQuestion[]
}

export default function EmbeddedQuiz({ questions }: EmbeddedQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({})

  const handleSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
    setShowFeedback(prev => ({ ...prev, [questionId]: true }))
  }

  const isCorrect = (question: QuizQuestion, selectedIndex: number) => {
    return selectedIndex === question.correctAnswer
  }

  return (
    <div className="my-6 border border-neutral-200 bg-white rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          Check Your Understanding
        </h3>
      </div>
      <div className="space-y-6">
        {questions.map((question, qIndex) => {
          const selectedIndex = selectedAnswers[question.id]
          const feedbackShown = showFeedback[question.id]
          const isQuestionCorrect = selectedIndex !== undefined && isCorrect(question, selectedIndex)

          return (
            <div key={question.id} className="border-b border-neutral-100 last:border-b-0 pb-6 last:pb-0">
              <p className="text-sm font-medium text-neutral-900 mb-3">
                {qIndex + 1}. {question.question}
              </p>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedIndex === optionIndex
                  const isCorrectOption = optionIndex === question.correctAnswer
                  const showCorrect = feedbackShown && isCorrectOption
                  const showIncorrect = feedbackShown && isSelected && !isCorrectOption

                  return (
                    <button
                      key={optionIndex}
                      onClick={() => handleSelect(question.id, optionIndex)}
                      disabled={feedbackShown}
                      className={`w-full text-left p-3 rounded border text-sm transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 font-medium'
                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                      } ${
                        showCorrect ? 'bg-green-50 border-green-300' : ''
                      } ${
                        showIncorrect ? 'bg-red-50 border-red-300' : ''
                      } ${
                        feedbackShown ? 'cursor-default' : 'cursor-pointer'
                      } disabled:opacity-100`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-neutral-400'
                        } ${
                          showCorrect ? 'border-green-600 bg-green-600' : ''
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                          {showCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="flex-1 text-neutral-800">{option}</span>
                        {showIncorrect && (
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {feedbackShown && (
                <div className={`mt-3 p-3 rounded text-xs ${
                  isQuestionCorrect
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {isQuestionCorrect ? (
                    <span className="font-medium">✓ Correct! Well done.</span>
                  ) : (
                    <span>Not quite. The correct answer is: <strong>{question.options[question.correctAnswer]}</strong></span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

