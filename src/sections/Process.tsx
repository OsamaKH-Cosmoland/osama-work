import { Section } from '../components/Section'
import { process } from '../content'

export function Process() {
  return (
    <Section id="process" heading={process.heading} tone="raise">
      {/* Ordered because the steps happen in this order, not for decoration. */}
      <ol className="grid gap-6 sm:grid-cols-2">
        {process.steps.map((step, index) => (
          <li key={step.title} className="rounded-lg border border-line bg-page p-6">
            <p className="text-small font-medium text-muted">Step {index + 1}</p>
            <h3 className="mt-2 font-semibold">{step.title}</h3>
            <p className="mt-2 text-small text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
