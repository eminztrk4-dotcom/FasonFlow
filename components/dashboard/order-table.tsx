'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Search, Pencil, Trash2 } from 'lucide-react'
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
import { StatusBadge } from '@/components/status-badge'

type SortKey = 'orderCode' | 'deadline'

export function OrderTable({
  onSelect,
}: {
  onSelect: (orderId: string) => void
}) {
  const { orders, contactById, deleteOrder } = useStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DerivedStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('orderCode')
  const [asc, setAsc] = useState(true)

  const rows = useMemo(() => {
    let list = [...orders]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.productTitle.toLowerCase().includes(q) ||
          (o.clientName?.toLowerCase().includes(q) ?? false),
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((o) => derivedStatus(o) === statusFilter)
    }
    list.sort((a, b) => {
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      return asc ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return list
  }, [orders, query, statusFilter, sortKey, asc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sipariş no, ürün veya müşteri ara..."
            className="pl-9"
          />
        </div>
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
              <SelectItem value="late">Gecikmiş</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
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
                <TableRow key={order.id}>
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
                      {stage?.stageName ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {usta?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.deadline)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={derivedStatus(order)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelect(order.id)}
                      >
                        <Pencil data-icon="inline-start" />
                        Güncelle
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm(`"${order.productTitle}" siparişini ve tüm aşamalarını tamamen silmek istediğinize emin misiniz?`)) {
                            deleteOrder(order.id).catch(err => alert(err.message))
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
                  Eşleşen sipariş bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
