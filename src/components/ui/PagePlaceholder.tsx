import type { ReactNode } from 'react'

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-3xl py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Kaluz Plus</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      {children && <div className="mt-8">{children}</div>}
    </section>
  )
}
