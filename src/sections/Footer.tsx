import { Container } from '../components/Container'
import { footer, site } from '../content'

export function Footer() {
  return (
    <footer className="border-t border-line bg-page py-10">
      <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted">{footer.tagline}</p>
        <p className="text-small text-muted">
          {site.name}, {site.location}.{' '}
          <a
            href={`mailto:${site.email}`}
            className="-my-1 inline-block py-1 text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            {site.email}
          </a>
        </p>
      </Container>
    </footer>
  )
}
