"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import { TRANSFER_STATUS_LABELS, type Transfer, type TransferStatus } from "@/lib/types"
import { waitingSince } from "@/lib/order-utils"
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
    for (const t of transfers) g[t.status].push(t)
    return g
  }, [transfers])

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Sevkiyat Takibi</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Atölyeler arası taşıma işlemlerini ve şoför durumlarını izleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.key]
          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${col.accent}`}>
                    {TRANSFER_STATUS_LABELS[col.key]}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{items.length}</span>
              </div>

              <div className="flex flex-col gap-3">
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
                      <Card key={t.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm font-semibold">{order?.orderCode ?? "—"}</CardTitle>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <ClockIcon className="size-3" />
                              {t.status === "waiting_pickup"
                                ? waitingSince(order?.createdAt ?? null)
                                : t.status === "on_the_way"
                                  ? waitingSince(t.pickupTime)
                                  : waitingSince(t.deliveryTime)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{order?.productTitle}</p>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                              <PackageIcon className="size-3" />
                              {stageName(t.orderId, t.fromStageId)}
                            </span>
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                              <MapPinIcon className="size-3" />
                              {stageName(t.orderId, t.toStageId)}
                            </span>
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-brand/10 text-xs text-brand">
                                  {driver ? initials(driver.fullName) : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-foreground">
                                  {driver?.fullName ?? "Atanmadı"}
                                </span>
                                <span className="text-[11px] text-muted-foreground">Şoför</span>
                              </div>
                            </div>

                            {t.status !== "delivered" && (
                              <Button size="sm" variant={t.status === "on_the_way" ? "default" : "outline"} onClick={() => advance(t)} disabled={advancingId === t.id}>
                                {advancingId === t.id ? 'Güncelleniyor...' : t.status === "waiting_pickup" ? "Yola Çıkar" : "Teslim Et"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
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
