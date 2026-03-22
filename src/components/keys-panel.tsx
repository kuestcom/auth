'use client'

import { CopyButton } from '@/components/copy-button'

interface KeysPanelProps {
  keys: string[]
  onRefresh: () => void
  onRevoke: (key: string) => void
  loading?: boolean
  disabled?: boolean
  error?: string | null
  helper?: string | null
  activeKey?: string | null
}

export function KeysPanel({
  keys,
  onRefresh,
  onRevoke,
  loading = false,
  disabled = false,
  error,
  helper,
  activeKey = null,
}: KeysPanelProps) {
  if (keys.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">My keys</h3>
          <p className="text-sm text-muted-foreground">
            Active Kuest API keys.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || disabled}
          className="auth-secondary-button px-3 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      <div className="space-y-3">
        {keys.map((key) => {
          const isActive = activeKey === key
          return (
            <div
              key={key}
              className={`
                flex flex-col gap-3 auth-subpanel p-4 text-sm text-foreground
                md:flex-row md:items-center md:justify-between
              `}
            >
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-xs md:text-sm">
                  {key}
                </span>
                <CopyButton value={key} size="sm" ariaLabel="Copy API key" />
              </div>
              <button
                type="button"
                onClick={() => onRevoke(key)}
                disabled={loading || disabled || !isActive}
                title={
                  isActive
                    ? undefined
                    : 'This API key was minted with a different nonce.'
                }
                className={`
                  inline-flex items-center justify-center auth-secondary-button px-3 py-1 text-xs font-semibold
                  tracking-[0.2em] uppercase
                  enabled:hover:border-destructive/40 enabled:hover:bg-destructive/10 enabled:hover:text-destructive
                `}
              >
                {isActive ? 'Revoke' : 'Different nonce'}
              </button>
            </div>
          )
        })}
      </div>

      {helper && !error && <p className="text-sm text-emerald-300">{helper}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
