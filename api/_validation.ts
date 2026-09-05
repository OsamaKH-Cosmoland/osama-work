/**
 * Contact form validation.
 *
 * Pure and dependency-free on purpose: the serverless function and the React
 * form both import it, and the tests run it without a browser or a server.
 * Server-side validation is the one that counts. The client copy is only there
 * to save the user a round trip.
 */

export const BUDGET_OPTIONS = [
  'Under $700',
  '$700 to $1,500',
  '$1,500 to $3,000',
  'Over $3,000',
  'Not sure yet',
] as const

export type BudgetOption = (typeof BUDGET_OPTIONS)[number]

/** Shared with the form so maxLength attributes cannot drift from the server. */
export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  company: { max: 100 },
  message: { min: 10, max: 2000 },
} as const

export interface ContactData {
  name: string
  email: string
  company: string
  budget: string
  message: string
}

export type ContactErrors = Partial<Record<keyof ContactData | 'form', string>>

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; errors: ContactErrors }

/**
 * Deliberately not RFC 5322. That grammar accepts addresses no mail server
 * will take, and rejecting a real address is worse than accepting a fake one
 * that simply never replies. Requires a dot in the domain and no whitespace.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** Control characters, including the ones that could forge lines in a Telegram message. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

/** Same, but tab, newline and carriage return survive so the message keeps its shape. */
const MESSAGE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/** Strip control characters, collapse runs of whitespace, trim the ends. */
function clean(value: string): string {
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function validateContact(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { form: 'Expected a JSON object.' } }
  }

  const raw = input as Record<string, unknown>
  const errors: ContactErrors = {}

  // Name
  const nameInput = asString(raw.name)
  const name = nameInput === null ? '' : clean(nameInput)
  if (!name) {
    errors.name = 'Your name is required.'
  } else if (name.length < LIMITS.name.min) {
    errors.name = `Name must be at least ${LIMITS.name.min} characters.`
  } else if (name.length > LIMITS.name.max) {
    errors.name = `Name must be ${LIMITS.name.max} characters or fewer.`
  }

  // Email
  const emailInput = asString(raw.email)
  const email = emailInput === null ? '' : emailInput.trim().toLowerCase()
  if (!email) {
    errors.email = 'Your email is required.'
  } else if (email.length > LIMITS.email.max) {
    errors.email = 'That email address is too long.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'That does not look like an email address.'
  }

  // Company (optional)
  const companyInput = asString(raw.company)
  const company = companyInput === null ? '' : clean(companyInput)
  if (company.length > LIMITS.company.max) {
    errors.company = `Company must be ${LIMITS.company.max} characters or fewer.`
  }

  // Budget (optional, but must be one of the offered options if sent)
  const budgetInput = asString(raw.budget)
  const budget = budgetInput === null ? '' : budgetInput.trim()
  if (budget && !(BUDGET_OPTIONS as readonly string[]).includes(budget)) {
    errors.budget = 'Pick one of the listed budget ranges.'
  }

  // Message. Newlines are kept, so only control characters are stripped.
  const messageInput = asString(raw.message)
  const message =
    messageInput === null
      ? ''
      : messageInput.replace(MESSAGE_CONTROL_CHARS, '').trim()
  if (!message) {
    errors.message = 'Tell me a little about the project.'
  } else if (message.length < LIMITS.message.min) {
    errors.message = `Message must be at least ${LIMITS.message.min} characters.`
  } else if (message.length > LIMITS.message.max) {
    errors.message = `Message must be ${LIMITS.message.max} characters or fewer.`
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  // Rebuilt field by field so unknown keys in the request never reach Telegram.
  return { ok: true, data: { name, email, company, budget, message } }
}
