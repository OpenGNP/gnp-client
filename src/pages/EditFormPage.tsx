import { useState } from 'react'

import formArchitecture from '../assets/form-architecture.png'
import { CreateFormCard } from '../components/forms/CreateFormCard'
import { FormSettingsPanel } from '../components/forms/FormSettingsPanel'
import type { Question } from '../components/forms/question-types'
import { FormActionBar } from '../components/navigation/FormActionBar'
import { FormDetailTabs } from '../components/navigation/FormDetailTabs'
import { useAutoSaveStatus } from '../hooks/useAutoSaveStatus'
import { cn } from '../lib/utils'

const demographicSeedQuestions: Question[] = [
  {
    id: 'seed-year-of-study',
    type: 'choice',
    question: 'Year of Study',
    options: ['1st', '2nd', '3rd', '4th'],
    allowMultiple: false,
    hasOther: false,
    required: false,
  },
  {
    id: 'seed-gender',
    type: 'choice',
    question: 'Gender',
    options: ['Male', 'Female'],
    allowMultiple: true,
    hasOther: false,
    required: false,
  },
]

const feedbackSeedQuestions: Question[] = [
  {
    id: 'seed-curriculum',
    type: 'text',
    question: 'What do you think about current curriculum?',
    answerLength: 'long',
    required: false,
  },
  {
    id: 'seed-facility',
    type: 'text',
    question: 'What would you like to share about facility?',
    answerLength: 'long',
    required: false,
  },
]

export type EditFormPageProps = {
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  onMove?: () => void
}

export function EditFormPage({
  showSidebarToggle = false,
  onToggleSidebar,
  onMove,
}: EditFormPageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const saveStatus = useAutoSaveStatus()

  return (
    <div>
      <div className="sticky top-0 z-30 bg-[#f5f9ff]">
        <FormDetailTabs
          onToggleSidebar={onToggleSidebar}
          showSidebarToggle={showSidebarToggle}
        />
        <div className="flex justify-end bg-[#f5f9ff] px-14 py-4 max-[900px]:px-6 max-[560px]:px-4">
          <FormActionBar
            isSettingsOpen={isSettingsOpen}
            mode="edit"
            onMove={onMove}
            onToggleSettings={() => setIsSettingsOpen((open) => !open)}
            saveStatus={saveStatus}
          />
        </div>
      </div>

      <div className="bg-[#f5f9ff] px-14 pb-16 max-[900px]:px-6 max-[560px]:px-4">
        <div
          className={cn(
            'mx-auto flex w-full items-start gap-10.25 max-[1200px]:flex-col max-[1200px]:items-center',
            isSettingsOpen ? 'max-w-[1420px]' : 'max-w-[978px]',
          )}
        >
          <CreateFormCard
            initialCoverImageUrl={formArchitecture}
            initialDemographicQuestions={demographicSeedQuestions}
            initialFeedbackQuestions={feedbackSeedQuestions}
            initialTitle="CS Focus Group Feedback 2026"
          />
          {isSettingsOpen ? (
            <FormSettingsPanel onClose={() => setIsSettingsOpen(false)} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
