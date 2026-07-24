import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/billing/callback')({
  validateSearch: (s) => ({
    reference: typeof s.reference === 'string' ? s.reference : '',
    trxref: typeof s.trxref === 'string' ? s.trxref : '',
  }),
  component: BillingCallback,
})

function BillingCallback() {
  const { reference, trxref } = Route.useSearch()
  const ref = reference || trxref

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify', ref],
    queryFn: async () => {
      const res = await fetch(
        `/api/billing/verify?reference=${encodeURIComponent(ref)}`,
      )
      if (!res.ok) throw new Error('Verification failed')
      return res.json()
    },
    enabled: !!ref,
    retry: false,
  })

  return (
    <main className="page-wrap px-4 py-20">
      <section className="island-shell mx-auto max-w-md rounded-2xl p-8 text-center">
        <p className="island-kicker mb-2">Payment</p>
        {!ref ? (
          <>
            <XCircle className="mx-auto mb-3 size-10 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold text-[var(--ink)]">
              Missing reference
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              We couldn&apos;t find a transaction reference in the URL.
            </p>
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="mx-auto mb-3 size-10 animate-spin text-[var(--ember)]" />
            <h1 className="mb-2 text-2xl font-bold text-[var(--ink)]">
              Confirming payment…
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              Verifying your subscription with Paystack.
            </p>
          </>
        ) : isError || data?.status !== 'success' ? (
          <>
            <XCircle className="mx-auto mb-3 size-10 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold text-[var(--ink)]">
              Payment not completed
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              The transaction didn&apos;t succeed. You can retry from the billing
              page.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-10 text-[#2f6a4a]" />
            <h1 className="mb-2 text-2xl font-bold text-[var(--ink)]">
              You&apos;re all set!
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              Your subscription is now active.
            </p>
            <Badge variant="success" className="mt-3">
              active
            </Badge>
          </>
        )}

        <div className="mt-6">
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[var(--ember-deep)]"
          >
            Go to billing
          </Link>
        </div>
      </section>
    </main>
  )
}
