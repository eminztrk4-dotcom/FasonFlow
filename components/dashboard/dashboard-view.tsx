'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Table2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StatCards } from './stat-cards'
import { KanbanBoard } from './kanban-board'
import { OrderTable } from './order-table'
import { QuickUpdateDialog } from './quick-update-dialog'
import { useStore } from '@/lib/store'

export function DashboardView() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [selected, setSelected] = useState<string | null>(null)
  const { loading, error } = useStore()

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Canlı Üretim Takibi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            İskelet → Boya → Döşeme → Sevkiyat akışını tek ekrandan izleyin.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/siparis-olustur" />}>
          <Plus data-icon="inline-start" />
          Yeni Sipariş
        </Button>
      </div>

      <StatCards />

      <div className="flex items-center justify-between">
        <ToggleGroup
          variant="outline"
          value={[view]}
          onValueChange={(vals: string[]) => {
            const next = vals[0] as 'kanban' | 'table' | undefined
            if (next) setView(next)
          }}
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban görünümü">
            <LayoutGrid data-icon="inline-start" />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Tablo görünümü">
            <Table2 data-icon="inline-start" />
            Tablo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard onSelect={setSelected} />
      ) : (
        <OrderTable onSelect={setSelected} />
      )}

      <QuickUpdateDialog
        orderId={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
