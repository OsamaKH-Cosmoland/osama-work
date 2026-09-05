import { Section } from '../components/Section'
import { caseStudy, site } from '../content'

export function CaseStudy() {
  return (
    <Section id="work" heading={caseStudy.heading}>
      <p className="-mt-6 text-small text-muted">{caseStudy.label}</p>
      <p className="mt-1 text-small text-muted">{caseStudy.subheading}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold">{caseStudy.problem.title}</h3>
          <p className="mt-2 text-small text-muted">{caseStudy.problem.body}</p>
        </div>
        <div>
          <h3 className="font-semibold">{caseStudy.built.title}</h3>
          <p className="mt-2 text-small text-muted">{caseStudy.built.body}</p>
          <ul className="mt-3 space-y-2 text-small text-muted">
            {caseStudy.built.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-line bg-raise p-6">
        <h3 className="font-semibold">{caseStudy.result.title}</h3>
        <p className="mt-2 max-w-prose text-small text-muted">{caseStudy.result.body}</p>

        {caseStudy.result.metrics.length > 0 ? (
          <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudy.result.metrics.map((metric) => (
              <div key={metric.label} className="border-t border-line-strong pt-3">
                <dt className="sr-only">{metric.label}</dt>
                <dd>
                  <span className="block font-semibold tabular-nums">{metric.value}</span>
                  <span className="mt-1 block text-small text-muted">{metric.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a
          href={site.liveStore}
          className="font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
          target="_blank"
          rel="noreferrer noopener"
        >
          {caseStudy.liveLinkLabel}
        </a>
        <ul className="flex flex-wrap gap-2" aria-label="Stack used on this project">
          {caseStudy.stack.map((tool) => (
            <li key={tool} className="rounded-sm border border-line px-2 py-1 text-small text-muted">
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
