"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import { TRANSFER_STATUS_LABELS, type Transfer, type TransferStatus } from "@/lib/types"
import { formatDateTime } from "@/lib/order-utils"
import { toast } from "sonner"
import { TruckIcon, PackageIcon, MapPinIcon, ArrowRightIcon, ClockIcon } from "lucide-react"

const COLUMNS: { key: TransferStatus; accent: string }[] = [
  { key: "waiting_pickup", accent: "bg-status-pending text-status-pending-foreground" },
  { key: "on_the_way", accent: "bg-status-progress text-status-progress-foreground" },
  { key: "delivered", accent: "bg-status-done text-status-done-foreground" },
]

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

export function TransfersView() {
  const { transfers, orders, contactById, setTransferStatus } = useStore()
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  const orderMap = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders])

  const grouped = useMemo(() => {
    const g: Record<TransferStatus, Transfer[]> = {
      waiting_pickup: [],
      on_the_way: [],
      delivered: [],
    }
    
    for (const t of transfers) {
      const order = orderMap.get(t.orderId)
      if (!order) continue
      
      const fromStage = order.stages.find(s => s.id === t.fromStageId)
      const toStage = order.stages.find(s => s.id === t.toStageId)
      
      const isFromCompleted = fromStage ? fromStage.status === 'completed' : true
      const isToPending = toStage ? toStage.status === 'pending' : true
      const isToCompleted = toStage ? toStage.status === 'completed' : false

      // 1 & 3. Kural: Henüz sırası gelmemiş (fromStage tamamlanmamış) gelecekteki transferleri gizle.
      if (!isFromCompleted) continue
      
      // 2. Kural: Hedef istasyon çoktan tamamlanmışsa (eski/geçmiş transfer), panoda kalabalık yapmasın, gizle.
      if (isToCompleted) continue

      // Hedef istasyon "in_progress" (başlamış) ise ve transfer hala bekliyor/yolda görünüyorsa 
      // (veri uyumsuzluğu) ya da transfer Delivered olduysa (normal akış) gösterebiliriz.
      // Sadece aktif/sırası gelen transferleri tutmak için ekstra sıkı bir kural:
      if ((t.status === 'waiting_pickup' || t.status === 'on_the_way') && !isToPending) {
         continue // Eğer transfer hala yoldaysa ama aşama çoktan başladıysa mantıksız, gizle.
      }

      g[t.status].push(t)
    }
    return g
  }, [transfers, orderMap])

  const stageName = (orderId: string, stageId: string | null) => {
    if (!stageId) return "Atölye"
    const order = orderMap.get(orderId)
    return order?.stages.find((s) => s.id === stageId)?.stageName ?? "—"
  }

  const advance = async (t: Transfer) => {
    const next: TransferStatus = t.status === "waiting_pickup" ? "on_the_way" : "delivered"
    setAdvancingId(t.id)
    try {
      await setTransferStatus(t.id, next)
      toast.success(`Transfer güncellendi: ${TRANSFER_STATUS_LABELS[next]}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hata'
      toast.error(`Transfer güncellenemedi: ${msg}`)
    } finally {
      setAdvancingId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden gap-6">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Sevkiyat Takibi</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Atölyeler arası taşıma işlemlerini ve şoför durumlarını izleyin.
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 gap-4 lg:grid-cols-3 overflow-hidden">
        {COLUMNS.map((col) => {
          const items = grouped[col.key]
          return (
            <div key={col.key} className="flex flex-col overflow-hidden gap-3">
              <div className="flex items-center justify-between px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${col.accent}`}>
                    {TRANSFER_STATUS_LABELS[col.key]}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{items.length}</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-2 pb-24 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                {items.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <TruckIcon />
                          </EmptyMedia>
                          <EmptyTitle>Kayıt yok</EmptyTitle>
                          <EmptyDescription>Bu durumda transfer bulunmuyor.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </CardContent>
                  </Card>
                ) : (
                  items.map((t) => {
                    const order = orderMap.get(t.orderId)
                    const driver = contactById(t.driverId)
                    return (
                      <div key={t.id} className="h-auto min-h-fit p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1 min-w-0 pr-2">
                            <span className="font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit">
                              {order?.orderCode ?? "—"}
                            </span>
                            <span className="text-sm font-semibold text-foreground leading-tight">
                              {order?.productTitle}
                            </span>
                            {order?.clientName && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {order.clientName}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 bg-secondary/50 px-1.5 py-0.5 rounded">
                            <ClockIcon className="size-3" />
                            {t.status === "waiting_pickup"
                              ? formatDateTime(order?.createdAt ?? null)
                              : t.status === "on_the_way"
                                ? formatDateTime(t.pickupTime)
                                : formatDateTime(t.deliveryTime)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-xs font-medium text-secondary-foreground border border-border/40">
                            <PackageIcon className="size-3 text-muted-foreground" />
                            {stageName(t.orderId, t.fromStageId)}
                          </span>
                          <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" />
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-xs font-medium text-secondary-foreground border border-border/40">
                            <MapPinIcon className="size-3 text-muted-foreground" />
                            {stageName(t.orderId, t.toStageId)}
                          </span>
                        </div>

                        <Separator className="my-1 border-border/50" />

                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-7 ring-1 ring-border">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                {driver ? initials(driver.fullName) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col leading-none">
                              <span className="text-xs font-medium text-foreground">
                                {driver?.fullName ?? "Atanmadı"}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1">Şoför / Kurye</span>
                            </div>
                          </div>

                          {t.status !== "delivered" && (
                            <Button size="sm" className="h-7 text-xs px-2.5" variant={t.status === "on_the_way" ? "default" : "outline"} onClick={() => advance(t)} disabled={advancingId === t.id}>
                              {advancingId === t.id ? 'Bekleyin...' : t.status === "waiting_pickup" ? "Yola Çıkar" : "Teslim Et"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
