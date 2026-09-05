import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { ContactData } from './_validation'

/**
 * Contact form endpoint.
 *
 * Same-origin, so there is no CORS handling here on purpose. If this ever needs
 * to be called from another domain, that is a deliberate change, not a default.
 *
 * Nothing is imported at module scope except types, which are erased at build
 * time. That is deliberate. An import that throws while the module loads kills
 * the function before any handler code runs, and Vercel reports that as
 * FUNCTION_INVOCATION_FAILED with no log line to explain it. Two separate
 * outages here started that way. Every real import happens inside the handler,
 * inside a try/catch, so a failure becomes a logged stack instead of a crash.
 *
 * A GET is the cheapest probe: it returns 405 without importing anything. If a
 * GET returns 405 but a POST fails, the problem is in the imports, and the log
 * will name which one.
 */

/** Report to Sentry if it is configured, and always leave a trace in the logs. */
async function report(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  console.error(
    '[contact]',
    error instanceof Error ? (error.stack ?? error.message) : error,
    context,
  )
  try {
    const { captureException } = await import('./_sentry.js')
    await captureException(error, context)
  } catch (importError) {
    // Reporting is best effort. Never let it become the failure.
    console.error('[contact] could not load the error reporter:', importError)
  }
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

/**
 * Temporary debugging aid.
 *
 * With DEBUG_ERRORS=1 in the environment, error responses carry the message and
 * stack so they can be read straight from a curl response instead of hunting
 * through the logs. Off by default and deliberately opt-in: this endpoint is
 * public, and stack traces should never be served to strangers.
 */
function withDebug(payload: Record<string, unknown>, error: unknown): Record<string, unknown> {
  if (process.env.DEBUG_ERRORS !== '1') return payload
  return {
    ...payload,
    debug: {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: unknown })?.code,
      stack: error instanceof Error ? error.stack : undefined,
    },
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

    // Imported here rather than at module scope so a resolution failure is
    // catchable and nameable instead of killing the function on load.
    let validateContact: typeof import('./_validation').validateContact
    try {
      ;({ validateContact } = await import('./_validation.js'))
    } catch (error) {
      await report(error, { stage: 'import', module: './_validation.js' })
      return res
        .status(500)
        .json(
          withDebug(
            { ok: false, error: 'Something went wrong on my side. Please email me directly.' },
            error,
          ),
        )
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
      return res
        .status(502)
        .json(
          withDebug(
            { ok: false, error: 'Could not deliver your message. Please email me directly.' },
            error,
          ),
        )
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    await report(error, { stage: 'handler', method: req.method })
    return res
      .status(500)
      .json(
        withDebug(
          { ok: false, error: 'Something went wrong on my side. Please email me directly.' },
          error,
        ),
      )
  }
}
