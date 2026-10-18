import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { SpecificPeopleField } from '../src/components/forms/SpecificPeopleField'
import { parseEmails } from '../src/lib/emailList'

describe('parseEmails', () => {
  it('splits Excel columns, comma lists and Outlook names', () => {
    expect(parseEmails('a@kmutt.ac.th\nb@kmutt.ac.th\r\nc@gmail.com').valid).toEqual([
      'a@kmutt.ac.th',
      'b@kmutt.ac.th',
      'c@gmail.com',
    ])
    expect(parseEmails('Somchai Jaidee <somchai@kmutt.ac.th>; x@y.co').valid).toEqual(['somchai@kmutt.ac.th', 'x@y.co'])
    expect(parseEmails('ok@a.com, broken@, nope').invalid).toEqual(['broken@'])
  })
})

function Field() {
  const [emails, setEmails] = useState<string[]>(['a@kmutt.ac.th'])
  return <SpecificPeopleField emails={emails} onChange={setEmails} />
}

describe('SpecificPeopleField paste', () => {
  it('adds every pasted email, skipping ones already there', () => {
    render(<Field />)
    fireEvent.paste(screen.getByPlaceholderText('Enter or paste emails'), {
      clipboardData: { getData: () => 'A@kmutt.ac.th\nb@kmutt.ac.th\nc@kmutt.ac.th' },
    })
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'a@kmutt.ac.th',
      'b@kmutt.ac.th',
      'c@kmutt.ac.th',
    ])
  })
})
