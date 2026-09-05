import { Section } from '../components/Section'
import { about } from '../content'

export function About() {
  return (
    <Section id="about" heading={about.heading} tone="raise">
      <div className={about.photo ? 'grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start' : ''}>
        {about.photo ? (
          <img
            src={about.photo}
            alt={about.photoAlt}
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
            className="size-30 rounded-full border border-line object-cover"
          />
        ) : null}
        <div className="max-w-prose space-y-4 text-muted">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Section>
  )
}
