// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Contact } from './Contact'
import { contact } from '../content'
import { LIMITS } from '../../shared/validation'

const VALID = {
  name: 'Test Person',
  email: 'test@example.com',
  company: 'Example Ltd',
  budget: '$700 to $1,500',
  message: 'I need a small store for handmade candles, about twenty products.',
}

function fill(overrides: Partial<typeof VALID> = {}) {
  const values = { ...VALID, ...overrides }
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: values.name } })
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: values.email } })
  fireEvent.change(screen.getByLabelText(/company/i), { target: { value: values.company } })
  fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: values.budget } })
  fireEvent.change(screen.getByLabelText(/what are you building/i), {
    target: { value: values.message },
  })
}

const submit = async () => {
  await act(async () => {
    fireEvent.submit(screen.getByRole('button', { name: /send/i }).closest('form') as HTMLFormElement)
  })
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('contact form: accessibility', () => {
  beforeEach(() => render(<Contact />))

  it('every control has a programmatic label', () => {
    for (const label of [/your name/i, /^email/i, /company/i, /budget/i, /what are you building/i]) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
  })

  it('takes maxLength from the shared limits, so the form cannot drift from the server', () => {
    expect(screen.getByLabelText(/your name/i).getAttribute('maxLength')).toBe(String(LIMITS.name.max))
    expect(screen.getByLabelText(/^email/i).getAttribute('maxLength')).toBe(String(LIMITS.email.max))
    expect(screen.getByLabelText(/what are you building/i).getAttribute('maxLength')).toBe(
      String(LIMITS.message.max),
    )
  })

  it('offers every budget option from the content, plus an empty default', () => {
    const select = screen.getByLabelText(/budget/i) as HTMLSelectElement
    const values = [...select.options].map((option) => option.value)
    expect(values[0]).toBe('')
    expect(values.slice(1)).toEqual([...contact.budgets])
  })
})

describe('contact form: client validation', () => {
  beforeEach(() => render(<Contact />))

  it('blocks an empty submit and does not call the endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await submit()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/your name/i).getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText(/^email/i).getAttribute('aria-invalid')).toBe('true')
  })

  it('links each error to its field and moves focus to the first one', async () => {
    await submit()
    const name = screen.getByLabelText(/your name/i)
    const describedBy = name.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)?.textContent).toBeTruthy()
    expect(document.activeElement).toBe(name)
  })

  it('rejects a malformed email before sending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fill({ email: 'not-an-email' })
    await submit()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^email/i).getAttribute('aria-invalid')).toBe('true')
  })

  it('clears a field error as soon as that field is edited', async () => {
    await submit()
    const name = screen.getByLabelText(/your name/i)
    expect(name.getAttribute('aria-invalid')).toBe('true')
    fireEvent.change(name, { target: { value: 'Test Person' } })
    expect(name.getAttribute('aria-invalid')).toBeNull()
  })
})

describe('contact form: submission', () => {
  it('posts the validated payload to the endpoint as JSON', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true }, 200))
    render(<Contact />)
    fill()
    await submit()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/contact')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(VALID)
  })

  it('confirms and empties the form on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }, 200))
    render(<Contact />)
    fill()
    await submit()

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(contact.success))
    expect((screen.getByLabelText(/your name/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/what are you building/i) as HTMLTextAreaElement).value).toBe('')
  })

  it('shows field errors returned by the server and focuses the field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ ok: false, errors: { email: 'That domain does not accept mail.' } }, 400),
    )
    render(<Contact />)
    fill()
    await submit()

    const email = screen.getByLabelText(/^email/i)
    await waitFor(() => expect(email.getAttribute('aria-invalid')).toBe('true'))
    expect(
      document.getElementById(email.getAttribute('aria-describedby') as string)?.textContent,
    ).toBe('That domain does not accept mail.')
    expect(document.activeElement).toBe(email)
  })

  it('surfaces a delivery failure as an alert and keeps what was typed', async () => {
    const serverMessage = 'Could not deliver your message. Please email me directly.'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ ok: false, error: serverMessage }, 502),
    )
    render(<Contact />)
    fill()
    await submit()

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(serverMessage))
    // Losing the message on a server fault would be the worst possible moment.
    expect((screen.getByLabelText(/what are you building/i) as HTMLTextAreaElement).value).toBe(
      VALID.message,
    )
  })

  it('falls back to the generic error when the network throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    render(<Contact />)
    fill()
    await submit()

    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(contact.errorGeneric))
  })

  it('does not send twice while a send is in flight', async () => {
    let release: (value: Response) => void = () => {}
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pending)
    render(<Contact />)
    fill()

    await submit()
    await submit()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      release(jsonResponse({ ok: true }, 200))
      await pending
    })
  })
})
