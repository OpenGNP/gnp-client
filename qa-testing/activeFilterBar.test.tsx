import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { ActiveFilterBar } from '../src/components/dashboard/ActiveFilterBar'
import { DateRangeFilter } from '../src/components/dashboard/DateRangeFilter'

describe('ActiveFilterBar', () => {
  it('renders nothing when no filter is applied', () => {
    const { container } = render(<ActiveFilterBar chips={[]} onClearAll={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names each filter and removes one or all', async () => {
    const user = userEvent.setup()
    const removeFaculty = vi.fn()
    const clearAll = vi.fn()
    render(
      <ActiveFilterBar
        chips={[
          { id: 'faculty', group: 'Faculty', value: 'SIT', onRemove: removeFaculty },
          { id: 'year', group: 'Year', value: '3', onRemove: () => {} },
        ]}
        onClearAll={clearAll}
      />,
    )
    expect(screen.getByRole('region', { name: 'Active filters' })).toHaveTextContent(
      'Faculty:SITYear:3',
    )
    await user.click(screen.getByRole('button', { name: 'Remove Faculty: SIT' }))
    expect(removeFaculty).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(clearAll).toHaveBeenCalledOnce()
  })
})

describe('DateRangeFilter reset ✕', () => {
  const value = { from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z' }

  it('is only offered while a custom range is applied', () => {
    const { rerender } = render(<DateRangeFilter isDefault onReset={() => {}} value={value} />)
    expect(screen.queryByRole('button', { name: /reset date range/i })).not.toBeInTheDocument()
    rerender(<DateRangeFilter isDefault={false} onReset={() => {}} value={value} />)
    expect(screen.getByRole('button', { name: /reset date range/i })).toBeInTheDocument()
  })

  it('resets without opening the picker', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<DateRangeFilter isDefault={false} onReset={onReset} value={value} />)
    await user.click(screen.getByRole('button', { name: /reset date range/i }))
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.queryByText('All feedback')).not.toBeInTheDocument()
  })
})
