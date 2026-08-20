'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Search, Pencil, Trash2, AlertTriangle, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import {
  currentStage,
  derivedStatus,
  formatDate,
  type DerivedStatus,
} from '@/lib/order-utils'
import { STAGE_TYPES } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'

type SortKey = 'orderCode' | 'deadline'

export function OrderTable({
  onSelect,
  onUpdate,
  query = '',
}: {
  onSelect: (orderId: string) => void
  onUpdate: (orderId: string) => void
  query?: string
}) {
  const { orders, contactById, deleteOrder } = useStore()
  const [statusFilter, setStatusFilter] = useState<DerivedStatus | 'all'>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('orderCode')
  const [asc, setAsc] = useState(true)

  const rows = useMemo(() => {
    // 1. KURAL: Tamamlanan siparişleri canlı takip listesinden tamamen çıkar
    let list = orders.filter(
      (o) => o.status !== 'completed' && derivedStatus(o) !== 'completed',
    )

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.productTitle.toLowerCase().includes(q) ||
          (o.clientName?.toLowerCase().includes(q) ?? false),
      )
    }

    // Durum Filtresi
    if (statusFilter !== 'all') {
      list = list.filter((o) => derivedStatus(o) === statusFilter)
    }

    // İstasyon Filtresi
    if (stageFilter !== 'all') {
      list = list.filter((o) => currentStage(o)?.stageKey === stageFilter)
    }

    list.sort((a, b) => {
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return asc ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return list
  }, [orders, query, statusFilter, stageFilter, sortKey, asc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  // Termin tarihi renk/uyarı hesaplaması
  const getDeadlineBadge = (deadlineStr?: string | null) => {
    if (!deadlineStr) return <span className="text-muted-foreground">—</span>

    const deadline = new Date(deadlineStr)
    deadline.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="flex items-center gap-1.5">
          <span>{formatDate(deadlineStr)}</span>
          <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Gecikti
          </span>
        </span>
      )
    }

    if (diffDays < 3) {
      return (
        <span className="flex items-center gap-1.5">
          <span>{formatDate(deadlineStr)}</span>
          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Yaklaştı
          </span>
        </span>
      )
    }

    return <span>{formatDate(deadlineStr)}</span>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {/* İstasyon Filtresi */}
        <Select
          value={stageFilter}
          onValueChange={(v) => setStageFilter(v)}
        >
          <SelectTrigger className="h-9 w-full sm:w-48">
            <SelectValue placeholder="İstasyon Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tüm İstasyonlar</SelectItem>
              {STAGE_TYPES.map((st) => (
                <SelectItem key={st.key} value={st.key}>
                  {st.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Durum Filtresi */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DerivedStatus | 'all')}
        >
          <SelectTrigger className="h-9 w-full sm:w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="in_progress">İşlemde</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="late">Geciken</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('orderCode')}
                  className="flex items-center gap-1 font-medium"
                >
                  Sipariş No
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead className="hidden md:table-cell">
                Mevcut İstasyon
              </TableHead>
              <TableHead className="hidden lg:table-cell">Sorumlu</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('deadline')}
                  className="flex items-center gap-1 font-medium"
                >
                  Termin
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Aksiyon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((order) => {
              const stage = currentStage(order)
              const usta = contactById(stage?.assignedContactId ?? null)
              return (
                <TableRow 
                  key={order.id}
                  onClick={() => onSelect(order.id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {order.orderCode}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="block truncate font-medium">
                      {order.productTitle}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {order.clientName ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                      {stage ? (STAGE_TYPES.find(s => s.key === stage.stageKey)?.label || stage.stageName) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {usta?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getDeadlineBadge(order.deadline)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={derivedStatus(order)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdate(order.id)
                        }}
                      >
                        <Pencil data-icon="inline-start" />
                        Güncelle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (
                            window.confirm(
                              `"${order.productTitle}" siparişini ve tüm aşamalarını tamamen silmek istediğinize emin misiniz?`,
                            )
                          ) {
                            deleteOrder(order.id).catch((err) =>
                              alert(err.message),
                            )
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Eşleşen aktif sipariş bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}