import { Section } from '../components/Section'
import { different } from '../content'

export function Different() {
  return (
    <Section id="different" heading={different.heading} intro={different.intro} tone="raise">
      <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {different.items.map((item) => (
          <li key={item.title} className="bg-page p-6">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-small text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
