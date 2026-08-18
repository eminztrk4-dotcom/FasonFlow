'use client'

import { useState } from 'react'
import { Check, Circle, Loader, ArrowRight, Info } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  STAGE_STATUS_LABELS,
  STAGE_TYPES,
  type OrderStage,
  type Order,
  type StageStatus,
} from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { derivedStatus, formatDate } from '@/lib/order-utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_FLOW: StageStatus[] = ['pending', 'in_progress', 'completed']

const stepIcon: Record<StageStatus, typeof Check> = {
  pending: Circle,
  in_progress: Loader,
  completed: Check,
}

export function QuickUpdateDialog({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  const { orderById } = useStore()
  const order = orderId ? orderById(orderId) : undefined

  return (
    <Dialog open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-5">
        {order && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                  {order.orderCode}
                </span>
                <StatusBadge status={derivedStatus(order)} />
              </div>
              <DialogTitle className="text-pretty text-base">
                {order.productTitle}
              </DialogTitle>
              <DialogDescription>
                {order.clientName ?? 'Müşteri belirtilmedi'} · Termin{' '}
                {formatDate(order.deadline)}
              </DialogDescription>
              {order.notes && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-50/50 p-3 text-sm text-blue-900 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800/30">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </DialogHeader>

            <Separator />

            <div className="flex flex-col min-h-0">
              <p className="text-[11px] font-medium text-muted-foreground mb-2">
                Aşamalar — ustaya ulaşılamıyorsa durumu manuel ilerletin
              </p>
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                {order.stages.map((stage, index) => {
                  const prevStage = index > 0 ? order.stages[index - 1] : null
                  const isWaitingPrev = prevStage ? prevStage.status !== 'completed' : false

                  return (
                    <StageRow
                      key={stage.id}
                      stage={stage}
                      order={order}
                      isWaitingPrev={isWaitingPrev}
                    />
                  )
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StageRow({
  stage,
  order,
  isWaitingPrev,
}: {
  stage: OrderStage
  order: Order
  isWaitingPrev: boolean
}) {
  const { contacts, contactById, setStageStatus, setStageDetails } = useStore()
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(stage.notes || '')

  const usta = contactById(stage.assignedContactId)
  const Icon = stepIcon[stage.status]
  const stageDef = STAGE_TYPES.find((t) => t.key === stage.stageKey)
  let eligibleContacts = contacts.filter((c) => stageDef && c.roles?.includes(stageDef.role))
  
  // Mevcut atanan usta listeye role uymadığı için girmediyse (veya eski data) ekle:
  if (usta && !eligibleContacts.some(c => c.id === usta.id)) {
    eligibleContacts = [usta, ...eligibleContacts]
  }

  const handleNotesBlur = async () => {
    if (notes.trim() === (stage.notes || '')) return
    try {
      await setStageDetails(order.id, stage.id, { notes: notes.trim() || null })
      toast.success('Not güncellendi')
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : 'Bilinmeyen hata'))
      setNotes(stage.notes || '')
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border p-2 bg-card">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            stage.status === 'completed' &&
              'bg-status-done text-status-done-foreground',
            stage.status === 'in_progress' &&
              'bg-status-progress text-status-progress-foreground',
            stage.status === 'pending' &&
              'bg-status-pending text-status-pending-foreground',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <p className="truncate text-sm font-medium">
            {stage.stageOrder}. {stage.stageName}
          </p>
          {stage.status !== 'completed' ? (
            <div>
              <Select
                value={stage.assignedContactId ?? 'unassigned'}
                onValueChange={async (val) => {
                  const contactId = val === 'unassigned' ? null : val
                  try {
                    await setStageDetails(order.id, stage.id, { assignedContactId: contactId })
                    toast.success('Usta ataması güncellendi')
                  } catch (e: unknown) {
                    toast.error('Hata: ' + (e instanceof Error ? e.message : 'Bilinmeyen hata'))
                  }
                }}
              >
                <SelectTrigger className="h-7 w-full min-w-[220px] max-w-[280px] text-xs pr-8">
                  <SelectValue placeholder="Usta Seç">
                    <span className="block truncate">
                      {usta
                        ? `${usta.fullName}${usta.workshopName ? ` · ${usta.workshopName}` : ''}`
                        : stage.assignedContactId
                          ? 'Bilinmeyen Usta (Silinmiş)'
                          : 'Atanmadı'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unassigned" className="text-muted-foreground italic">Atanmadı</SelectItem>
                    {eligibleContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}{c.workshopName ? ` · ${c.workshopName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="truncate text-xs text-muted-foreground">
              {usta
                ? `${usta.fullName}${usta.workshopName ? ` · ${usta.workshopName}` : ''}`
                : 'Usta atanmadı'}{' '}
              · {STAGE_STATUS_LABELS[stage.status]}
            </p>
          )}
        </div>
        {stage.status !== 'completed' && (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              variant={stage.status === 'pending' ? 'outline' : 'default'}
              onClick={async () => {
                const next = stage.status === 'pending' ? 'in_progress' : 'completed'
                setUpdating(true)
                try {
                  await setStageStatus(order.id, stage.id, next)
                  toast.success(
                    `${order.orderCode} · ${stage.stageName} → ${STAGE_STATUS_LABELS[next]}`,
                  )
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Hata'
                  toast.error(`Güncellenemedi: ${msg}`)
                } finally {
                  setUpdating(false)
                }
              }}
              disabled={updating || isWaitingPrev}
            >
              {stage.status === 'pending' ? 'Başlat' : 'Bitir'}
              <ArrowRight data-icon="inline-end" />
            </Button>
            {isWaitingPrev && (
              <span className="text-[10px] text-muted-foreground font-medium">
                Önceki aşama bekleniyor
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Aşama notu / Kim ne yapacak?"
          className="h-7 text-xs bg-muted/30 border-transparent hover:border-border focus:border-border focus:bg-background transition-colors"
        />
      </div>
    </div>
  )
}

export { STATUS_FLOW }
