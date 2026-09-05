import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

const BASE =
  'inline-flex items-center justify-center rounded-md px-5 py-3 text-body font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const TONE = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'border border-line-strong text-ink hover:bg-raise',
} as const

type Tone = keyof typeof TONE

/** Anchors and buttons share one look, so a link never has to be faked with a button. */
export function ButtonLink({
  tone = 'primary',
  className = '',
  children,
  ...rest
}: { tone?: Tone; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${BASE} ${TONE[tone]} ${className}`} {...rest}>
      {children}
    </a>
  )
}

export function Button({
  tone = 'primary',
  className = '',
  children,
  ...rest
}: { tone?: Tone; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${BASE} ${TONE[tone]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
