import { useId, useRef, useState } from 'react'
import { Button, ButtonLink } from '../components/Button'
import { Section } from '../components/Section'
import { contact, site } from '../content'
import { LIMITS, validateContact, type ContactErrors } from '../../shared/validation'

const EMPTY = { name: '', email: '', company: '', budget: '', message: '' }

type Status = 'idle' | 'sending' | 'sent'

const FIELD_ORDER = ['name', 'email', 'company', 'budget', 'message'] as const

export function Contact() {
  const formId = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  const fieldId = (name: string) => `${formId}-${name}`
  const errorId = (name: string) => `${formId}-${name}-error`

  /** Move focus to the first thing that is wrong, so the error is not just announced but reachable. */
  const focusFirstError = (found: ContactErrors) => {
    const first = FIELD_ORDER.find((name) => found[name])
    if (!first) return
    formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(first))}`)?.focus()
  }

  const update = (name: keyof typeof EMPTY) => (value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear a field's error as soon as the user edits it; re-checked on submit.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    // Same validator the endpoint runs. This only saves a round trip; the
    // server's answer is the one that decides.
    const local = validateContact(values)
    if (!local.ok) {
      setErrors(local.errors)
      focusFirstError(local.errors)
      return
    }

    setStatus('sending')
    setErrors({})

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local.data),
      })
      const payload = await response.json().catch(() => null)

      if (response.ok && payload?.ok) {
        setStatus('sent')
        setValues(EMPTY)
        return
      }

      setStatus('idle')
      const returned: ContactErrors = payload?.errors ?? {}
      const next = Object.keys(returned).length
        ? returned
        : { form: payload?.error ?? contact.errorGeneric }
      setErrors(next)
      focusFirstError(next)
    } catch {
      setStatus('idle')
      setErrors({ form: contact.errorGeneric })
    }
  }

  return (
    <Section id="contact" heading={contact.heading} intro={contact.intro} tone="raise">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <h3 className="font-semibold">{contact.formTitle}</h3>

          {status === 'sent' ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-accent bg-page p-4 text-small"
            >
              {contact.success}
            </p>
          ) : null}

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-4 grid gap-5">
            {/* Form-level failure: the submission was fine but delivery was not. */}
            {errors.form ? (
              <p role="alert" className="rounded-lg border border-line-strong bg-page p-4 text-small">
                {errors.form}
              </p>
            ) : null}

            <Field
              id={fieldId('name')}
              errorId={errorId('name')}
              label="Your name"
              error={errors.name}
              value={values.name}
              onChange={update('name')}
              autoComplete="name"
              maxLength={LIMITS.name.max}
              required
            />
            <Field
              id={fieldId('email')}
              errorId={errorId('email')}
              label="Email"
              type="email"
              error={errors.email}
              value={values.email}
              onChange={update('email')}
              autoComplete="email"
              maxLength={LIMITS.email.max}
              required
            />
            <Field
              id={fieldId('company')}
              errorId={errorId('company')}
              label="Company"
              hint="Optional"
              error={errors.company}
              value={values.company}
              onChange={update('company')}
              autoComplete="organization"
              maxLength={LIMITS.company.max}
            />

            <div>
              <Label htmlFor={fieldId('budget')} text="Budget" hint="Optional" />
              <select
                id={fieldId('budget')}
                name="budget"
                value={values.budget}
                onChange={(event) => update('budget')(event.target.value)}
                aria-invalid={errors.budget ? true : undefined}
                aria-describedby={errors.budget ? errorId('budget') : undefined}
                className="mt-2 w-full rounded-md border border-line-strong bg-page px-3 py-2.5 text-body"
              >
                <option value="">No preference</option>
                {contact.budgets.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget}
                  </option>
                ))}
              </select>
              <FieldError id={errorId('budget')} message={errors.budget} />
            </div>

            <div>
              <Label htmlFor={fieldId('message')} text="What are you building?" />
              <textarea
                id={fieldId('message')}
                name="message"
                rows={5}
                value={values.message}
                onChange={(event) => update('message')(event.target.value)}
                maxLength={LIMITS.message.max}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? errorId('message') : undefined}
                className="mt-2 w-full rounded-md border border-line-strong bg-page px-3 py-2.5 text-body"
              />
              <FieldError id={errorId('message')} message={errors.message} />
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending' : 'Send'}
              </Button>
              {/* Announced without stealing focus from the form. */}
              <span aria-live="polite" className="text-small text-muted">
                {status === 'sending' ? 'Sending your message' : ''}
              </span>
            </div>
          </form>
        </div>

        <div className="grid content-start gap-6">
          <div className="rounded-lg border border-line bg-page p-6">
            <h3 className="font-semibold">{contact.calendlyTitle}</h3>
            <p className="mt-2 text-small text-muted">{contact.calendlyBody}</p>
            <ButtonLink
              href={site.calendly}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 w-full"
            >
              Pick a time
            </ButtonLink>
          </div>

          <div className="rounded-lg border border-line bg-page p-6">
            <h3 className="font-semibold">{contact.whatsappTitle}</h3>
            <p className="mt-2 text-small text-muted">{contact.whatsappBody}</p>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              {site.whatsappDisplay}
            </a>
          </div>

          <div className="rounded-lg border border-line bg-page p-6">
            <h3 className="font-semibold">{contact.emailTitle}</h3>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-block font-medium break-all text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Label({ htmlFor, text, hint }: { htmlFor: string; text: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-small font-medium">
      {text}
      {hint ? <span className="ml-2 font-normal text-muted">{hint}</span> : null}
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-2 text-small text-ink">
      {message}
    </p>
  )
}

function Field({
  id,
  errorId,
  label,
  hint,
  error,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  id: string
  errorId: string
  label: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string) => void
  type?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type' | 'id'>) {
  return (
    <div>
      <Label htmlFor={id} text={label} hint={hint} />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 w-full rounded-md border border-line-strong bg-page px-3 py-2.5 text-body"
        {...rest}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
