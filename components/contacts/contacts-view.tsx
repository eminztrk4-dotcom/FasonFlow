'use client'

import { useMemo, useState } from 'react'
import { Phone, MapPin, Send, Users, Briefcase, AlertTriangle, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useStore } from '@/lib/store'
import { ROLE_LABELS, ROLE_COLORS, type Role, type Contact } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddContactDialog } from './add-contact-dialog'
import { EditContactDialog } from './edit-contact-dialog'
import { ContactHistoryDialog } from './contact-history-dialog'

const FILTERS: { key: Role | 'all'; label: string }[] = [
  { key: 'all',          label: 'Tümü'                 },
  { key: 'skeletor',     label: 'İskeletçi'            },
  { key: 'polisher',     label: 'Boyacı'               },
  { key: 'upholsterer',  label: 'Döşemeci'             },
  { key: 'metal',        label: 'Metal / Kaynakçı'     },
  { key: 'cnc',          label: 'CNC / Ebatlama'       },
  { key: 'torna',        label: 'Tornacı'              },
  { key: 'marble_glass', label: 'Mermerci / Camcı'     },
  { key: 'assembly',     label: 'Montaj'               },
  { key: 'driver',       label: 'Şoför'                },
]

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function ContactsView() {
  const { contacts, orders, transfers } = useStore()
  const [filter, setFilter] = useState<Role | 'all'>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const list = useMemo(
    () =>
      filter === 'all'
        ? contacts
        : contacts.filter((c) => c.roles?.includes(filter)),
    [contacts, filter],
  )

  // Her usta için aktif ve geciken iş sayıları haritası
  const contactStats = useMemo(() => {
    const stats: Record<string, { activeCount: number; lateCount: number }> = {}
    const now = Date.now()

    for (const c of contacts) {
      stats[c.id] = { activeCount: 0, lateCount: 0 }
    }

    for (const order of orders) {
      const isOrderLate = Boolean(order.deadline && new Date(order.deadline).getTime() < now)

      for (const stage of order.stages) {
        if (stage.assignedContactId && stats[stage.assignedContactId]) {
          if (stage.status !== 'completed') {
            stats[stage.assignedContactId].activeCount += 1
            if (isOrderLate) {
              stats[stage.assignedContactId].lateCount += 1
            }
          }
        }
      }
    }

    // Şoförler için aktif transferleri de ekle
    for (const transfer of transfers) {
      if (transfer.driverId && stats[transfer.driverId]) {
        if (transfer.status !== 'delivered') {
          stats[transfer.driverId].activeCount += 1
        }
      }
    }

    return stats
  }, [contacts, orders, transfers])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Rehber & Atölye Yönetimi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fason ustalar, atölyeler ve şoförlerin iletişim ve iş geçmişi bilgileri.
          </p>
        </div>
        <AddContactDialog />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key
          const count =
            f.key === 'all'
              ? contacts.length
              : contacts.filter((c) => c.roles?.includes(f.key as Role)).length
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs',
                  active ? 'bg-primary-foreground/20' : 'bg-secondary',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Kişi bulunamadı</EmptyTitle>
            <EmptyDescription>
              Bu role ait kayıtlı kişi yok. Yeni bir kişi ekleyin.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const stats = contactStats[c.id] || { activeCount: 0, lateCount: 0 }

            return (
              <div
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11 ring-1 ring-border group-hover:ring-primary/40 transition-colors">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.fullName}
                          className="aspect-square size-full rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-secondary text-sm font-semibold">
                          {initials(c.fullName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold leading-tight group-hover:text-primary transition-colors">
                          {c.fullName}
                        </p>
                      </div>
                      <p className="truncate text-sm text-muted-foreground mt-0.5">
                        {c.workshopName ?? 'Bağımsız Usta'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.roles?.map((r) => (
                        <span
                          key={r}
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            ROLE_COLORS[r],
                          )}
                        >
                          {ROLE_LABELS[r]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Work status badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {stats.activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <Briefcase className="size-3" />
                        {stats.activeCount} Aktif İş
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Uygun / Boşta
                      </span>
                    )}

                    {stats.lateCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="size-3" />
                        {stats.lateCount} Gecikme
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0" />
                      {c.phone}
                    </span>
                    <span className="flex items-start gap-2">
                      <MapPin className="size-4 shrink-0 translate-y-0.5" />
                      <span className="text-pretty line-clamp-1">{c.address}</span>
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between gap-2 border-t border-border pt-3 mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Send
                      className={cn(
                        'size-4',
                        c.telegramConnected
                          ? 'text-status-done-foreground'
                          : 'text-muted-foreground',
                      )}
                    />
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        c.telegramConnected
                          ? 'bg-status-done text-status-done-foreground'
                          : 'bg-status-pending text-status-pending-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          c.telegramConnected
                            ? 'bg-status-done-foreground'
                            : 'bg-status-pending-foreground',
                        )}
                      />
                      {c.telegramConnected ? 'Telegram Bağlı' : 'Bağlantı Bekliyor'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <EditContactDialog contact={c} />
                    <button
                      type="button"
                      onClick={() => setSelectedContact(c)}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Usta Geçmişi ve Detaylar"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Usta İş Geçmişi & Profil Modalı */}
      <ContactHistoryDialog
        contact={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      />
    </div>
  )
}

