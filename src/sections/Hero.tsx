import { ButtonLink } from '../components/Button'
import { Container } from '../components/Container'
import { hero, site } from '../content'

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-heading" className="bg-page py-20 sm:py-28">
      <Container>
        <p className="text-small font-medium tracking-wide text-muted uppercase">{hero.eyebrow}</p>
        <h1
          id="hero-heading"
          className="mt-5 max-w-3xl text-display font-semibold text-balance"
        >
          {hero.headline}
        </h1>
        <p className="mt-6 max-w-prose text-muted">{hero.body}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="#contact">{hero.primaryCta}</ButtonLink>
          <ButtonLink href="#work" tone="secondary">
            {hero.secondaryCta}
          </ButtonLink>
        </div>
        <p className="mt-6 text-small text-muted">
          {site.role}. {site.location}.
        </p>
      </Container>
    </section>
  )
}
