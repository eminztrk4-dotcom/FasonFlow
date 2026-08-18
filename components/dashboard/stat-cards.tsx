'use client'

import { ClipboardList, AlertCircle, CalendarClock, Truck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { isLate } from '@/lib/order-utils'
import { cn } from '@/lib/utils'

function isDueThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return d >= today && d <= in7Days
}

export function StatCards() {
  const { orders, transfers } = useStore()

  const active = orders.filter((o) => o.status === 'active')
  const lateOrders = active.filter(isLate).length
  const dueThisWeek = active.filter((o) => isDueThisWeek(o.deadline)).length
  const waitingTransfer = transfers.filter(
    (t) => t.status === 'waiting_pickup',
  ).length

  const stats = [
    {
      label: 'Toplam Aktif Sipariş',
      value: active.length,
      icon: ClipboardList,
      tint: 'text-brand',
    },
    {
      label: 'Geciken Siparişler',
      value: lateOrders,
      icon: AlertCircle,
      tint: 'text-destructive',
    },
    {
      label: 'Bu Hafta Teslim Edilecekler',
      value: dueThisWeek,
      icon: CalendarClock,
      tint: 'text-orange-500',
    },
    {
      label: 'Transfer Bekleyenler',
      value: waitingTransfer,
      icon: Truck,
      tint: 'text-blue-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Icon className={cn('size-5', s.tint)} />
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none tracking-tight">
                {s.value}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
