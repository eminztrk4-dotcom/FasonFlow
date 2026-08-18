'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Truck,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StoreProvider } from '@/lib/store'

const NAV = [
  { href: '/', label: 'Canlı Takip', icon: LayoutDashboard },
  { href: '/siparis-olustur', label: 'Yeni Sipariş', icon: PlusCircle },
  { href: '/kisiler', label: 'Rehber', icon: Users },
  { href: '/sevkiyat', label: 'Sevkiyat', icon: Truck },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Boxes className="size-5" strokeWidth={2.25} />
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight">FasonFlow</span>
        <span className="text-[11px] text-muted-foreground">Aşama Takip</span>
      </div>
    </div>
  )
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV.map((item) => {
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'size-[18px] shrink-0',
                active && 'text-brand',
              )}
            />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <StoreProvider>
      <div className="flex min-h-svh">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 lg:flex">
          <Brand />
          <nav className="mt-8 flex flex-col gap-1">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="mt-auto rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-xs font-semibold text-foreground">
              Atölye Şefi
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Ustalar Telegram üzerinden bildirir. Panelden canlı izlersiniz.
            </p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-30 flex flex-col gap-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <Brand />
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            <NavLinks pathname={pathname} />
          </nav>
        </header>

        <main className="flex-1 lg:pl-64">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-[124px] sm:px-6 lg:px-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </StoreProvider>
  )
}
