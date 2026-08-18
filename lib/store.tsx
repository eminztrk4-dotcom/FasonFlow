'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import {
  fetchContacts,
  fetchOrdersWithStages,
  fetchTransfers,
  insertContact,
  insertOrderWithStages,
  deleteOrder as dbDeleteOrder,
  updateContact as dbUpdateContact,
  updateStageStatus,
  updateStageDetails,
  updateOrderStatus,
  updateTransferStatus,
  insertTransfer,
} from './supabase-queries'
import { mapContact, mapOrder, mapOrderStage, mapTransfer } from './db-mappers'
import type {
  Contact,
  Order,
  OrderStage,
  Role,
  StageStatus,
  Transfer,
} from './types'

// ─── Input types (re-exported for consumers) ─────────────────────────────────

export interface NewOrderInput {
  orderCode: string
  productTitle: string
  clientName: string
  deadline: string
  notes: string
  imageUrl: string | null
  stages: {
    stageKey: OrderStage['stageKey']
    stageName: string
    assignedContactId: string | null
  }[]
  driverId: string | null
}

export interface NewContactInput {
  fullName: string
  workshopName?: string | null
  roles: Role[]
  phone: string
  address: string
  avatarUrl?: string | null
}

// ─── Store value interface ────────────────────────────────────────────────────

interface StoreValue {
  contacts: Contact[]
  orders: Order[]
  transfers: Transfer[]
  loading: boolean
  error: string | null
  addOrder: (input: NewOrderInput) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  addContact: (input: NewContactInput) => Promise<void>
  updateContact: (
    id: string,
    patch: { fullName: string; workshopName: string | null; roles: Role[]; phone: string; address: string; avatarUrl?: string | null }
  ) => Promise<void>
  setStageStatus: (
    orderId: string,
    stageId: string,
    status: StageStatus,
  ) => Promise<void>
  setStageDetails: (
    orderId: string,
    stageId: string,
    updates: { assignedContactId?: string | null; notes?: string | null },
  ) => Promise<void>
  setTransferStatus: (
    transferId: string,
    status: Transfer['status'],
  ) => Promise<void>
  contactById: (id: string | null) => Contact | undefined
  orderById: (id: string) => Order | undefined
}

const StoreContext = createContext<StoreValue | null>(null)

// ─── n8n Webhook helper ───────────────────────────────────────────────────────

async function triggerN8nWebhook(payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_N8N_ORDER_WEBHOOK_URL
  if (!url) return // Yapılandırılmamışsa sessizce atla

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.warn('[n8n] Webhook tetiklenemedi:', err)
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── İlk yükleme ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [c, o, t] = await Promise.all([
          fetchContacts(),
          fetchOrdersWithStages(),
          fetchTransfers(),
        ])
        if (!cancelled) {
          setContacts(c)
          setOrders(o)
          setTransfers(t)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
          setError(`Veri yüklenemedi: ${msg}`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    // contacts tablosu
    const contactsSub = supabase
      .channel('realtime:contacts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          fetchContacts().then(setContacts).catch(console.error)
        },
      )
      .subscribe()

    // orders tablosu
    const ordersSub = supabase
      .channel('realtime:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrdersWithStages().then(setOrders).catch(console.error)
        },
      )
      .subscribe()

    // order_stages tablosu
    const stagesSub = supabase
      .channel('realtime:order_stages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_stages' },
        () => {
          fetchOrdersWithStages().then(setOrders).catch(console.error)
        },
      )
      .subscribe()

    // transfers tablosu
    const transfersSub = supabase
      .channel('realtime:transfers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transfers' },
        () => {
          fetchTransfers().then(setTransfers).catch(console.error)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contactsSub)
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(stagesSub)
      supabase.removeChannel(transfersSub)
    }
  }, [])

  // ── Mutasyonlar ───────────────────────────────────────────────────────────

  const addContact = useCallback(async (input: NewContactInput) => {
    const newContact = await insertContact(input)
    setContacts((prev) => [newContact, ...prev])
  }, [])

  const updateContact = useCallback(
    async (
      id: string,
      patch: { fullName: string; workshopName: string | null; roles: Role[]; phone: string; address: string; avatarUrl?: string | null },
    ) => {
      const updated = await dbUpdateContact(id, patch)
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [],
  )

  const addOrder = useCallback(async (input: NewOrderInput) => {
    const newOrder = await insertOrderWithStages(input)
    setOrders((prev) => [newOrder, ...prev])

    // n8n: Yeni sipariş bildirimi
    await triggerN8nWebhook({
      event: 'order_created',
      orderId: newOrder.id,
      orderCode: newOrder.orderCode,
      productTitle: newOrder.productTitle,
      clientName: newOrder.clientName,
      deadline: newOrder.deadline,
      stages: newOrder.stages.map((s) => ({
        stageId: s.id,
        stageName: s.stageName,
        assignedContactId: s.assignedContactId,
        status: s.status,
      })),
    })
  }, [])

  const deleteOrder = useCallback(async (id: string) => {
    await dbDeleteOrder(id)
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }, [])

  const setStageStatus = useCallback(
    async (orderId: string, stageId: string, status: StageStatus) => {
      const updatedStage = await updateStageStatus(stageId, status)

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order

          const stages = order.stages.map((s) =>
            s.id === stageId ? updatedStage : s,
          )

          // Aşama tamamlandığında bir sonraki 'pending' aşamayı başlat
          if (status === 'completed') {
            const idx = stages.findIndex((s) => s.id === stageId)
            const next = stages[idx + 1]
            if (next && next.status === 'pending') {
              // Supabase'de bir sonraki aşamayı da güncelle (fire-and-forget)
              updateStageStatus(next.id, 'in_progress').catch(console.error)
              stages[idx + 1] = {
                ...next,
                status: 'in_progress',
                startedAt: new Date().toISOString(),
              }
            }
          }

          const allDone = stages.every((s) => s.status === 'completed')
          if (allDone) {
            updateOrderStatus(orderId, 'completed').catch(console.error)
          }

          return {
            ...order,
            stages,
            status: allDone ? ('completed' as const) : order.status,
          }
        }),
      )

      // n8n: Aşama tamamlandığında bildirim
      if (status === 'completed') {
        const order = orders.find((o) => o.id === orderId)
        const stage = order?.stages.find((s) => s.id === stageId)
        if (order && stage) {
          const stagesArr = order.stages
          const completedIdx = stagesArr.findIndex((s) => s.id === stageId)
          const nextStage = stagesArr[completedIdx + 1]

          await triggerN8nWebhook({
            event: 'stage_completed',
            orderId: order.id,
            orderCode: order.orderCode,
            productTitle: order.productTitle,
            completedStage: {
              stageId: stage.id,
              stageName: stage.stageName,
              assignedContactId: stage.assignedContactId,
            },
            nextStage: nextStage
              ? {
                  stageId: nextStage.id,
                  stageName: nextStage.stageName,
                  assignedContactId: nextStage.assignedContactId,
                }
              : null,
          })

          // Create automatic transfer
          try {
            const newTransfer = await insertTransfer({
              orderId: order.id,
              fromStageId: stage.id,
              toStageId: nextStage?.id || null,
              driverId: order.driverId,
              status: 'waiting_pickup',
              pickupTime: null,
              deliveryTime: null,
            })
            setTransfers((prev) => [newTransfer, ...prev])
          } catch (err) {
            console.error('Failed to auto-create transfer:', err)
          }
        }
      }
    },
    [orders],
  )

  const setStageDetails = useCallback(
    async (orderId: string, stageId: string, updates: { assignedContactId?: string | null; notes?: string | null }) => {
      const updatedStage = await updateStageDetails(stageId, updates)

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order
          return {
            ...order,
            stages: order.stages.map((s) => (s.id === stageId ? updatedStage : s)),
          }
        }),
      )
    },
    [],
  )

  const setTransferStatus = useCallback(
    async (transferId: string, status: Transfer['status']) => {
      const updated = await updateTransferStatus(transferId, status)
      setTransfers((prev) =>
        prev.map((t) => (t.id === transferId ? updated : t)),
      )
    },
    [],
  )

  const contactById = useCallback(
    (id: string | null) =>
      id ? contacts.find((c) => c.id === id) : undefined,
    [contacts],
  )

  const orderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  )

  const value = useMemo<StoreValue>(
    () => ({
      contacts,
      orders,
      transfers,
      loading,
      error,
      addOrder,
      deleteOrder,
      addContact,
      updateContact,
      setStageStatus,
      setStageDetails,
      setTransferStatus,
      contactById,
      orderById,
    }),
    [
      contacts,
      orders,
      transfers,
      loading,
      error,
      addOrder,
      deleteOrder,
      addContact,
      updateContact,
      setStageStatus,
      setStageDetails,
      setTransferStatus,
      contactById,
      orderById,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
