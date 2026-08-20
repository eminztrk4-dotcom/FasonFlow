'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, CheckCircle2, Clock, Loader } from 'lucide-react'
import { useStore } from '@/lib/store'
import { STAGE_TYPES, type StageStatus } from '@/lib/types'
import { formatDate, formatDateTime } from '@/lib/order-utils'

const stepIcon: Record<StageStatus, typeof Check> = {
  pending: Clock,
  in_progress: Loader,
  completed: Check,
}

const stepColor: Record<StageStatus, string> = {
  pending: 'bg-muted text-muted-foreground ring-muted-foreground/20',
  in_progress: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500 ring-blue-500/20',
  completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500 ring-emerald-500/20',
}

export function OrderDetailsDialog({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  const { orderById, contactById } = useStore()
  const order = orderId ? orderById(orderId) : undefined

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0">
        <div className="p-5 border-b border-border bg-muted/30">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  {order?.orderCode}
                </span>
                <span className="text-lg tracking-tight">{order?.productTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                <span>Müşteri: <span className="font-medium text-foreground">{order?.clientName || '—'}</span></span>
                <span>·</span>
                <span>Teslim: {order?.deadline ? formatDate(order.deadline) : 'Belirtilmedi'}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          {order?.notes && (
            <div className="mb-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Sipariş Notu</p>
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          )}
          
          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            Sipariş Aşamaları
          </h4>
          
          <div className="space-y-3 relative">
            {order?.stages.map((stage) => {
              const usta = contactById(stage.assignedContactId)
              const stageDef = STAGE_TYPES.find(s => s.key === stage.stageKey)
              const Icon = stepIcon[stage.status]
              const colorClass = stepColor[stage.status]
              
              return (
                <div key={stage.id} className="flex gap-4 p-3.5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-colors">
                  <div className={`mt-0.5 flex shrink-0 items-center justify-center size-6 rounded-full ring-2 ring-background ${colorClass}`}>
                    <Icon className={`size-3.5 ${stage.status === 'in_progress' ? 'animate-spin' : ''}`} strokeWidth={3} />
                  </div>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {stage.stageOrder}. {stageDef?.label || stage.stageName}
                      </span>
                      {stage.status === 'completed' && stage.completedAt && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {formatDateTime(stage.completedAt)}
                        </span>
                      )}
                      {stage.status === 'in_progress' && stage.startedAt && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-400">
                          {formatDateTime(stage.startedAt)}'den beri
                        </span>
                      )}
                      {stage.status === 'pending' && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          Beklemede
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></span>
                      Sorumlu: <span className="font-medium text-foreground">{usta?.fullName || 'Bilinmiyor / Atanmadı'}</span>
                    </p>
                    
                    {stage.notes && (
                      <div className="mt-2.5 p-2 rounded-md bg-muted/50 border border-border/50 text-xs text-muted-foreground italic">
                        "{stage.notes}"
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
