import type { ReactNode } from 'react'

interface SectionPageProps {
  eyebrow: string
  title: string
  description: string
  metrics?: Array<{ label: string; value: string }>
  children?: ReactNode
}

export function SectionPage({ eyebrow, title, description, metrics = [], children }: SectionPageProps) {
  return (
    <section className="py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600">{description}</p>
      {metrics.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p></article>)}
      </div>}
      {children && <div className="mt-8">{children}</div>}
    </section>
  )
}
