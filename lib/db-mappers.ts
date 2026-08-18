/**
 * db-mappers.ts
 * Supabase'den gelen snake_case satırları uygulama tiplerindeki camelCase'e dönüştürür.
 * Her fonksiyon kendi tablosuyla birebir eşleşir.
 */

import type { Contact, Order, OrderStage, Transfer } from './types'

// ─── Raw DB row types (Supabase sütun isimleri) ──────────────────────────────

export interface DbContact {
  id: string
  full_name: string
  workshop_name: string | null
  roles: Contact['roles']
  phone: string
  telegram_connected: boolean
  address: string
  avatar_url: string | null
  created_at: string
}

export interface DbOrderStage {
  id: string
  order_id: string
  stage_order: number
  stage_key: OrderStage['stageKey']
  stage_name: string
  assigned_contact_id: string | null
  status: OrderStage['status']
  started_at: string | null
  completed_at: string | null
  notes: string | null
}

export interface DbOrder {
  id: string
  order_code: string
  product_title: string
  client_name: string | null
  deadline: string | null
  notes: string | null
  image_url: string | null
  driver_id: string | null
  status: Order['status']
  created_at: string
  // İlişkili aşamalar (join sorgusuyla gelir)
  order_stages?: DbOrderStage[]
}

export interface DbTransfer {
  id: string
  order_id: string
  from_stage_id: string | null
  to_stage_id: string | null
  driver_id: string | null
  status: Transfer['status']
  pickup_time: string | null
  delivery_time: string | null
}

// ─── Mapper fonksiyonları ─────────────────────────────────────────────────────

export function mapContact(row: DbContact): Contact {
  return {
    id: row.id,
    fullName: row.full_name,
    workshopName: row.workshop_name,
    roles: Array.isArray(row.roles) ? row.roles : ((row as any).role ? [(row as any).role] : []),
    phone: row.phone,
    telegramConnected: row.telegram_connected,
    address: row.address,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
  }
}

export function mapOrderStage(row: DbOrderStage): OrderStage {
  return {
    id: row.id,
    stageOrder: row.stage_order,
    stageKey: row.stage_key,
    stageName: row.stage_name,
    assignedContactId: row.assigned_contact_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes ?? null,
  }
}

export function mapOrder(row: DbOrder): Order {
  return {
    id: row.id,
    orderCode: row.order_code,
    productTitle: row.product_title,
    clientName: row.client_name,
    deadline: row.deadline,
    notes: row.notes,
    imageUrl: row.image_url,
    driverId: row.driver_id,
    status: row.status,
    createdAt: row.created_at,
    stages: (row.order_stages ?? [])
      .map(mapOrderStage)
      .sort((a, b) => a.stageOrder - b.stageOrder),
  }
}

export function mapTransfer(row: DbTransfer): Transfer {
  return {
    id: row.id,
    orderId: row.order_id,
    fromStageId: row.from_stage_id,
    toStageId: row.to_stage_id,
    driverId: row.driver_id,
    status: row.status,
    pickupTime: row.pickup_time,
    deliveryTime: row.delivery_time,
  }
}

// ─── Ters yönlü dönüştürücüler (DB'ye yazarken) ──────────────────────────────

export function toDbContact(input: {
  fullName: string
  workshopName: string | null
  roles: Contact['roles']
  phone: string
  address: string
  avatarUrl?: string | null
}): Omit<DbContact, 'id' | 'created_at' | 'telegram_connected'> {
  return {
    full_name: input.fullName,
    workshop_name: input.workshopName,
    roles: input.roles,
    phone: input.phone,
    address: input.address,
    avatar_url: input.avatarUrl ?? null,
  }
}
