import type { ReactNode } from 'react'
import { Container } from './Container'

/**
 * Every section is a landmark named by its own heading, which is what lets a
 * screen reader jump between them. `id` doubles as the anchor target for the
 * header links.
 */
export function Section({
  id,
  heading,
  intro,
  children,
  tone = 'page',
}: {
  id: string
  heading: string
  intro?: string
  children: ReactNode
  tone?: 'page' | 'raise'
}) {
  const headingId = `${id}-heading`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`scroll-mt-20 border-t border-line py-16 sm:py-24 ${
        tone === 'raise' ? 'bg-raise' : 'bg-page'
      }`}
    >
      <Container>
        <h2 id={headingId} className="text-heading font-semibold text-balance">
          {heading}
        </h2>
        {intro ? <p className="mt-4 max-w-prose text-muted">{intro}</p> : null}
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  )
}
