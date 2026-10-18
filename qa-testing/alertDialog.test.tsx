import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AlertDialogHost } from '../src/components/AlertDialogHost'
import { showAlert, showConfirm } from '../src/lib/alertDialog'

describe('AlertDialogHost', () => {
  it('shows an alert and resolves once dismissed', async () => {
    render(<AlertDialogHost />)
    let done = false
    act(() => {
      void showAlert('Could not save the form.').then(() => (done = true))
    })
    expect(await screen.findByRole('dialog', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByText('Could not save the form.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(done).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves a confirm true on confirm, false on cancel, one at a time', async () => {
    render(<AlertDialogHost />)
    const answers: boolean[] = []
    act(() => {
      void showConfirm({ title: 'Delete form?', confirmLabel: 'Delete', destructive: true }).then((a) => answers.push(a))
      void showConfirm({ title: 'Delete folder?', confirmLabel: 'Delete' }).then((a) => answers.push(a))
    })
    expect(await screen.findByRole('alertdialog', { name: 'Delete form?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alertdialog', { name: 'Delete folder?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(answers).toEqual([true, false])
  })

  it('keeps confirm disabled until the exact name is typed', async () => {
    render(<AlertDialogHost />)
    let answer: boolean | undefined
    act(() => {
      void showConfirm({ title: 'Delete folder?', confirmLabel: 'Delete', typeToConfirm: '2569' }).then((a) => (answer = a))
    })
    const input = await screen.findByRole('textbox')
    const confirm = screen.getByRole('button', { name: 'Delete' })
    expect(confirm).toBeDisabled()
    await userEvent.type(input, '256')
    expect(confirm).toBeDisabled()
    await userEvent.type(input, '9')
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    expect(answer).toBe(true)
  })
})
