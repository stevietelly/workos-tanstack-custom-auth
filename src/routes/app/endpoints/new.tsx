import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { ArrowLeft, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import { Button } from '#/components/ui/button'
import { createEndpoint } from '#/server/endpoints'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

type FormValues = {
  name: string
  description: string
  mode: 'capture' | 'respond'
  allowedMethods: string[]
  responseStatus: number
  responseBody: string
  responseContentType: string
  responseHeaders: string
  relayEnabled: boolean
  relayUrl: string
  relayMethod: string
  relayHeaders: string
  relayPassthrough: boolean
  relayTimeoutMs: number
}

function parseHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) {
      const k = line.slice(0, i).trim()
      const v = line.slice(i + 1).trim()
      if (k) out[k] = v
    }
  }
  return out
}

export const Route = createFileRoute('/app/endpoints/new')({
  component: NewEndpoint,
})

function NewEndpoint() {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      mode: 'capture' as const,
      allowedMethods: ['GET', 'POST'],
      responseStatus: 200,
      responseBody: '{\n  "ok": true\n}',
      responseContentType: 'application/json',
      responseHeaders: '',
      relayEnabled: false,
      relayUrl: '',
      relayMethod: 'POST',
      relayHeaders: '',
      relayPassthrough: false,
      relayTimeoutMs: 10000,
    } as FormValues,
    onSubmit: async ({ value }) => {
      const res = await createEndpoint({
        data: {
          name: value.name,
          description: value.description || undefined,
          mode: value.mode,
          allowedMethods: value.allowedMethods,
          responseStatus: Number(value.responseStatus),
          responseBody: value.responseBody,
          responseContentType: value.responseContentType,
          responseHeaders: parseHeaders(value.responseHeaders),
          relayEnabled: value.relayEnabled,
          relayUrl: value.relayUrl || undefined,
          relayMethod: value.relayMethod as FormValues['relayMethod'],
          relayHeaders: parseHeaders(value.relayHeaders),
          relayPassthrough: value.relayPassthrough,
          relayTimeoutMs: Number(value.relayTimeoutMs),
        },
      })
      navigate({ to: '/app/endpoints/$id', params: { id: res.id } })
    },
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--link-bg-hover)]"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div>
          <p className="island-kicker mb-1">New endpoint</p>
          <h1 className="display-title text-3xl font-bold text-[var(--ink)]">
            Create a callback URL
          </h1>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value?.trim() ? 'Name is required' : undefined,
              }}
            >
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Stripe webhooks"
                  />
                  {field.state.meta.errors.length ? (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name}>Description (optional)</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="What is this endpoint for?"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="allowedMethods">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Allowed methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {HTTP_METHODS.map((m) => {
                      const checked = field.state.value.includes(m)
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            field.handleChange(
                              checked
                                ? field.state.value.filter((x: string) => x !== m)
                                : [...field.state.value, m],
                            )
                          }
                          className={
                            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ' +
                            (checked
                              ? 'border-[var(--ember-line)] bg-[var(--ember-tint)] text-[var(--ember-deep)]'
                              : 'border-[var(--line)] text-[var(--ink-soft)]')
                          }
                        >
                          {checked ? <Check className="size-3" /> : null}
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="mode">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>Mode</Label>
                  <div className="flex gap-2">
                    {(['capture', 'respond'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => field.handleChange(m)}
                        className={
                          'rounded-lg border px-3 py-1.5 text-sm font-semibold capitalize transition ' +
                          (field.state.value === m
                            ? 'border-[var(--ember-line)] bg-[var(--ember-tint)] text-[var(--ember-deep)]'
                            : 'border-[var(--line)] text-[var(--ink-soft)]')
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {field.state.value === 'capture'
                      ? 'Log every request and return a 200 OK ack.'
                      : 'Return a static, configurable response (a mock endpoint).'}
                  </p>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <form.Subscribe selector={(s) => s.values.mode}>
          {(mode) =>
            mode === 'respond' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Static response</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="responseStatus">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={field.name}>Status</Label>
                          <Input
                            id={field.name}
                            type="number"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="responseContentType">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={field.name}>Content-Type</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                  <form.Field name="responseBody">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name}>Body</Label>
                        <Textarea
                          id={field.name}
                          rows={5}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="responseHeaders">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name}>
                          Custom headers (one per line, Key: Value)
                        </Label>
                        <Textarea
                          id={field.name}
                          rows={3}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="X-Powered-By: geliana"
                        />
                      </div>
                    )}
                  </form.Field>
                </CardContent>
              </Card>
            ) : null
          }
        </form.Subscribe>

        <Card>
          <CardHeader>
            <CardTitle>Relay (optional)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.Field name="relayEnabled">
              {(field) => (
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--ink)]">
                    Forward requests to a real URL
                  </span>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v)}
                  />
                </label>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.values.relayEnabled}>
              {(enabled) =>
                enabled ? (
                  <div className="flex flex-col gap-4">
                    <form.Field name="relayUrl">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={field.name}>Target URL</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="https://api.example.com/hooks"
                          />
                        </div>
                      )}
                    </form.Field>
                    <div className="grid grid-cols-2 gap-4">
                      <form.Field name="relayMethod">
                        {(field) => (
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Method</Label>
                            <select
                              id={field.name}
                              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            >
                              {HTTP_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </form.Field>
                      <form.Field name="relayTimeoutMs">
                        {(field) => (
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Timeout (ms)</Label>
                            <Input
                              id={field.name}
                              type="number"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value))
                              }
                            />
                          </div>
                        )}
                      </form.Field>
                    </div>
                    <form.Field name="relayPassthrough">
                      {(field) => (
                        <label className="flex items-center justify-between gap-3">
                          <span className="text-sm text-[var(--ink-soft)]">
                            Return the relay's response verbatim (Pro+)
                          </span>
                          <Switch
                            checked={field.state.value}
                            onCheckedChange={(v) => field.handleChange(v)}
                          />
                        </label>
                      )}
                    </form.Field>
                    <form.Field name="relayHeaders">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={field.name}>
                            Extra headers (Key: Value, one per line)
                          </Label>
                          <Textarea
                            id={field.name}
                            rows={3}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                ) : null
              }
            </form.Subscribe>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} size="lg">
                {isSubmitting ? 'Creating…' : 'Create endpoint'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  )
}
