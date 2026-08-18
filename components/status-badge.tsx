import { cn } from '@/lib/utils'
import {
  DERIVED_STATUS_LABELS,
  type DerivedStatus,
} from '@/lib/order-utils'
import {
  TRANSFER_STATUS_LABELS,
  type TransferStatus,
} from '@/lib/types'

const dot = 'size-1.5 rounded-full'

const derivedStyles: Record<DerivedStatus, { wrap: string; dot: string }> = {
  completed: {
    wrap: 'bg-status-done text-status-done-foreground',
    dot: 'bg-status-done-foreground',
  },
  in_progress: {
    wrap: 'bg-status-progress text-status-progress-foreground',
    dot: 'bg-status-progress-foreground',
  },
  pending: {
    wrap: 'bg-status-pending text-status-pending-foreground',
    dot: 'bg-status-pending-foreground',
  },
  late: {
    wrap: 'bg-status-late text-status-late-foreground',
    dot: 'bg-status-late-foreground',
  },
}

const transferStyles: Record<TransferStatus, { wrap: string; dot: string }> = {
  waiting_pickup: {
    wrap: 'bg-status-pending text-status-pending-foreground',
    dot: 'bg-status-pending-foreground',
  },
  on_the_way: {
    wrap: 'bg-status-progress text-status-progress-foreground',
    dot: 'bg-status-progress-foreground',
  },
  delivered: {
    wrap: 'bg-status-done text-status-done-foreground',
    dot: 'bg-status-done-foreground',
  },
}

const base =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium'

export function StatusBadge({
  status,
  className,
}: {
  status: DerivedStatus
  className?: string
}) {
  const s = derivedStyles[status]
  return (
    <span className={cn(base, s.wrap, className)}>
      <span className={cn(dot, s.dot)} />
      {DERIVED_STATUS_LABELS[status]}
    </span>
  )
}

export function TransferBadge({
  status,
  className,
}: {
  status: TransferStatus
  className?: string
}) {
  const s = transferStyles[status]
  return (
    <span className={cn(base, s.wrap, className)}>
      <span className={cn(dot, s.dot)} />
      {TRANSFER_STATUS_LABELS[status]}
    </span>
  )
}
