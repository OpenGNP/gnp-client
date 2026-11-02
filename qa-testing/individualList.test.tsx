import { render, screen } from '@testing-library/react'

import type { IndividualResponse } from '../src/api/analytics'
import { IndividualResponseList } from '../src/components/dashboard/IndividualResponseList'

const response = (id: number): IndividualResponse => ({ id, number: id, submittedAt: null, respondentName: null, answers: {} })

describe('Individual response list', () => {
  it('counts every response, and the matches while searching', () => {
    const props = {
      labels: new Map([[2, 'Response #2'], [1, 'Response #1']]),
      onQueryChange: () => {},
      onSelect: () => {},
      selectedId: null,
      total: 2,
    }
    const { rerender } = render(
      <IndividualResponseList {...props} query="" results={[2, 1].map((id) => ({ response: response(id), snippet: null }))} />,
    )
    expect(screen.getByText('2 responses')).toBeInTheDocument()
    rerender(<IndividualResponseList {...props} query="#2" results={[{ response: response(2), snippet: null }]} />)
    expect(screen.getByText('1 of 2 responses')).toBeInTheDocument()
  })
})
