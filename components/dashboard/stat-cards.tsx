'use client'

import { useState } from 'react'
import { ClipboardList, AlertCircle, CalendarClock, Truck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/lib/store'
import { isLate } from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import { TRANSFER_STATUS_LABELS } from '@/lib/types'

function isDueThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return d >= today && d <= in7Days
}

export function StatCards() {
  const { orders, transfers, contactById } = useStore()
  const [selectedStatId, setSelectedStatId] = useState<string | null>(null)

  // 1. TOPLAM AKTİF
  const activeOrders = orders.filter((o) => o.status === 'active')

  // 2. GECİKENLER
  const lateOrders = activeOrders.filter(isLate)

  // 3. BU HAFTA
  const dueThisWeek = activeOrders.filter((o) => isDueThisWeek(o.deadline))

  // 4. TRANSFER BEKLEYENLER (Filtre düzeltildi)
  const waitingTransfers = transfers.filter((t) => {
    // Sadece aktif transfer durumları
    if (t.status !== 'waiting_pickup' && t.status !== 'on_the_way') return false
    
    const order = orders.find((o) => o.id === t.orderId)
    if (!order || order.status !== 'active') return false

    const fromStage = order.stages.find((s) => s.id === t.fromStageId)
    const toStage = order.stages.find((s) => s.id === t.toStageId)

    const isFromCompleted = fromStage ? fromStage.status === 'completed' : true
    const isToPending = toStage ? toStage.status === 'pending' : true

    // "Bir önceki aşama bitmiş ve hedef henüz başlamamış" kuralı
    return isFromCompleted && isToPending
  })

  const stats = [
    {
      id: 'active',
      label: 'Toplam Aktif Sipariş',
      value: activeOrders.length,
      icon: ClipboardList,
      tint: 'text-brand',
      bg: 'bg-brand/10',
      type: 'order',
      items: activeOrders,
    },
    {
      id: 'late',
      label: 'Geciken Siparişler',
      value: lateOrders.length,
      icon: AlertCircle,
      tint: 'text-destructive',
      bg: 'bg-destructive/10',
      type: 'order',
      items: lateOrders,
    },
    {
      id: 'due',
      label: 'Bu Hafta Teslim',
      value: dueThisWeek.length,
      icon: CalendarClock,
      tint: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      type: 'order',
      items: dueThisWeek,
    },
    {
      id: 'transfer',
      label: 'Transfer Bekleyenler',
      value: waitingTransfers.length,
      icon: Truck,
      tint: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      type: 'transfer',
      items: waitingTransfers,
    },
  ]

  const activeStat = stats.find((s) => s.id === selectedStatId)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          const isSelected = selectedStatId === s.id
          
          return (
            <div
              key={s.id}
              onClick={() => setSelectedStatId(s.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/50',
                isSelected ? 'border-primary ring-1 ring-primary' : 'border-border'
              )}
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", s.bg)}>
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

      {/* Drill-down Modal */}
      <Dialog open={!!selectedStatId} onOpenChange={(open) => !open && setSelectedStatId(null)}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-0">
          <div className="p-5 border-b border-border bg-muted/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                {activeStat?.icon && <activeStat.icon className={cn('size-5', activeStat.tint)} />}
                {activeStat?.label} Detayları
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {!activeStat?.items || activeStat.items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm font-medium">
                Bu kriterde kayıt bulunmuyor.
              </div>
            ) : activeStat.type === 'order' ? (
              // SİPARİŞ LİSTESİ
              (activeStat.items as typeof orders).map((o) => {
                const currentStage = o.stages.find(s => s.status === 'in_progress') || o.stages.find(s => s.status === 'pending')
                const usta = contactById(currentStage?.assignedContactId || null)
                
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-secondary">{o.orderCode}</span>
                        <span className="font-medium text-sm">{o.productTitle}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {currentStage ? `Şu an: ${currentStage.stageName}` : 'Beklemede'} 
                        {usta && ` · ${usta.fullName}`}
                      </p>
                    </div>
                    {isLate(o) && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 bg-destructive/5 shrink-0">
                        Gecikmede
                      </Badge>
                    )}
                  </div>
                )
              })
            ) : (
              // TRANSFER LİSTESİ
              (activeStat.items as typeof transfers).map((t) => {
                const order = orders.find(o => o.id === t.orderId)
                const driver = contactById(t.driverId)
                
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-secondary">{order?.orderCode ?? 'Bilinmiyor'}</span>
                        <span className="font-medium text-sm">{order?.productTitle ?? 'Bilinmiyor'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Şoför: <span className="font-medium text-foreground">{driver?.fullName ?? 'Atanmadı'}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {TRANSFER_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
