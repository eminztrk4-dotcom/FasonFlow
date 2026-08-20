'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Table2, Plus, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StatCards } from './stat-cards'
import { KanbanBoard } from './kanban-board'
import { OrderTable } from './order-table'
import { QuickUpdateDialog } from './quick-update-dialog'
import { OrderDetailsDialog } from './order-details-dialog'
import { useStore } from '@/lib/store'

export function DashboardView() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null)
  const [updateOrderId, setUpdateOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { loading, error } = useStore()

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden gap-4">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0">
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

      <div className="shrink-0">
        <StatCards />
      </div>

      <div className="flex items-center justify-between shrink-0">
        <div className="bg-muted/70 p-1 rounded-lg border border-border/40 inline-flex items-center gap-1">
          <button
            onClick={() => setView('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-150 active:scale-[0.97] ${
              view === 'kanban'
                ? 'bg-background text-foreground shadow-sm font-semibold border border-border/50'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium border border-transparent'
            }`}
          >
            <LayoutGrid className="size-4" />
            Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-150 active:scale-[0.97] ${
              view === 'table'
                ? 'bg-background text-foreground shadow-sm font-semibold border border-border/50'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium border border-transparent'
            }`}
          >
            <Table2 className="size-4" />
            Tablo
          </button>
        </div>
        
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sipariş no veya müşteri ara..."
            className="pl-9 h-9 w-full sm:w-64"
          />
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 min-h-0 rounded-xl border border-border bg-slate-50/50 p-2 pb-24 dark:bg-muted/10 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <KanbanBoard onSelect={setDetailsOrderId} onUpdate={setUpdateOrderId} query={searchQuery} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border bg-card pb-24 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <OrderTable onSelect={setDetailsOrderId} onUpdate={setUpdateOrderId} query={searchQuery} />
        </div>
      )}

      <QuickUpdateDialog
        orderId={updateOrderId}
        onClose={() => setUpdateOrderId(null)}
      />
      <OrderDetailsDialog
        orderId={detailsOrderId}
        onClose={() => setDetailsOrderId(null)}
      />
    </div>
  )
}
