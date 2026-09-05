/**
 * Minimal Sentry reporting over plain HTTP.
 *
 * The official @sentry/node SDK pulls in OpenTelemetry, which is CommonJS and
 * calls require() at runtime. Bundled into an ESM serverless function that
 * throws "Dynamic require of util is not supported" while the module is still
 * loading, so the function dies before the handler ever runs.
 *
 * Sentry's envelope endpoint is a documented HTTP API, so this sends the event
 * with fetch instead. No dependency, a few KB instead of 1.4 MB, and nothing a
 * bundler can break.
 *
 * The file is prefixed with _ so Vercel does not expose it as a route.
 */

export interface ParsedDsn {
  /** Full envelope endpoint, ready to POST to. */
  endpoint: string
  /** The DSN public key, sent as sentry_key. */
  publicKey: string
}

/**
 * A DSN looks like https://<publicKey>@<host>/<projectId>.
 * Returns null for anything malformed so a bad env var degrades to
 * "no reporting" rather than throwing inside an error handler.
 */
export function parseDsn(dsn: string): ParsedDsn | null {
  let url: URL
  try {
    url = new URL(dsn)
  } catch {
    return null
  }

  const projectId = url.pathname.replace(/^\//, '')
  if (!url.username || !projectId || !/^\d+$/.test(projectId)) return null
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  return {
    endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
    publicKey: url.username,
  }
}

/** Sentry wants a 32 character hex id with no dashes. */
export function newEventId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '')
}

function describe(error: unknown): { type: string; value: string; stack?: string } {
  if (error instanceof Error) {
    return {
      type: error.name || 'Error',
      value: error.message || String(error),
      stack: error.stack,
    }
  }
  return { type: 'Error', value: typeof error === 'string' ? error : JSON.stringify(error) }
}

export interface SentryEvent {
  event_id: string
  timestamp: number
  platform: 'node'
  level: 'error'
  environment: string
  logger: string
  exception: { values: Array<{ type: string; value: string }> }
  extra: Record<string, unknown>
}

export function buildEvent(
  error: unknown,
  context: Record<string, unknown>,
  eventId: string,
  environment: string,
): SentryEvent {
  const { type, value, stack } = describe(error)
  return {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment,
    logger: 'api/contact',
    exception: { values: [{ type, value }] },
    // The raw stack goes in extra rather than a parsed stacktrace. Sentry shows
    // it fine and it avoids shipping a stack parser for one endpoint.
    extra: { ...context, stack },
  }
}

/** An envelope is newline-delimited JSON: header, item header, item payload. */
export function buildEnvelope(dsn: string, event: SentryEvent): string {
  const header = JSON.stringify({
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    dsn,
  })
  const itemHeader = JSON.stringify({ type: 'event' })
  const payload = JSON.stringify(event)
  return `${header}\n${itemHeader}\n${payload}\n`
}

/**
 * Send one error to Sentry. Never throws and never rejects: this runs inside a
 * catch block, and a failure to report must not become the thing that breaks
 * the request. Returns whether the event was accepted, which the tests assert.
 */
export async function captureException(
  error: unknown,
  context: Record<string, unknown> = {},
  dsn: string | undefined = process.env.SENTRY_DSN,
  environment: string = process.env.VERCEL_ENV ?? 'development',
): Promise<boolean> {
  if (!dsn) return false

  const parsed = parseDsn(dsn)
  if (!parsed) {
    console.error('[sentry] SENTRY_DSN is set but not a valid DSN, skipping report')
    return false
  }

  try {
    const event = buildEvent(error, context, newEventId(), environment)
    const response = await fetch(parsed.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': [
          'Sentry sentry_version=7',
          'sentry_client=osama-work/1.0',
          `sentry_key=${parsed.publicKey}`,
        ].join(', '),
      },
      body: buildEnvelope(dsn, event),
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) {
      console.error('[sentry] rejected the event with status', response.status)
      return false
    }
    return true
  } catch (reportingError) {
    console.error('[sentry] could not send the event:', reportingError)
    return false
  }
}
