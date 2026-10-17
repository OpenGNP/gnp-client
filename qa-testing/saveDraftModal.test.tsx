import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SaveDraftModal } from '../src/components/navigation/SaveDraftModal'

function setup(onConfirm: () => Promise<boolean>) {
  const onOpenChange = vi.fn()
  render(<SaveDraftModal mode="save" onConfirm={onConfirm} onOpenChange={onOpenChange} open projects={[]} />)
  return onOpenChange
}

describe('SaveDraftModal while the server answers', () => {
  it('stays open with a spinner and disabled buttons, then closes on success', async () => {
    let finish!: (ok: boolean) => void
    const onOpenChange = setup(() => new Promise((resolve) => (finish = resolve)))

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(onOpenChange).not.toHaveBeenCalled()

    await act(async () => finish(true))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('stays open for a retry when the save fails', async () => {
    const onOpenChange = setup(() => Promise.resolve(false))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('button', { name: 'Save' })).toBeEnabled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
