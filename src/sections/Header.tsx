import { Container } from '../components/Container'
import { site } from '../content'

const LINKS = [
  { href: '#packages', label: 'Packages' },
  { href: '#work', label: 'Work' },
  { href: '#faq', label: 'Questions' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="#top" className="font-semibold tracking-tight">
          {site.name}
        </a>
        <nav aria-label="Sections">
          <ul className="flex items-center gap-5 text-small">
            {LINKS.map((link) => (
              <li key={link.href} className={link.href === '#contact' ? '' : 'hidden sm:block'}>
                {/* Vertical padding, not just line-height: a standalone nav link
                    has to clear the 24px minimum target size in WCAG 2.2. */}
                <a href={link.href} className="-my-2 inline-block py-2 text-muted hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  )
}
