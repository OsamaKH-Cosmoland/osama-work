import { ButtonLink } from '../components/Button'
import { Section } from '../components/Section'
import { packages } from '../content'

export function Packages() {
  return (
    <Section id="packages" heading={packages.heading} intro={packages.intro}>
      <ul className="grid gap-6 lg:grid-cols-3">
        {packages.items.map((tier) => {
          const nameId = `package-${tier.name.toLowerCase()}`
          return (
            <li
              key={tier.name}
              className={`flex flex-col rounded-lg border bg-page p-6 ${
                tier.recommended ? 'border-accent' : 'border-line'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 id={nameId} className="font-semibold">
                  {tier.name}
                </h3>
                {tier.recommended && 'recommendedLabel' in tier ? (
                  <span className="rounded-sm bg-accent px-2 py-1 text-small leading-none font-medium text-white">
                    {tier.recommendedLabel}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-heading font-semibold">
                {tier.price}
                {'priceSuffix' in tier && tier.priceSuffix ? (
                  <span className="text-body font-normal text-muted"> {tier.priceSuffix}</span>
                ) : null}
              </p>
              <p className="mt-1 text-small text-muted">{tier.timeline}</p>
              <p className="mt-4 text-small">{tier.summary}</p>

              <ul aria-labelledby={nameId} className="mt-5 flex-1 space-y-2 text-small text-muted">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <ButtonLink
                href="#contact"
                tone={tier.recommended ? 'primary' : 'secondary'}
                className="mt-6 w-full"
              >
                <span>
                  Book a call<span className="sr-only"> about the {tier.name} package</span>
                </span>
              </ButtonLink>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
