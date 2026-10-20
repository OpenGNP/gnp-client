import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CreateFormCard } from '../src/components/forms/CreateFormCard'
import { emptyFormEditorModel, type FormEditorModel } from '../src/hooks/useFormEditorModel'

function Harness() {
  const [model, setModel] = useState<FormEditorModel>({
    ...emptyFormEditorModel,
    feedback: [
      { id: 'q1', type: 'text', question: 'What went well?', required: true, answerLength: 'long' },
      { id: 'q2', type: 'choice', question: 'Pick one', required: false, options: ['Yes', 'No'], allowMultiple: false, hasOther: true },
    ],
  } as FormEditorModel)
  return <CreateFormCard onChange={(partial) => setModel((current) => ({ ...current, ...partial }))} value={model} />
}

const questionInputs = () => screen.queryAllByPlaceholderText('Question')

describe('question cards', () => {
  it('start as compact previews, with no editing fields', () => {
    render(<Harness />)
    expect(questionInputs()).toHaveLength(0)
    expect(screen.getByRole('button', { name: /^What went well\?/ })).toBeInTheDocument()
    expect(screen.getByText('Long answer')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('open one at a time when clicked', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^What went well\?/ }))
    expect(questionInputs().map((input) => (input as HTMLInputElement).value)).toEqual(['What went well?'])

    await user.click(screen.getByRole('button', { name: 'Pick one' }))
    expect(questionInputs().map((input) => (input as HTMLInputElement).value)).toEqual(['Pick one'])
  })

  it('closes the open card on a click outside it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^What went well\?/ }))
    expect(questionInputs()).toHaveLength(1)
    await user.click(screen.getByRole('heading', { name: 'Feedback' }))
    expect(questionInputs()).toHaveLength(0)
  })

  it('opens a newly added question straight away', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const feedback = screen.getByRole('region', { name: 'Feedback' })
    await user.click(within(feedback).getByRole('button', { name: 'Add new question' }))
    await user.click(within(feedback).getByRole('menuitem', { name: 'Text' }))
    expect(questionInputs().map((input) => (input as HTMLInputElement).value)).toEqual([''])
  })
})
