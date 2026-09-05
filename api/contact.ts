import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as Sentry from '@sentry/node'
import { validateContact, type ContactData } from '../shared/validation'

/**
 * Contact form endpoint.
 *
 * Same-origin, so there is no CORS handling here on purpose. If this ever needs
 * to be called from another domain, that is a deliberate change, not a default.
 */

const SENTRY_DSN = process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? 'development',
    // No performance tracing on a form endpoint. Errors are the whole point.
    tracesSampleRate: 0,
  })
}

/** Report to Sentry if it is configured, and always leave a trace in the logs. */
function report(error: unknown, context: Record<string, unknown> = {}): void {
  console.error('[contact]', error, context)
  if (!SENTRY_DSN) return
  Sentry.withScope((scope) => {
    scope.setContext('contact', context)
    Sentry.captureException(error)
  })
}

/**
 * Plain text, no parse_mode. Telegram's Markdown and HTML modes both need the
 * payload escaped, and a stranger's message is the worst place to get that
 * wrong. Plain text cannot be broken by anything a visitor types.
 */
function formatNotification(data: ContactData): string {
  return [
    'New enquiry from work.naturagloss.com',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company || '(not given)'}`,
    `Budget: ${data.budget || '(not given)'}`,
    '',
    'Message:',
    data.message,
  ].join('\n')
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set')
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    // Read the body for the reason, but never let the token reach a log.
    const detail = await response.text().catch(() => '')
    throw new Error(`Telegram responded ${response.status}: ${detail.slice(0, 300)}`)
  }
}

/** Vercel parses JSON bodies, but be tolerant of a raw string body too. */
function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  }

  const result = validateContact(parseBody(req.body))

  if (!result.ok) {
    // A rejected form is normal traffic, not an incident. Nothing goes to Sentry.
    return res.status(400).json({ ok: false, errors: result.errors })
  }

  try {
    await sendTelegram(formatNotification(result.data))
  } catch (error) {
    report(error, { email: result.data.email, company: result.data.company })
    if (SENTRY_DSN) await Sentry.flush(2000)
    // The submission was valid. The failure is mine, so say so and give them a way out.
    return res.status(502).json({
      ok: false,
      error: 'Could not deliver your message. Please email me directly.',
    })
  }

  return res.status(200).json({ ok: true })
}
