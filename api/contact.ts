import type { VercelRequest, VercelResponse } from '@vercel/node'
import { captureException } from './_sentry'
import { validateContact, type ContactData } from '../shared/validation'

/**
 * Contact form endpoint.
 *
 * Same-origin, so there is no CORS handling here on purpose. If this ever needs
 * to be called from another domain, that is a deliberate change, not a default.
 *
 * Nothing heavy is imported at module scope. An import that throws while the
 * module loads kills the function before any handler code runs, which shows up
 * in Vercel as FUNCTION_INVOCATION_FAILED with no log line to explain it. That
 * already happened once here with @sentry/node, so everything below stays on
 * fetch and the standard library.
 */

/** Report to Sentry if it is configured, and always leave a trace in the logs. */
async function report(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  console.error('[contact]', error instanceof Error ? (error.stack ?? error.message) : error, context)
  await captureException(error, context)
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
  // Wraps the whole handler. Anything unexpected becomes a logged stack and a
  // 500, instead of an opaque crash with nothing in the Vercel logs.
  try {
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
      await report(error, { stage: 'telegram', email: result.data.email })
      // The submission was valid. The failure is mine, so say so and give them a way out.
      return res.status(502).json({
        ok: false,
        error: 'Could not deliver your message. Please email me directly.',
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    await report(error, { stage: 'handler', method: req.method })
    return res.status(500).json({
      ok: false,
      error: 'Something went wrong on my side. Please email me directly.',
    })
  }
}
