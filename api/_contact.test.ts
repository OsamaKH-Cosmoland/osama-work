import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './contact'

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
    setHeader(key: string, value: string) {
      res.headers[key] = value
    },
  }
  return res
}

const goodBody = {
  name: 'Sarah Bennett',
  email: 'sarah@brightfold.co.uk',
  company: 'Brightfold',
  budget: '$700 to $1,500',
  message: 'We need a small store for our candle brand, around 20 products.',
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = '12345'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('rejects a GET with 405 and an Allow header', async () => {
    const res = mockRes()
    await handler({ method: 'GET', body: {} } as never, res as never)
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
  })

  it('rejects invalid input with 400 and never calls Telegram', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: { name: 'x' } } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the notification and returns 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: goodBody } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage')
    const sent = JSON.parse((init as { body: string }).body)
    expect(sent.chat_id).toBe('12345')
    expect(sent.text).toContain('Sarah Bennett')
    expect(sent.text).toContain('sarah@brightfold.co.uk')
    expect(sent.parse_mode).toBeUndefined()
  })

  it('accepts a raw JSON string body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: JSON.stringify(goodBody) } as never, res as never)
    expect(res.statusCode).toBe(200)
  })

  it('returns 502 when Telegram fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: goodBody } as never, res as never)
    expect(res.statusCode).toBe(502)
  })

  it('returns 502 when the bot token is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: goodBody } as never, res as never)
    expect(res.statusCode).toBe(502)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not leak the bot token in the error response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await handler({ method: 'POST', body: goodBody } as never, res as never)
    expect(JSON.stringify(res.body)).not.toContain('test-token')
  })
})
