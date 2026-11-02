import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { IndividualField, IndividualResponse } from '../src/api/analytics'
import { ResponseDetailPanel } from '../src/components/dashboard/ResponseDetailPanel'

const fields: IndividualField[] = [{ id: 1, title: 'Any other feedback?', section: 'feedback', type: 'textarea' }]
const base: IndividualResponse = { id: 7, number: 7, submittedAt: null, respondentName: null, answers: { 1: ['Wi-Fi drops.'] } }

function renderPanel(response: IndividualResponse, onOpenTopic = () => {}) {
  render(
    <ResponseDetailPanel
      fields={fields}
      hideNames
      index={0}
      label="Response #7"
      layout={{ mode: 'docked' } as never}
      onClose={() => {}}
      onNext={() => {}}
      onOpenTopic={onOpenTopic}
      onPrevious={() => {}}
      openableTopicIds={new Set(['10'])}
      query=""
      response={response}
      total={1}
    />,
  )
}

describe('Response panel AI analysis', () => {
  it('shows each point with sentiment, flag and topic, and opens a topic in Themes', async () => {
    const opened: string[] = []
    renderPanel(
      {
        ...base,
        points: [
          { topicId: '10', topic: 'Wi-Fi', sentiment: 'negative', violation: true, text: 'Wi-Fi drops.' },
          { topicId: '99', topic: 'Old topic', sentiment: 'neutral', violation: false, text: 'Rooms are fine.' },
        ],
      },
      (id) => opened.push(id),
    )
    expect(screen.getByText('Flagged')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Wi-Fi' }))
    expect(opened).toEqual(['10'])
    // Not in the Themes list right now: named, but not a link.
    expect(screen.queryByRole('button', { name: 'Old topic' })).not.toBeInTheDocument()
    expect(screen.getByText('Old topic')).toBeInTheDocument()
  })

  it('folds away, and stays folded for the next response', async () => {
    window.localStorage.clear()
    const point = { topicId: '10', topic: 'Wi-Fi', sentiment: 'negative' as const, violation: false, text: 'Wi-Fi drops.' }
    renderPanel({ ...base, points: [point] })
    expect(screen.getByText('“Wi-Fi drops.”')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /AI analysis/ }))
    expect(screen.queryByText('“Wi-Fi drops.”')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('gnp.responsePanel.aiAnalysisOpen')).toBe('0')
    window.localStorage.clear()
  })

  it('says when written feedback is still waiting for analysis', () => {
    renderPanel({ ...base, points: [] })
    expect(screen.getByText('Not analysed yet.')).toBeInTheDocument()
  })

  it('shows no section for servers that send no points', () => {
    renderPanel(base)
    expect(screen.queryByText('AI analysis')).not.toBeInTheDocument()
  })
})
