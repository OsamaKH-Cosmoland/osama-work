import { Section } from '../components/Section'
import { faq } from '../content'

export function Faq() {
  return (
    <Section id="faq" heading={faq.heading}>
      {/* Native disclosure: keyboard accessible without any JavaScript, and it
          still opens if the bundle fails to load. */}
      <ul className="divide-y divide-line border-y border-line">
        {faq.items.map((item) => (
          <li key={item.q}>
            <details className="group py-5">
              <summary className="flex items-start justify-between gap-4 font-medium">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-small text-muted">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  )
}
