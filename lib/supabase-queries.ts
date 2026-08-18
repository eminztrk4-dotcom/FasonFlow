/**
 * supabase-queries.ts
 * Tüm Supabase CRUD işlemlerini kapsayan asenkron fonksiyonlar.
 * Store katmanı bu fonksiyonları çağırır; UI hiçbir zaman doğrudan Supabase'e erişmez.
 */

import { supabase } from './supabase'
import {
  mapContact,
  mapOrder,
  mapOrderStage,
  mapTransfer,
  toDbContact,
  type DbContact,
  type DbOrder,
  type DbOrderStage,
  type DbTransfer,
} from './db-mappers'
import type { Contact, Order, OrderStage, Transfer, StageStatus } from './types'
import type { NewContactInput, NewOrderInput } from './store'

// ─── Contacts ────────────────────────────────────────────────────────────────

/**
 * Supabase Storage 'avatars' bucket'ına fotoğraf yükler.
 * Dönen public URL doğrudan avatar_url olarak kaydedilir.
 * Bucket'ın "Public" olarak ayarlanmış olması gerekir.
 */
export async function uploadAvatar(file: File, contactId: string): Promise<string> {
  // Benzersiz dosya yolu: avatars/<contactId>/<timestamp>.<ext>
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${contactId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadErr) throw new Error(`uploadAvatar: ${uploadErr.message}`)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchContacts: ${error.message}`)
  return ((data ?? []) as DbContact[]).map(mapContact)
}

export async function insertContact(
  input: NewContactInput & { avatarUrl?: string | null },
): Promise<Contact> {
  const row = toDbContact({
    fullName: input.fullName,
    workshopName: input.workshopName || null,
    roles: input.roles,
    phone: input.phone,
    address: input.address,
  })

  const { data, error } = await supabase
    .from('contacts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...row, telegram_connected: false, avatar_url: input.avatarUrl ?? null } as any)
    .select()
    .single()

  if (error) throw new Error(`insertContact: ${error.message}`)
  return mapContact(data as DbContact)
}

export async function updateContact(
  id: string,
  patch: {
    fullName: string
    workshopName: string | null
    roles: Contact['roles']
    phone: string
    address: string
    avatarUrl?: string | null
  },
): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      full_name: patch.fullName,
      workshop_name: patch.workshopName,
      roles: patch.roles,
      phone: patch.phone,
      address: patch.address,
      ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
    } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateContact: ${error.message}`)
  return mapContact(data as DbContact)
}

// ─── Orders + Stages ─────────────────────────────────────────────────────────

export async function fetchOrdersWithStages(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_stages(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchOrdersWithStages: ${error.message}`)
  return ((data ?? []) as DbOrder[]).map(mapOrder)
}

export async function insertOrderWithStages(
  input: NewOrderInput
): Promise<Order> {
  // 1) Siparişi ekle
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      order_code: input.orderCode,
      product_title: input.productTitle,
      client_name: input.clientName || null,
      deadline: input.deadline || null,
      notes: input.notes || null,
      image_url: input.imageUrl,
      driver_id: input.driverId || null,
      status: 'active',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single()

  if (orderErr) throw new Error(`insertOrder: ${orderErr.message}`)
  const orderId: string = (orderRow as DbOrder).id

  // 2) Aşamaları ekle
  const stageRows = input.stages.map((s, i) => ({
    order_id: orderId,
    stage_order: i + 1,
    stage_key: s.stageKey,
    stage_name: s.stageName,
    assigned_contact_id: s.assignedContactId,
    status: i === 0 ? 'in_progress' : 'pending',
    started_at: i === 0 ? new Date().toISOString() : null,
    completed_at: null,
  }))

  const { data: stageData, error: stageErr } = await supabase
    .from('order_stages')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(stageRows as any)
    .select()

  if (stageErr) throw new Error(`insertStages: ${stageErr.message}`)

  return mapOrder({
    ...(orderRow as DbOrder),
    order_stages: (stageData ?? []) as DbOrderStage[],
  })
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error: stageErr } = await supabase
    .from('order_stages')
    .delete()
    .eq('order_id', orderId)
  if (stageErr) throw new Error(`deleteOrder stages: ${stageErr.message}`)

  const { error: orderErr } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
  if (orderErr) throw new Error(`deleteOrder: ${orderErr.message}`)
}

export async function updateStageStatus(
  stageId: string,
  status: StageStatus
): Promise<OrderStage> {
  const now = new Date().toISOString()

  // Mevcut started_at değerini korumak için önce çek
  let existingStartedAt: string | null = null
  if (status !== 'pending') {
    const { data: existing } = await supabase
      .from('order_stages')
      .select('started_at')
      .eq('id', stageId)
      .single()
    existingStartedAt = (existing as { started_at: string | null } | null)?.started_at ?? null
  }

  const patch = {
    status,
    started_at:
      status !== 'pending'
        ? (existingStartedAt ?? now)
        : null,
    completed_at: status === 'completed' ? now : null,
  }

  const { data, error } = await supabase
    .from('order_stages')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', stageId)
    .select()
    .single()

  if (error) throw new Error(`updateStageStatus: ${error.message}`)
  return mapOrderStage(data as DbOrderStage)
}

export async function updateStageDetails(
  stageId: string,
  updates: { assignedContactId?: string | null; notes?: string | null }
): Promise<OrderStage> {
  const patch: Partial<DbOrderStage> = {}
  if (updates.assignedContactId !== undefined) {
    patch.assigned_contact_id = updates.assignedContactId
  }
  if (updates.notes !== undefined) {
    patch.notes = updates.notes
  }

  const { data, error } = await supabase
    .from('order_stages')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', stageId)
    .select()
    .single()

  if (error) throw new Error(`updateStageDetails: ${error.message}`)
  return mapOrderStage(data as DbOrderStage)
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status } as any)
    .eq('id', orderId)

  if (error) throw new Error(`updateOrderStatus: ${error.message}`)
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export async function fetchTransfers(): Promise<Transfer[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw new Error(`fetchTransfers: ${error.message}`)
  return ((data ?? []) as DbTransfer[]).map(mapTransfer)
}

export async function insertTransfer(
  transfer: Omit<Transfer, 'id'>
): Promise<Transfer> {
  const { data, error } = await supabase
    .from('transfers')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      order_id: transfer.orderId,
      from_stage_id: transfer.fromStageId,
      to_stage_id: transfer.toStageId,
      driver_id: transfer.driverId,
      status: transfer.status,
      pickup_time: transfer.pickupTime,
      delivery_time: transfer.deliveryTime,
    } as any)
    .select()
    .single()

  if (error) throw new Error(`insertTransfer: ${error.message}`)
  return mapTransfer(data as DbTransfer)
}

export async function updateTransferStatus(
  transferId: string,
  status: Transfer['status']
): Promise<Transfer> {
  const now = new Date().toISOString()

  const { data: existing, error: fetchErr } = await supabase
    .from('transfers')
    .select('pickup_time')
    .eq('id', transferId)
    .single()

  if (fetchErr) throw new Error(`fetchTransfer: ${fetchErr.message}`)

  const existingPickupTime = (existing as { pickup_time: string | null } | null)?.pickup_time ?? null

  const patch = {
    status,
    pickup_time:
      status !== 'waiting_pickup'
        ? (existingPickupTime ?? now)
        : null,
    delivery_time: status === 'delivered' ? now : null,
  }

  const { data, error } = await supabase
    .from('transfers')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', transferId)
    .select()
    .single()

  if (error) throw new Error(`updateTransferStatus: ${error.message}`)
  return mapTransfer(data as DbTransfer)
}

