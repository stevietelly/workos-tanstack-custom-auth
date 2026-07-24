import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Plus, Webhook, ArrowRight } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { getEndpoints } from '#/server/endpoints'
import { formatRelative } from '#/lib/utils'
import { type InferSelectModel } from 'drizzle-orm'
import { endpoints } from '@/db/schema'

type Row = InferSelectModel<typeof endpoints> & { requestCount: number }

const col = createColumnHelper<Row>()

export const Route = createFileRoute('/app/')({
  component: Dashboard,
})

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => getEndpoints(),
    refetchInterval: 8000,
  })

  const columns = [
    col.accessor('name', {
      header: 'Endpoint',
      cell: (c) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--ink)]">{c.getValue()}</span>
          {c.row.original.description ? (
            <span className="text-xs text-[var(--ink-soft)]">
              {c.row.original.description}
            </span>
          ) : null}
          <code className="mt-0.5 text-[11px] text-[var(--ink-soft)]">
            {window.location.origin}/api/cb/{c.row.original.id}
          </code>
        </div>
      ),
    }),
    col.accessor('mode', {
      header: 'Mode',
      cell: (c) => (
        <Badge variant={c.getValue() === 'respond' ? 'default' : 'muted'}>
          {c.getValue()}
        </Badge>
      ),
    }),
    col.accessor('requestCount', {
      header: 'Requests',
      cell: (c) => (
        <span className="tabular-nums">{c.getValue().toLocaleString()}</span>
      ),
    }),
    col.accessor('lastUsedAt', {
      header: 'Last used',
      cell: (c) =>
        c.getValue() ? (
          <span className="text-sm text-[var(--ink-soft)]">
            {formatRelative(c.getValue() as string)}
          </span>
        ) : (
          <span className="text-sm text-[var(--ink-soft)]">never</span>
        ),
    }),
    col.accessor('expiresAt', {
      header: 'Expires',
      cell: (c) => (
        <span className="text-sm text-[var(--ink-soft)]">
          {formatRelative(c.getValue() as string)}
        </span>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: (c) => (
        <Link
          to="/app/endpoints/$id"
          params={{ id: c.row.original.id }}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)]"
        >
          View <ArrowRight className="size-3" />
        </Link>
      ),
    }),
  ]

  const table = useReactTable({
    data: (data?.endpoints ?? []) as Row[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const limits = data?.limits
  const used = data?.endpoints.length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-1">Dashboard</p>
          <h1 className="display-title text-3xl font-bold text-[var(--ink)]">
            Your endpoints
          </h1>
        </div>
        <Link
          to="/app/endpoints/new"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--ember-deep)]"
        >
          <Plus className="size-4" /> New endpoint
        </Link>
      </div>

      {limits ? (
        <div className="island-shell flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl px-5 py-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={data?.plan === 'free' ? 'muted' : 'default'}>
              {data?.plan}
            </Badge>
            <span className="text-[var(--ink-soft)]">
              {used}/{limits.maxEndpoints} endpoints
            </span>
          </div>
          <div className="flex items-center gap-2 text-[var(--ink-soft)]">
            <Webhook className="size-4 text-[var(--ember)]" />
            {limits.maxRequestsPerEndpoint.toLocaleString()} req/endpoint
          </div>
          <div className="text-[var(--ink-soft)]">
            {limits.ttlDays}-day idle TTL
          </div>
          <div className="text-[var(--ink-soft)]">
            {limits.relayTimeoutMs / 1000}s relay timeout
          </div>
        </div>
      ) : null}

      <div className="island-shell overflow-hidden rounded-2xl">
        {isLoading && !data ? (
          <div className="p-8 text-center text-[var(--ink-soft)]">Loading…</div>
        ) : !data?.endpoints.length ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Webhook className="size-8 text-[var(--ember)]" />
            <p className="m-0 text-[var(--ink-soft)]">
              No endpoints yet. Create one to get a public callback URL.
            </p>
            <Link
              to="/app/endpoints/new"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ember)] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[var(--ember-deep)]"
            >
              <Plus className="size-4" /> New endpoint
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3 font-semibold">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
