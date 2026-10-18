import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: 'primary' | 'secondary'
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  const styles = variant === 'primary'
    ? 'bg-teal-700 text-white hover:bg-teal-800'
    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'

  return <Link className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${styles} ${className}`} {...props} />
}
