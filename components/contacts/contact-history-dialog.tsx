'use client'

import { useMemo } from 'react'
import {
  Phone,
  MapPin,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  ExternalLink,
  Package,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  STAGE_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
  type Contact,
  type Order,
  type OrderStage,
  type StageStatus,
  type Transfer,
} from '@/lib/types'
import { formatDate } from '@/lib/order-utils'
import { cn } from '@/lib/utils'
import { EditContactDialog } from './edit-contact-dialog'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface AssignedStageItem {
  order: Order
  stage: OrderStage
  isLate: boolean
}

const stageStatusStyles: Record<StageStatus, { wrap: string; dot: string }> = {
  pending: {
    wrap: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  in_progress: {
    wrap: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  completed: {
    wrap: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
}

export function ContactHistoryDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { orders, transfers } = useStore()

  // Contact'a atanmış tüm aşamalar
  const assignedStages = useMemo<AssignedStageItem[]>(() => {
    if (!contact) return []
    const now = Date.now()
    const list: AssignedStageItem[] = []

    for (const order of orders) {
      for (const stage of order.stages) {
        if (stage.assignedContactId === contact.id) {
          const isLate =
            stage.status !== 'completed' &&
            Boolean(order.deadline && new Date(order.deadline).getTime() < now)
          list.push({ order, stage, isLate })
        }
      }
    }

    return list
  }, [contact, orders])

  // Şoför için transferler
  const driverTransfers = useMemo<Transfer[]>(() => {
    if (!contact || !contact.roles?.includes('driver')) return []
    return transfers.filter((t) => t.driverId === contact.id)
  }, [contact, transfers])

  const activeStages = useMemo(
    () => assignedStages.filter((i) => i.stage.status !== 'completed'),
    [assignedStages],
  )

  const completedStages = useMemo(
    () => assignedStages.filter((i) => i.stage.status === 'completed'),
    [assignedStages],
  )

  const lateStages = useMemo(
    () => assignedStages.filter((i) => i.isLate),
    [assignedStages],
  )

  const activeTransfers = useMemo(
    () => driverTransfers.filter((t) => t.status !== 'delivered'),
    [driverTransfers],
  )

  const completedTransfers = useMemo(
    () => driverTransfers.filter((t) => t.status === 'delivered'),
    [driverTransfers],
  )

  if (!contact) return null

  const isDriver = contact.roles?.includes('driver')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        {/* Header / Profile Summary */}
        <div className="p-6 bg-muted/40 border-b border-border">
          <DialogHeader className="gap-1 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14 ring-2 ring-background shadow-sm">
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.fullName}
                      className="aspect-square size-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                      {initials(contact.fullName)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold tracking-tight">
                      {contact.fullName}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {contact.roles?.map((r) => (
                        <span
                          key={r}
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            ROLE_COLORS[r],
                          )}
                        >
                          {ROLE_LABELS[r]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">
                    {contact.workshopName ? `${contact.workshopName} Atölyesi` : 'Bağımsız Usta'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <EditContactDialog contact={contact} />
              </div>
            </div>

            {/* Contact Details info bar */}
            <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground">
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Phone className="size-3.5 text-primary shrink-0" />
                <span className="font-medium">{contact.phone}</span>
                <ExternalLink className="size-3 opacity-60 ml-auto" />
              </a>

              <div className="flex items-center gap-2">
                <Send
                  className={cn(
                    'size-3.5 shrink-0',
                    contact.telegramConnected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground',
                  )}
                />
                <span>
                  {contact.telegramConnected ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Telegram Bildirimleri Aktif
                    </span>
                  ) : (
                    <span>Telegram Bağlantısı Yok</span>
                  )}
                </span>
              </div>

              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="size-3.5 text-primary shrink-0 translate-y-0.5" />
                <span className="text-pretty line-clamp-1">{contact.address}</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* KPI / Metric Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-background border-b border-border">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {isDriver ? activeTransfers.length + activeStages.length : activeStages.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              Aktif İşler
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-center">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isDriver ? completedTransfers.length + completedStages.length : completedStages.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              Tamamlanan
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-rose-500/5 border border-rose-500/15 text-center">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {lateStages.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              Geciken İşler
            </span>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="active" className="text-xs sm:text-sm">
                Aktif İşler ({activeStages.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Tamamlanan ({completedStages.length})
              </TabsTrigger>
              <TabsTrigger value="late" className="text-xs sm:text-sm">
                Gecikenler ({lateStages.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: AKTİF İŞLER */}
            <TabsContent value="active" className="space-y-3 mt-0">
              {activeStages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Package className="size-10 mx-auto opacity-30 mb-2" />
                  <p className="font-medium text-sm">Şu an atanmış aktif iş bulunmuyor.</p>
                  <p className="text-xs opacity-75 mt-0.5">Usta yeni siparişlere atanabilir durumda.</p>
                </div>
              ) : (
                activeStages.map(({ order, stage, isLate }) => (
                  <div
                    key={stage.id}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 bg-card',
                      isLate
                        ? 'border-rose-500/30 bg-rose-500/[0.02]'
                        : 'border-border hover:border-border/80',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                            {order.orderCode}
                          </span>
                          <span className="font-semibold text-sm truncate">
                            {order.productTitle}
                          </span>
                          {order.clientName && (
                            <span className="text-xs text-muted-foreground">
                              ({order.clientName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-xs font-medium bg-muted/50">
                            Aşama: {stage.stageName}
                          </Badge>
                          {isLate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <AlertTriangle className="size-3" />
                              Gecikmiş
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            stageStatusStyles[stage.status].wrap,
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              stageStatusStyles[stage.status].dot,
                            )}
                          />
                          {STAGE_STATUS_LABELS[stage.status]}
                        </span>
                      </div>
                    </div>

                    {stage.notes && (
                      <div className="flex items-start gap-1.5 text-xs bg-muted/40 p-2 rounded-md text-muted-foreground">
                        <FileText className="size-3.5 shrink-0 mt-0.5 text-primary/70" />
                        <span>{stage.notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        Termin: {order.deadline ? formatDate(order.deadline) : 'Belirtilmedi'}
                      </span>
                      {stage.startedAt && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="size-3 text-muted-foreground" />
                          Başlama: {formatDate(stage.startedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB: TAMAMLANANLAR */}
            <TabsContent value="completed" className="space-y-3 mt-0">
              {completedStages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="size-10 mx-auto opacity-30 mb-2" />
                  <p className="font-medium text-sm">Henüz tamamlanmış bir iş kaydı yok.</p>
                </div>
              ) : (
                completedStages.map(({ order, stage }) => (
                  <div
                    key={stage.id}
                    className="p-3.5 rounded-xl border border-border bg-card flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                            {order.orderCode}
                          </span>
                          <span className="font-semibold text-sm truncate">
                            {order.productTitle}
                          </span>
                          {order.clientName && (
                            <span className="text-xs text-muted-foreground">
                              ({order.clientName})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aşama: <span className="font-medium text-foreground">{stage.stageName}</span>
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="size-3" />
                        Tamamlandı
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <span>Müşteri: {order.clientName ?? '—'}</span>
                      {stage.completedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Bitiş: {formatDate(stage.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB: GECİKENLER */}
            <TabsContent value="late" className="space-y-3 mt-0">
              {lateStages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="size-10 mx-auto text-emerald-500/40 mb-2" />
                  <p className="font-medium text-sm text-foreground">Geciken sipariş bulunmuyor!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tüm aktif işler termin süresi içinde ilerliyor.</p>
                </div>
              ) : (
                lateStages.map(({ order, stage }) => (
                  <div
                    key={stage.id}
                    className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.03] flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                            {order.orderCode}
                          </span>
                          <span className="font-semibold text-sm">
                            {order.productTitle}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                          Aşama: {stage.stageName} ({STAGE_STATUS_LABELS[stage.status]})
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                        <AlertTriangle className="size-3" />
                        Gecikmede
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-rose-500/10">
                      <span className="text-rose-600 font-medium">
                        Termin Tarihi: {formatDate(order.deadline)}
                      </span>
                      <span>Müşteri: {order.clientName ?? '—'}</span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* If Driver: Extra Transfer Information */}
          {isDriver && driverTransfers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="size-4 text-primary" />
                <h4 className="text-sm font-semibold">Sevkiyat & Transfer Görevleri</h4>
              </div>
              <div className="space-y-2">
                {driverTransfers.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">Transfer #{t.id.slice(0, 6)}</span>
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {TRANSFER_STATUS_LABELS[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
