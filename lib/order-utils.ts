import type { Order, OrderStage } from './types'

export type DerivedStatus = 'completed' | 'in_progress' | 'pending' | 'late'

export const DERIVED_STATUS_LABELS: Record<DerivedStatus, string> = {
  completed: 'Tamamlandı',
  in_progress: 'İşlemde',
  pending: 'Beklemede',
  late: 'Gecikmiş',
}

/** The first stage that is not yet completed = where the order currently sits. */
export function currentStage(order: Order): OrderStage | undefined {
  return (
    order.stages.find((s) => s.status !== 'completed') ??
    order.stages[order.stages.length - 1]
  )
}

export function isLate(order: Order): boolean {
  if (!order.deadline || order.status === 'completed') return false
  const done = order.stages.every((s) => s.status === 'completed')
  if (done) return false
  return new Date(order.deadline).getTime() < Date.now()
}

export function derivedStatus(order: Order): DerivedStatus {
  if (order.status === 'completed' || order.stages.every((s) => s.status === 'completed'))
    return 'completed'
  if (isLate(order)) return 'late'
  if (order.stages.some((s) => s.status === 'in_progress')) return 'in_progress'
  return 'pending'
}

export function progressPercent(order: Order): number {
  const total = order.stages.length
  if (total === 0) return 0
  const done = order.stages.filter((s) => s.status === 'completed').length
  return Math.round((done / total) * 100)
}

/** Relative "x saat/gün önce" waiting time since a stage started. */
export function waitingSince(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3600_000)
  if (hours < 1) return 'az önce'
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
