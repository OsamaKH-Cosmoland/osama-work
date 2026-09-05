// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import App from '../App'
import {
  about,
  caseStudy,
  contact,
  different,
  faq,
  footer,
  hero,
  packages,
  process,
  site,
} from '../content'
import { BUDGET_OPTIONS } from '../../shared/validation'

afterEach(cleanup)

/**
 * These assert that the page renders what is in content.ts, not that it renders
 * a particular string. Copy can be rewritten in content.ts without touching a
 * test; a section that silently stops rendering will fail one.
 */

describe('page structure', () => {
  it('renders exactly one h1, and it is the hero headline', () => {
    render(<App />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0].textContent).toBe(hero.headline)
  })

  it('never skips a heading level', () => {
    const { container } = render(<App />)
    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    )
    expect(levels.length).toBeGreaterThan(0)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  it('renders all eight sections inside main, each one a labelled landmark', () => {
    const { container } = render(<App />)
    const sections = [...container.querySelectorAll('main > section')]
    expect(sections).toHaveLength(8)
    for (const section of sections) {
      expect(section.id).not.toBe('')
      const labelledBy = section.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      expect(container.querySelector(`#${labelledBy}`)).not.toBeNull()
    }
  })

  it('has a skip link pointing at main', () => {
    const { container } = render(<App />)
    const skip = container.querySelector('a[href="#main"]')
    expect(skip).not.toBeNull()
    expect(container.querySelector('main')?.id).toBe('main')
  })
})

describe('content reaches the page', () => {
  it('hero', () => {
    render(<App />)
    expect(screen.getByText(hero.eyebrow)).toBeTruthy()
    expect(screen.getByText(hero.body)).toBeTruthy()
    expect(screen.getByRole('link', { name: hero.primaryCta })).toBeTruthy()
  })

  it('what most freelancers skip: every item', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: different.heading })).toBeTruthy()
    for (const item of different.items) {
      expect(screen.getByRole('heading', { name: item.title })).toBeTruthy()
      expect(screen.getByText(item.body)).toBeTruthy()
    }
  })

  it('packages: every tier, price, timeline and feature', () => {
    render(<App />)
    for (const tier of packages.items) {
      const heading = screen.getByRole('heading', { name: tier.name })
      expect(heading).toBeTruthy()
      const card = heading.closest('li')
      expect(card).not.toBeNull()
      const scoped = within(card as HTMLElement)
      expect(scoped.getByText(new RegExp(tier.price.replace(/[$,]/g, '\\$&')))).toBeTruthy()
      expect(scoped.getByText(tier.timeline)).toBeTruthy()
      for (const feature of tier.features) {
        expect(scoped.getByText(feature)).toBeTruthy()
      }
    }
  })

  it('packages: only the recommended tier is badged', () => {
    render(<App />)
    const recommended = packages.items.filter((tier) => tier.recommended)
    expect(recommended).toHaveLength(1)
    const label = (recommended[0] as { recommendedLabel?: string }).recommendedLabel
    expect(label).toBeTruthy()
    expect(screen.getByText(label as string)).toBeTruthy()
  })

  it('process: steps render in order', () => {
    const { container } = render(<App />)
    const items = [...(container.querySelector('#process ol')?.children ?? [])]
    expect(items).toHaveLength(process.steps.length)
    items.forEach((item, index) => {
      expect(item.textContent).toContain(process.steps[index].title)
    })
  })

  it('case study: problem, build points, result body and every metric', () => {
    render(<App />)
    expect(screen.getByText(caseStudy.problem.body)).toBeTruthy()
    for (const point of caseStudy.built.points) {
      expect(screen.getByText(point)).toBeTruthy()
    }
    expect(screen.getByText(caseStudy.result.body)).toBeTruthy()
    for (const metric of caseStudy.result.metrics) {
      expect(screen.getByText(metric.value)).toBeTruthy()
      expect(screen.getAllByText(metric.label).length).toBeGreaterThan(0)
    }
  })

  it('case study: the metrics are attributed in the body, not left bare', () => {
    // The figures are from Osama's own store. Rendering them without that
    // context would read as client results.
    render(<App />)
    const body = screen.getByText(caseStudy.result.body).textContent ?? ''
    expect(body).toMatch(/my own store/i)
    expect(body).toMatch(/\b\d{1,2} \w+ \d{4}\b/)
  })

  it('case study: links to the live store, opened safely', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: caseStudy.liveLinkLabel })
    expect(link.getAttribute('href')).toBe(site.liveStore)
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('about: every paragraph', () => {
    render(<App />)
    for (const paragraph of about.paragraphs) {
      expect(screen.getByText(paragraph)).toBeTruthy()
    }
  })

  it('faq: every question, answered, and collapsed by default', () => {
    const { container } = render(<App />)
    const details = [...container.querySelectorAll('#faq details')]
    expect(details).toHaveLength(faq.items.length)
    details.forEach((element, index) => {
      expect((element as HTMLDetailsElement).open).toBe(false)
      expect(element.textContent).toContain(faq.items[index].q)
      expect(element.textContent).toContain(faq.items[index].a)
    })
  })

  it('footer: tagline and a mailto', () => {
    render(<App />)
    expect(screen.getByText(footer.tagline)).toBeTruthy()
    expect(
      screen.getAllByRole('link', { name: site.email }).some((a) => a.getAttribute('href') === `mailto:${site.email}`),
    ).toBe(true)
  })

  it('contact: calendly and whatsapp both point at the configured URLs', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Pick a time' }).getAttribute('href')).toBe(site.calendly)
    expect(screen.getByRole('link', { name: site.whatsappDisplay }).getAttribute('href')).toBe(site.whatsapp)
    expect(screen.getByText(contact.intro)).toBeTruthy()
  })
})

describe('budget options', () => {
  it('the copy in content.ts matches the list the server validates against', () => {
    // If these drift, every submission that picks a budget is rejected with a
    // 400 that neither side can explain.
    expect(contact.budgets).toEqual([...BUDGET_OPTIONS])
  })
})
