'use client'

import { useMemo, useState } from 'react'
import { Search, Archive, Check, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, formatDateTime } from '@/lib/order-utils'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { STAGE_TYPES } from '@/lib/types'

export default function GecmisPage() {
  const { orders, contactById } = useStore()
  const [query, setQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Sadece tüm aşamaları tamamlanmış siparişler (status === 'completed' veya her aşaması completed olanlar)
  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed' || o.stages.every(s => s.status === 'completed'))
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return completedOrders

    return completedOrders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q) ||
        (o.clientName?.toLowerCase().includes(q) ?? false)
    )
  }, [completedOrders, query])

  const selectedOrder = useMemo(
    () => completedOrders.find((o) => o.id === selectedOrderId),
    [completedOrders, selectedOrderId]
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden gap-6">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Geçmiş İşler (Arşiv)</h1>
        <p className="text-sm text-muted-foreground">
          Tüm üretim ve sevkiyat aşamaları başarıyla tamamlanmış geçmiş siparişler.
        </p>
      </div>

      <div className="flex w-full sm:w-96 relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sipariş no, ürün veya müşteri ara..."
          className="pl-9 bg-card"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border bg-card shadow-sm pb-24 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {filtered.length === 0 ? (
          <div className="p-16">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Archive />
                </EmptyMedia>
                <EmptyTitle>Kayıt Yok</EmptyTitle>
                <EmptyDescription>
                  Arşivde görüntüleyecek tamamlanmış sipariş bulunamadı veya aramaya uygun eşleşme yok.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Sipariş No</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Teslim Tarihi</TableHead>
                <TableHead>Aşamalar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const lastStage = order.stages[order.stages.length - 1]
                
                return (
                  <TableRow 
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {order.orderCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {order.productTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.clientName || '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lastStage?.completedAt ? formatDate(lastStage.completedAt) : (order.deadline ? formatDate(order.deadline) : '—')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                        {order.stages.length} Aşama
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Arşiv Detay Modalı */}
      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0">
          <div className="p-5 border-b border-border bg-muted/30">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {selectedOrder?.orderCode}
                  </span>
                  <span className="text-lg tracking-tight">{selectedOrder?.productTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                  <span>Müşteri: <span className="font-medium text-foreground">{selectedOrder?.clientName || '—'}</span></span>
                  <span>·</span>
                  <span>Teslim: {selectedOrder?.deadline ? formatDate(selectedOrder.deadline) : 'Belirtilmedi'}</span>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {selectedOrder?.notes && (
              <div className="mb-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Sipariş Notu</p>
                <p className="text-muted-foreground">{selectedOrder.notes}</p>
              </div>
            )}
            
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Tamamlanan Aşamalar
            </h4>
            
            <div className="space-y-3 relative">
              {selectedOrder?.stages.map((stage) => {
                const usta = contactById(stage.assignedContactId)
                const stageDef = STAGE_TYPES.find(s => s.key === stage.stageKey)
                
                return (
                  <div key={stage.id} className="flex gap-4 p-3.5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-colors">
                    <div className="mt-0.5 flex shrink-0 items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500 ring-2 ring-background">
                      <Check className="size-3.5" strokeWidth={3} />
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {stage.stageOrder}. {stageDef?.label || stage.stageName}
                        </span>
                        {stage.completedAt && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {formatDateTime(stage.completedAt)}
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
    </div>
  )
}
