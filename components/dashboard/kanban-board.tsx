'use client'

import { Clock, User } from 'lucide-react'
import { useStore } from '@/lib/store'
import { STAGE_TYPES, type StageKey } from '@/lib/types'
import {
  currentStage,
  derivedStatus,
  isLate,
  waitingSince,
} from '@/lib/order-utils'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'

export function KanbanBoard({
  onSelect,
}: {
  onSelect: (orderId: string) => void
}) {
  const { orders, contactById } = useStore()
  const active = orders.filter((o) => o.status === 'active')

  // STAGE_TYPES'tan dinamik sütun haritası — yeni tip eklendiğinde otomatik görünür
  const byColumn = Object.fromEntries(
    STAGE_TYPES.map((s) => [s.key, [] as typeof active]),
  ) as Record<StageKey, typeof active>

  for (const order of active) {
    const stage = currentStage(order)
    if (stage && stage.stageKey in byColumn) {
      byColumn[stage.stageKey].push(order)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGE_TYPES.map((col, i) => {
        const items = byColumn[col.key]
        return (
          <div
            key={col.key}
            className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold">{col.label}</h3>
              </div>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                {items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Bu istasyonda iş yok
                </p>
              )}
              {items.map((order) => {
                const stage = currentStage(order)
                const usta = contactById(stage?.assignedContactId ?? null)
                const late = isLate(order)
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onSelect(order.id)}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                      late && 'ring-1 ring-status-late-foreground/30',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {order.orderCode}
                      </span>
                      <StatusBadge status={derivedStatus(order)} />
                    </div>
                    <p className="text-pretty text-sm font-medium leading-snug">
                      {order.productTitle}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="size-3.5" />
                        {usta ? usta.fullName : 'Usta atanmadı'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {waitingSince(stage?.startedAt ?? null)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
