'use client'

import { useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Clock, User, Calendar, AlertTriangle, Pencil, Hammer, Paintbrush, Scissors, Wrench, Cpu, Disc3, Box, Layers, Truck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { STAGE_TYPES, type StageKey, type Order, type Contact } from '@/lib/types'
import {
  currentStage,
  derivedStatus,
  formatDate,
  isLate,
  waitingSince,
} from '@/lib/order-utils'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'

const STAGE_UI: Record<StageKey, { icon: any; color: string }> = {
  iskelet: { icon: Hammer, color: 'text-yellow-600 dark:text-yellow-500' },
  boya: { icon: Paintbrush, color: 'text-emerald-600 dark:text-emerald-500' },
  doseme: { icon: Scissors, color: 'text-indigo-600 dark:text-indigo-500' },
  metal: { icon: Wrench, color: 'text-orange-600 dark:text-orange-500' },
  cnc: { icon: Cpu, color: 'text-cyan-600 dark:text-cyan-500' },
  torna: { icon: Disc3, color: 'text-amber-600 dark:text-amber-500' },
  marble_glass: { icon: Box, color: 'text-sky-600 dark:text-sky-500' },
  assembly: { icon: Layers, color: 'text-purple-600 dark:text-purple-500' },
  sevkiyat: { icon: Truck, color: 'text-slate-600 dark:text-slate-500' },
}

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

export function KanbanBoard({
  onSelect,
  onUpdate,
  query = '',
}: {
  onSelect: (orderId: string) => void
  onUpdate: (orderId: string) => void
  query?: string
}) {
  const { orders = [], contactById } = useStore()

  const byColumn = useMemo(() => {
    let active = (Array.isArray(orders) ? orders : []).filter(
      (o) => o.status !== 'completed' && derivedStatus(o) !== 'completed',
    )

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      active = active.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.productTitle.toLowerCase().includes(q) ||
          (o.clientName?.toLowerCase().includes(q) ?? false),
      )
    }

    const columns = Object.fromEntries(
      STAGE_TYPES.map((s) => [s.key, [] as typeof active]),
    ) as Record<StageKey, typeof active>

    for (const order of active) {
      const stage = currentStage(order)
      if (stage && stage.stageKey in columns) {
        columns[stage.stageKey].push(order)
      }
    }

    return columns
  }, [orders, query])

  // Termin tarihi uyarı göstergesi
  const getDeadlineIndicator = (deadlineStr?: string | null) => {
    if (!deadlineStr) return null

    const deadline = new Date(deadlineStr)
    deadline.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
          <AlertTriangle className="size-3" />
          {formatDate(deadlineStr)} (Gecikti)
        </span>
      )
    }

    if (diffDays <= 2) {
      return (
        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="size-3" />
          {formatDate(deadlineStr)} ({diffDays === 0 ? 'Bugün' : `${diffDays}g kaldı`})
        </span>
      )
    }

    return (
      <span className="flex items-center gap-1">
        <Calendar className="size-3" />
        {formatDate(deadlineStr)}
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {STAGE_TYPES.map((col, i) => (
        <KanbanColumn 
          key={col.key}
          col={col}
          i={i}
          items={byColumn[col.key]}
          onSelect={onSelect}
          onUpdate={onUpdate}
          contactById={contactById}
          getDeadlineIndicator={getDeadlineIndicator}
        />
      ))}
    </div>
  )
}

function KanbanColumn({
  col,
  i,
  items,
  onSelect,
  onUpdate,
  contactById,
  getDeadlineIndicator
}: {
  col: typeof STAGE_TYPES[0]
  i: number
  items: Order[]
  onSelect: (id: string) => void
  onUpdate: (id: string) => void
  contactById: (id: string | null) => Contact | undefined
  getDeadlineIndicator: (deadlineStr?: string | null) => React.ReactNode
}) {
  const [parent] = useAutoAnimate()
  const ui = STAGE_UI[col.key]
  const Icon = ui.icon
  const isEmpty = items.length === 0

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-2 transition-colors",
        isEmpty 
          ? "border-dashed border-border/60 bg-transparent" 
          : "border-border bg-muted/20"
      )}
    >
      <div className="bg-card text-card-foreground border-b border-border/60 py-2 px-3 flex items-center justify-between -mx-2 -mt-2 mb-2 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-foreground">
            {i + 1}
          </span>
          <Icon className={cn("size-4", ui.color)} />
          <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
        </div>
        <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-md">
          {items.length}
        </span>
      </div>

      <div ref={parent} className="flex flex-col gap-2">
        {isEmpty && (
          <div className="h-12 flex items-center justify-center text-[10px] text-muted-foreground/40 font-medium">
            Bu istasyonda aktif iş yok
          </div>
        )}
        {items.map((order) => {
          const stage = currentStage(order)
          const usta = contactById(stage?.assignedContactId ?? null)
          const late = isLate(order)
          const statusStr = derivedStatus(order)
          const statusAccent = 
            statusStr === 'in_progress' ? 'bg-amber-500' :
            statusStr === 'pending' ? 'bg-slate-300 dark:bg-slate-600' :
            statusStr === 'late' ? 'bg-red-500' : 'bg-emerald-500'

          return (
            <div
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(order.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(order.id)
                }
              }}
              className={cn(
                'cursor-pointer flex flex-col gap-2 rounded-lg border border-border/80 bg-background p-3 pl-4 text-left shadow-sm transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary relative overflow-hidden',
                late && 'ring-1 ring-red-500/50 dark:ring-red-900',
              )}
            >
              <div className={cn("absolute left-0 top-0 bottom-0 w-1", statusAccent)} />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                    {order.orderCode}
                  </span>
                  {statusStr === 'in_progress' && (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs px-2 py-0.5 rounded">
                      İşlemde
                    </span>
                  )}
                  {statusStr === 'pending' && (
                    <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 font-medium text-xs px-2 py-0.5 rounded">
                      Beklemede
                    </span>
                  )}
                  {statusStr === 'late' && (
                    <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-xs px-2 py-0.5 rounded">
                      Gecikti
                    </span>
                  )}
                  {statusStr === 'completed' && (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs px-2 py-0.5 rounded">
                      Tamamlandı
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate(order.id)
                  }}
                  className="flex items-center justify-center size-6 rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors shrink-0"
                  title="Aşama Güncelle"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>

              <div>
                <p className="text-pretty text-sm font-semibold text-foreground leading-snug">
                  {order.productTitle}
                </p>
                {order.clientName && (
                  <p className="truncate text-[11px] text-muted-foreground font-medium">
                    {order.clientName}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {usta ? (
                    <div className="flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                        {initials(usta.fullName)}
                      </span>
                      <span className="font-medium text-foreground">{usta.fullName}</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 italic text-muted-foreground/70">
                      <User className="size-3.5" />
                      Usta atanmadı
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-0.5">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="size-3 text-muted-foreground/60" />
                    {waitingSince(stage?.startedAt ?? null)}
                  </span>
                  {order.deadline && (
                    <div className="text-[10px]">
                      {getDeadlineIndicator(order.deadline)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}