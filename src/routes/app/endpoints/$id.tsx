import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowLeft, Copy, Check, Trash2, Pencil, ChevronDown, ChevronRight, Webhook } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import { getEndpoint, getRequests, updateEndpoint, deleteEndpoint } from '#/server/endpoints'
import { formatRelative, formatDateTime } from '#/lib/utils'
import { type InferSelectModel } from 'drizzle-orm'
import { endpoints, requests } from '@/db/schema'

type Endpoint = InferSelectModel<typeof endpoints>
type RequestRow = InferSelectModel<typeof requests>

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const methodColor: Record<string, string> = {
  GET: 'bg-[rgba(52,160,94,0.16)] text-[#2f6a4a]',
  POST: 'bg-[var(--ember-tint)] text-[var(--ember-deep)]',
  PUT: 'bg-[rgba(180,83,9,0.16)] text-[#b45309]',
  PATCH: 'bg-[rgba(124,45,18,0.16)] text-[#7c2d12]',
  DELETE: 'bg-destructive/10 text-destructive',
}

export const Route = createFileRoute('/app/endpoints/$id')({
  component: EndpointDetail,
  loader: ({ params }) => ({ id: params.id }),
})

function EndpointDetail() {
  const { id } = Route.useLoaderData()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)

  const endpointQ = useQuery({
    queryKey: ['endpoint', id],
    queryFn: () => getEndpoint({ data: { id } }),
  })
  const requestsQ = useQuery({
    queryKey: ['requests', id],
    queryFn: () => getRequests({ data: { endpointId: id } }),
    refetchInterval: 4000,
  })

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const del = useMutation({
    mutationFn: () => deleteEndpoint({ data: { id } }),
    onSuccess: () => navigate({ to: '/app' }),
  })

  const endpoint = endpointQ.data

  async function copyUrl() {
    const url = `${window.location.origin}/api/cb/${id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const col = createColumnHelper<RequestRow>()
  const columns = [
    col.display({
      id: 'expander',
      header: '',
      cell: (c) => (
        <button
          type="button"
          onClick={() =>
            setExpanded((p) => ({ ...p, [c.row.original.id]: !p[c.row.original.id] }))
          }
          className="text-[var(--ink-soft)]"
          aria-label="Expand"
        >
          {expanded[c.row.original.id] ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      ),
    }),
    col.accessor('method', {
      header: 'Method',
      cell: (c) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
            methodColor[c.getValue()] ?? 'bg-muted text-[var(--ink-soft)]'
          }`}
        >
          {c.getValue()}
        </span>
      ),
    }),
    col.accessor('receivedAt', {
      header: 'Received',
      cell: (c) => (
        <span className="text-sm text-[var(--ink-soft)]">
          {formatRelative(c.getValue() as string)}
        </span>
      ),
    }),
    col.accessor('ip', {
      header: 'IP',
      cell: (c) => (
        <span className="text-xs text-[var(--ink-soft)]">
          {c.getValue() ?? '—'}
        </span>
      ),
    }),
    col.display({
      id: 'relay',
      header: 'Relay',
      cell: (c) =>
        c.row.original.relayEnabled ? (
          <span className="text-xs">
            {c.row.original.relayTimedOut ? (
              <Badge variant="danger">timeout</Badge>
            ) : c.row.original.relayError ? (
              <Badge variant="danger">error</Badge>
            ) : (
              <Badge variant="muted">
                {c.row.original.relayStatus ?? '—'}
                {c.row.original.relayDurationMs != null
                  ? ` · ${c.row.original.relayDurationMs}ms`
                  : ''}
              </Badge>
            )}
          </span>
        ) : (
          <span className="text-xs text-[var(--ink-soft)]">—</span>
        ),
    }),
  ]

  const table = useReactTable({
    data: requestsQ.data ?? [],
    columns,
    state: { expanded },
    onExpandedChange: (updater) =>
      setExpanded((old) =>
        typeof updater === 'function' ? updater(old) : updater,
      ),
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)]"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </div>

      {!endpoint ? (
        <div className="island-shell rounded-2xl p-8 text-center text-[var(--ink-soft)]">
          {endpointQ.isLoading ? 'Loading…' : 'Endpoint not found.'}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="island-kicker mb-1">Endpoint</p>
              <h1 className="display-title text-3xl font-bold text-[var(--ink)]">
                {endpoint.name}
              </h1>
              {endpoint.description ? (
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {endpoint.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={endpoint.mode === 'respond' ? 'default' : 'muted'}>
                {endpoint.mode}
              </Badge>
              <Badge variant="outline">
                {formatRelative(endpoint.expiresAt)}
              </Badge>
              <button
                type="button"
                onClick={() => del.mutate()}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          </div>

          <div className="island-shell flex items-center gap-3 rounded-2xl px-4 py-3">
            <code className="flex-1 truncate font-mono text-sm text-[var(--ink)]">
              {window.location.origin}/api/cb/{id}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)]"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <EditPanel endpoint={endpoint} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                Requests
                {requestsQ.data ? (
                  <span className="ml-2 text-sm font-normal text-[var(--ink-soft)]">
                    {requestsQ.data.length} shown · auto-refreshing
                  </span>
                ) : null}
              </h2>
            </div>

            <div className="island-shell overflow-hidden rounded-2xl">
              {requestsQ.isLoading ? (
                <div className="p-8 text-center text-[var(--ink-soft)]">
                  Loading…
                </div>
              ) : !requestsQ.data?.length ? (
                <div className="flex flex-col items-center gap-2 p-12 text-center">
                  <Webhook className="size-7 text-[var(--ember)]" />
                  <p className="m-0 text-sm text-[var(--ink-soft)]">
                    No requests yet. Send one to the URL above.
                  </p>
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
                      <>
                        <tr
                          key={row.id}
                          className="border-b border-[var(--line)] last:border-0"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                        {expanded[row.original.id] ? (
                          <tr key={`${row.id}-detail`} className="border-b border-[var(--line)] bg-[var(--cream)]">
                            <td colSpan={row.getVisibleCells().length} className="px-4 py-4">
                              <RequestDetail req={row.original} />
                            </td>
                          </tr>
                        ) : null}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RequestDetail({ req }: { req: RequestRow }) {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <Meta label="Received" value={formatDateTime(req.receivedAt)} />
      <Meta label="User agent" value={req.userAgent ?? '—'} />
      <Section title="Query params">
        <pre className="overflow-auto rounded-lg bg-black/5 p-3 text-[11px]">
          {JSON.stringify(req.queryParams, null, 2)}
        </pre>
      </Section>
      <Section title="Headers">
        <pre className="overflow-auto rounded-lg bg-black/5 p-3 text-[11px]">
          {JSON.stringify(req.headers, null, 2)}
        </pre>
      </Section>
      {req.body ? (
        <Section title="Body">
          <pre className="overflow-auto rounded-lg bg-black/5 p-3 text-[11px]">
            {req.body}
          </pre>
        </Section>
      ) : null}
      {req.relayEnabled ? (
        <Section title="Relay result">
          <pre className="overflow-auto rounded-lg bg-black/5 p-3 text-[11px]">
            {JSON.stringify(
              {
                status: req.relayStatus,
                durationMs: req.relayDurationMs,
                timedOut: req.relayTimedOut,
                error: req.relayError,
                headers: req.relayResponseHeaders,
                body: req.relayResponseBody,
              },
              null,
              2,
            )}
          </pre>
        </Section>
      ) : null}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-semibold text-[var(--ink-soft)]">
        {label}
      </span>
      <span className="break-all text-[var(--ink)]">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-[var(--ink-soft)]">{title}</p>
      {children}
    </div>
  )
}

function EditPanel({ endpoint }: { endpoint: Endpoint }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(endpoint.name)
  const [description, setDescription] = useState(endpoint.description ?? '')
  const [mode, setMode] = useState<'capture' | 'respond'>(endpoint.mode)
  const [allowed, setAllowed] = useState<string[]>(
    (endpoint.allowedMethods as string[]) ?? ['GET', 'POST'],
  )
  const [responseStatus, setResponseStatus] = useState(endpoint.responseStatus)
  const [responseContentType, setResponseContentType] = useState(
    endpoint.responseContentType,
  )
  const [responseBody, setResponseBody] = useState(endpoint.responseBody ?? '')
  const [relayEnabled, setRelayEnabled] = useState(endpoint.relayEnabled)
  const [relayUrl, setRelayUrl] = useState(endpoint.relayUrl ?? '')
  const [relayPassthrough, setRelayPassthrough] = useState(
    endpoint.relayPassthrough,
  )

  const mutate = useMutation({
    mutationFn: () =>
      updateEndpoint({
        data: {
          id: endpoint.id,
          patch: {
            name,
            description: description || undefined,
            mode,
            allowedMethods: allowed,
            responseStatus,
            responseContentType,
            responseBody,
            relayEnabled,
            relayUrl: relayUrl || undefined,
            relayPassthrough,
          },
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoint', endpoint.id] })
      setOpen(false)
    },
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)]"
      >
        <Pencil className="size-4" /> Edit settings
      </button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Mode</Label>
          <div className="flex gap-2">
            {(['capture', 'respond'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  'rounded-lg border px-3 py-1.5 text-sm font-semibold capitalize transition ' +
                  (mode === m
                    ? 'border-[var(--ember-line)] bg-[var(--ember-tint)] text-[var(--ember-deep)]'
                    : 'border-[var(--line)] text-[var(--ink-soft)]')
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Allowed methods</Label>
          <div className="flex flex-wrap gap-2">
            {HTTP_METHODS.map((m) => {
              const on = allowed.includes(m)
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setAllowed(
                      on ? allowed.filter((x) => x !== m) : [...allowed, m],
                    )
                  }
                  className={
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ' +
                    (on
                      ? 'border-[var(--ember-line)] bg-[var(--ember-tint)] text-[var(--ember-deep)]'
                      : 'border-[var(--line)] text-[var(--ink-soft)]')
                  }
                >
                  {on ? <Check className="size-3" /> : null}
                  {m}
                </button>
              )
            })}
          </div>
        </div>
        {mode === 'respond' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Input
                type="number"
                value={responseStatus}
                onChange={(e) => setResponseStatus(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Content-Type</Label>
              <Input
                value={responseContentType}
                onChange={(e) => setResponseContentType(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        {mode === 'respond' ? (
          <div className="flex flex-col gap-1.5">
            <Label>Body</Label>
            <Textarea
              rows={4}
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
            />
          </div>
        ) : null}
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--ink)]">
            Relay enabled
          </span>
          <Switch checked={relayEnabled} onCheckedChange={setRelayEnabled} />
        </label>
        {relayEnabled ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Relay URL</Label>
              <Input
                value={relayUrl}
                onChange={(e) => setRelayUrl(e.target.value)}
                placeholder="https://api.example.com/hooks"
              />
            </div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--ink-soft)]">
                Passthrough response (Pro+)
              </span>
              <Switch
                checked={relayPassthrough}
                onCheckedChange={setRelayPassthrough}
              />
            </label>
          </>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutate.mutate()} disabled={mutate.isPending}>
            {mutate.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
