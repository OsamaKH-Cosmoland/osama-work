import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildEnvelope, buildEvent, captureException, newEventId, parseDsn } from './_sentry'

const DSN = 'https://abc123def456@o987654.ingest.sentry.io/1234567'

describe('parseDsn', () => {
  it('builds the envelope endpoint and public key from a real DSN', () => {
    expect(parseDsn(DSN)).toEqual({
      endpoint: 'https://o987654.ingest.sentry.io/api/1234567/envelope/',
      publicKey: 'abc123def456',
    })
  })

  it.each([
    ['empty', ''],
    ['not a url', 'nonsense'],
    ['no public key', 'https://o987654.ingest.sentry.io/1234567'],
    ['no project id', 'https://abc123@o987654.ingest.sentry.io/'],
    ['non-numeric project id', 'https://abc123@o987654.ingest.sentry.io/not-a-number'],
    ['wrong protocol', 'ftp://abc123@o987654.ingest.sentry.io/1234567'],
  ])('returns null for a DSN with %s', (_label, dsn) => {
    expect(parseDsn(dsn)).toBeNull()
  })
})

describe('newEventId', () => {
  it('is 32 lowercase hex characters, as Sentry requires', () => {
    expect(newEventId()).toMatch(/^[0-9a-f]{32}$/)
  })

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 50 }, newEventId))
    expect(ids.size).toBe(50)
  })
})

describe('buildEvent', () => {
  it('captures the error type, message and stack', () => {
    const error = new TypeError('something specific broke')
    const event = buildEvent(error, { stage: 'telegram' }, 'a'.repeat(32), 'production')

    expect(event.exception.values[0].type).toBe('TypeError')
    expect(event.exception.values[0].value).toBe('something specific broke')
    expect(event.extra.stage).toBe('telegram')
    expect(String(event.extra.stack)).toContain('something specific broke')
    expect(event.environment).toBe('production')
  })

  it('handles a thrown value that is not an Error', () => {
    const event = buildEvent('a bare string', {}, 'b'.repeat(32), 'development')
    expect(event.exception.values[0].value).toBe('a bare string')
  })
})

describe('buildEnvelope', () => {
  it('is three lines of valid JSON', () => {
    const event = buildEvent(new Error('boom'), {}, 'c'.repeat(32), 'production')
    const lines = buildEnvelope(DSN, event).trim().split('\n')

    expect(lines).toHaveLength(3)
    expect(JSON.parse(lines[0]).dsn).toBe(DSN)
    expect(JSON.parse(lines[0]).event_id).toBe(event.event_id)
    expect(JSON.parse(lines[1])).toEqual({ type: 'event' })
    expect(JSON.parse(lines[2]).exception.values[0].value).toBe('boom')
  })
})

describe('captureException', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does nothing when no DSN is configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await captureException(new Error('boom'), {}, undefined)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call Sentry when the DSN is malformed', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await captureException(new Error('boom'), {}, 'not-a-dsn')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the envelope to the right endpoint with the auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    expect(await captureException(new Error('boom'), { stage: 'telegram' }, DSN, 'production')).toBe(
      true,
    )

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://o987654.ingest.sentry.io/api/1234567/envelope/')
    expect(init.method).toBe('POST')
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_key=abc123def456')
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_version=7')
    expect(String(init.body)).toContain('boom')
  })

  it('returns false rather than throwing when Sentry rejects the event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(captureException(new Error('boom'), {}, DSN)).resolves.toBe(false)
  })

  it('returns false rather than throwing when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    await expect(captureException(new Error('boom'), {}, DSN)).resolves.toBe(false)
  })
})

/**
 * Regression guard for the outage this module exists to prevent.
 *
 * @sentry/node pulls in OpenTelemetry, which is CommonJS. Bundled into an ESM
 * serverless function it throws "Dynamic require of util is not supported"
 * while the module is loading, so the function returns
 * FUNCTION_INVOCATION_FAILED before any handler code runs. Nothing in a normal
 * unit test catches that, because the failure is in the bundle, not the logic.
 */
describe('serverless bundle safety', () => {
  it('the function imports nothing that breaks when bundled to ESM', () => {
    for (const file of ['api/contact.ts', 'api/_sentry.ts']) {
      const source = readFileSync(file, 'utf8')
      expect(source, `${file} must not import @sentry/node`).not.toMatch(
        /from\s+['"]@sentry\/\w+['"]/,
      )
    }
  })

  it('the serverless function has no runtime dependencies', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    // React and Tailwind are frontend-only and never reach the function bundle.
    // Anything else added here would be bundled into it, so keep the list tight.
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual([
      '@tailwindcss/vite',
      'react',
      'react-dom',
      'tailwindcss',
    ])
  })
})
