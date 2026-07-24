import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Check, Zap } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
type Currency = 'KES' | 'USD'

const TIERS = [
  {
    tier: 'pro' as const,
    name: 'Pro',
    tagline: 'For active integrations and teams.',
    prices: { KES: '1,500', USD: '12' },
    features: [
      '50 endpoints',
      '10,000 requests / endpoint',
      '60-day idle TTL',
      'Relay passthrough',
      'Custom response headers',
      '15s relay timeout',
    ],
  },
  {
    tier: 'enterprise' as const,
    name: 'Enterprise',
    tagline: 'Unlimited scale for production.',
    prices: { KES: '6,000', USD: '45' },
    features: [
      'Unlimited endpoints',
      'Unlimited requests',
      '60-day idle TTL',
      'Relay passthrough',
      'Custom response headers',
      '30s relay timeout',
    ],
  },
]

export const Route = createFileRoute('/app/billing')({
  component: Billing,
})

function Billing() {
  const [currency, setCurrency] = useState<Currency>('KES')
  const { data } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const res = await fetch('/api/billing/info')
      if (!res.ok) throw new Error('Failed to load billing info')
      return res.json()
    },
  })

  const checkout = useMutation({
    mutationFn: async (vars: { tier: 'pro' | 'enterprise'; currency: Currency }) => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(vars),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Checkout failed')
      }
      return res.json()
    },
    onSuccess: (res) => {
      window.location.assign(res.url)
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="island-kicker mb-1">Billing</p>
        <h1 className="display-title text-3xl font-bold text-[var(--ink)]">
          Plans &amp; pricing
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Powered by Paystack. Billed in KES or USD — pick your region.
        </p>
      </div>

      <div className="island-shell flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--ink-soft)]">Current plan</span>
          <Badge variant={data?.plan && data.plan !== 'free' ? 'default' : 'muted'}>
            {data?.plan ?? 'free'}
          </Badge>
          {data?.planStatus ? (
            <span className="text-xs text-[var(--ink-soft)]">
              ({data.planStatus})
            </span>
          ) : null}
        </div>
        <div className="inline-flex rounded-full border border-[var(--line)] p-1">
          {(['KES', 'USD'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={
                'rounded-full px-4 py-1 text-sm font-semibold transition ' +
                (currency === c
                  ? 'bg-[var(--ember)] text-white'
                  : 'text-[var(--ink-soft)]')
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {TIERS.map((t) => {
          const isCurrent = data?.plan === t.tier
          return (
            <Card key={t.tier}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{t.name}</CardTitle>
                  {isCurrent ? <Badge variant="success">current</Badge> : null}
                </div>
                <p className="text-sm text-[var(--ink-soft)]">{t.tagline}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="display-title text-3xl font-bold text-[var(--ink)]">
                    {currency === 'KES' ? 'KES ' : '$'}
                    {t.prices[currency]}
                  </span>
                  <span className="text-sm text-[var(--ink-soft)]">/ month</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                      <Check className="size-4 text-[var(--ember)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  size="lg"
                  disabled={isCurrent || checkout.isPending}
                  onClick={() => checkout.mutate({ tier: t.tier, currency })}
                >
                  {isCurrent
                    ? 'Your current plan'
                    : checkout.isPending
                      ? 'Redirecting…'
                      : `Upgrade to ${t.name}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-[var(--ink-soft)]">
        Need a custom plan?{' '}
        <a href="mailto:hello@gelianahooks.com">Talk to us</a>. Manage or cancel
        anytime from your Paystack customer portal.
      </p>

      <Link
        to="/app"
        className="self-start text-sm text-[var(--ember-deep)] no-underline hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  )
}
