import { describe, expect, it } from 'vitest'
import { BUDGET_OPTIONS, LIMITS, validateContact } from './validation'

/** A submission that should always pass, so each test changes one thing at a time. */
function valid(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Sarah Bennett',
    email: 'sarah@brightfold.co.uk',
    company: 'Brightfold',
    budget: '$700 to $1,500',
    message: 'We need a small store for our candle brand, around 20 products.',
    ...overrides,
  }
}

describe('validateContact', () => {
  describe('accepts good input', () => {
    it('returns the normalised data', () => {
      const result = validateContact(valid())
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data).toEqual({
        name: 'Sarah Bennett',
        email: 'sarah@brightfold.co.uk',
        company: 'Brightfold',
        budget: '$700 to $1,500',
        message: 'We need a small store for our candle brand, around 20 products.',
      })
    })

    it('trims and lowercases the email', () => {
      const result = validateContact(valid({ email: '  Sarah@BrightFold.co.UK  ' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.email).toBe('sarah@brightfold.co.uk')
    })

    it('collapses stray whitespace in the name', () => {
      const result = validateContact(valid({ name: '  Sarah   Bennett  ' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.name).toBe('Sarah Bennett')
    })

    it('treats company as optional', () => {
      const result = validateContact(valid({ company: '' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.company).toBe('')
    })

    it('treats budget as optional', () => {
      const result = validateContact(valid({ budget: '' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.budget).toBe('')
    })

    it('accepts every budget option offered on the page', () => {
      for (const budget of BUDGET_OPTIONS) {
        expect(validateContact(valid({ budget })).ok).toBe(true)
      }
    })

    it('keeps newlines inside the message', () => {
      const message = 'First line.\nSecond line.\n\nThird line.'
      const result = validateContact(valid({ message }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.message).toBe(message)
    })
  })

  describe('rejects bad shapes', () => {
    it.each([
      ['null', null],
      ['a string', 'name=Sarah'],
      ['a number', 42],
      ['an array', [{ name: 'Sarah' }]],
      ['undefined', undefined],
    ])('rejects %s', (_label, input) => {
      const result = validateContact(input)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.form).toBeDefined()
    })

    it('rejects an empty object with one error per required field', () => {
      const result = validateContact({})
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(Object.keys(result.errors).sort()).toEqual(['email', 'message', 'name'])
    })

    it('rejects non-string field values without throwing', () => {
      const result = validateContact({ name: 123, email: [], message: {} })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.name).toBeDefined()
      expect(result.errors.email).toBeDefined()
      expect(result.errors.message).toBeDefined()
    })
  })

  describe('name', () => {
    it('rejects a missing name', () => {
      const result = validateContact(valid({ name: '   ' }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.name).toBe('Your name is required.')
    })

    it(`rejects a name under ${LIMITS.name.min} characters`, () => {
      const result = validateContact(valid({ name: 'A' }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.name).toContain('at least')
    })

    it(`accepts a name of exactly ${LIMITS.name.max} characters`, () => {
      expect(validateContact(valid({ name: 'a'.repeat(LIMITS.name.max) })).ok).toBe(true)
    })

    it(`rejects a name over ${LIMITS.name.max} characters`, () => {
      const result = validateContact(valid({ name: 'a'.repeat(LIMITS.name.max + 1) }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.name).toContain('or fewer')
    })
  })

  describe('email', () => {
    it.each([
      'sarah@brightfold.co.uk',
      'a@b.co',
      'first.last+tag@sub.domain.org',
      "o'brien@example.com",
    ])('accepts %s', (email) => {
      expect(validateContact(valid({ email })).ok).toBe(true)
    })

    it.each([
      ['no at sign', 'sarahbrightfold.co.uk'],
      ['no domain dot', 'sarah@brightfold'],
      ['two at signs', 'sarah@@brightfold.co'],
      ['a space inside', 'sarah bennett@brightfold.co'],
      ['nothing before the at', '@brightfold.co'],
      ['nothing after the at', 'sarah@'],
      ['trailing dot', 'sarah@brightfold.'],
      ['empty', ''],
    ])('rejects %s', (_label, email) => {
      const result = validateContact(valid({ email }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.email).toBeDefined()
    })

    it('rejects an over-long email', () => {
      const email = `${'a'.repeat(LIMITS.email.max)}@example.com`
      const result = validateContact(valid({ email }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.email).toContain('too long')
    })
  })

  describe('company', () => {
    it(`rejects a company over ${LIMITS.company.max} characters`, () => {
      const result = validateContact(valid({ company: 'a'.repeat(LIMITS.company.max + 1) }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.company).toContain('or fewer')
    })
  })

  describe('budget', () => {
    it('rejects a budget that is not one of the offered options', () => {
      const result = validateContact(valid({ budget: '$1,000,000' }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.budget).toBe('Pick one of the listed budget ranges.')
    })
  })

  describe('message', () => {
    it('rejects a missing message', () => {
      const result = validateContact(valid({ message: '  ' }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.message).toBe('Tell me a little about the project.')
    })

    it(`rejects a message under ${LIMITS.message.min} characters`, () => {
      const result = validateContact(valid({ message: 'hi' }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.message).toContain('at least')
    })

    it(`rejects a message over ${LIMITS.message.max} characters`, () => {
      const result = validateContact(valid({ message: 'a'.repeat(LIMITS.message.max + 1) }))
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.message).toContain('or fewer')
    })
  })

  describe('does not pass unexpected input through', () => {
    it('drops unknown keys so they cannot reach the notification', () => {
      const result = validateContact(valid({ isAdmin: true, chat_id: '-100123' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(Object.keys(result.data).sort()).toEqual([
        'budget',
        'company',
        'email',
        'message',
        'name',
      ])
    })

    it('strips control characters that could forge lines in the notification', () => {
      const result = validateContact(valid({ name: 'Sarah\u0000\u001BBennett' }))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.name).toBe('Sarah Bennett')
    })
  })
})
