// ─── Roller ────────────────────────────────────────────────────────────────────

export type Role =
  | 'skeletor'       // İskeletçi (Ahşap iskeleti yapan usta)
  | 'polisher'       // Boyacı / Cilacı
  | 'upholsterer'    // Döşemeci
  | 'driver'         // Şoför / Nakliye
  | 'metal'          // Metal / Kaynakçı (Ayak, şase, profil)
  | 'cnc'            // CNC / Ebatlama / Bantlama
  | 'torna'          // Tornacı / Ahşap Oyma
  | 'marble_glass'   // Mermerci / Camcı
  | 'assembly'       // Montaj / Paketleme
  | 'admin'          // Yönetici

// ─── İstasyon tipleri (Üretim rotasında seçilebilecek aşamalar) ───────────────

export type StageKey =
  | 'iskelet'        // İskelet
  | 'boya'           // Boya / Cila
  | 'doseme'         // Döşeme
  | 'metal'          // Metal / Kaynak
  | 'cnc'            // CNC / Ebatlama
  | 'torna'          // Torna / Oyma
  | 'marble_glass'   // Mermer / Cam
  | 'assembly'       // Montaj / Paketleme
  | 'sevkiyat'       // Sevkiyat / Depo

// ─── Durum tipleri ─────────────────────────────────────────────────────────────

export type StageStatus = 'pending' | 'in_progress' | 'completed'

export type OrderStatus = 'active' | 'completed' | 'cancelled'

export type TransferStatus = 'waiting_pickup' | 'on_the_way' | 'delivered'

// ─── Arayüz tipleri ────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  fullName: string
  workshopName: string | null
  roles: Role[]
  phone: string
  telegramConnected: boolean
  address: string
  avatarUrl: string | null
  createdAt: string
}

export interface OrderStage {
  id: string
  stageOrder: number
  stageKey: StageKey
  stageName: string
  assignedContactId: string | null
  status: StageStatus
  startedAt: string | null
  completedAt: string | null
  notes: string | null
}

export interface Order {
  id: string
  orderCode: string
  productTitle: string
  clientName: string | null
  deadline: string | null
  notes: string | null
  imageUrl: string | null
  driverId: string | null
  status: OrderStatus
  createdAt: string
  stages: OrderStage[]
}

export interface Transfer {
  id: string
  orderId: string
  fromStageId: string | null
  toStageId: string | null
  driverId: string | null
  status: TransferStatus
  pickupTime: string | null
  deliveryTime: string | null
}

// ─── Etiket eşlemeleri ─────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  skeletor:     'İskeletçi',
  polisher:     'Boyacı / Cilacı',
  upholsterer:  'Döşemeci',
  driver:       'Şoför',
  metal:        'Metal / Kaynakçı',
  cnc:          'CNC / Ebatlama',
  torna:        'Tornacı / Ahşap Oyma',
  marble_glass: 'Mermerci / Camcı',
  assembly:     'Montaj / Paketleme',
  admin:        'Yönetici',
}

export const ROLE_COLORS: Record<Role, string> = {
  assembly:     'bg-purple-100 text-purple-700',
  driver:       'bg-red-100 text-red-700',
  torna:        'bg-amber-100 text-amber-800',
  metal:        'bg-orange-100 text-orange-700',
  cnc:          'bg-cyan-100 text-cyan-700',
  skeletor:     'bg-yellow-100 text-yellow-800',
  polisher:     'bg-emerald-100 text-emerald-700',
  marble_glass: 'bg-sky-100 text-sky-700',
  upholsterer:  'bg-indigo-100 text-indigo-700',
  admin:        'bg-slate-100 text-slate-700',
}

/**
 * Üretim rotasında seçilebilecek tüm istasyon tipleri.
 * Her istasyonun hangi rol sahibi ustaya atanabileceğini belirtir.
 * Kanban sütunları ve sipariş formu bu diziden dinamik olarak üretilir.
 */
export const STAGE_TYPES: {
  key: StageKey
  label: string
  role: Role
}[] = [
  { key: 'iskelet',      label: 'İskelet',               role: 'skeletor'     },
  { key: 'boya',         label: 'Boya / Cila',            role: 'polisher'     },
  { key: 'doseme',       label: 'Döşeme',                 role: 'upholsterer'  },
  { key: 'metal',        label: 'Metal / Kaynak',         role: 'metal'        },
  { key: 'cnc',          label: 'CNC / Ebatlama',         role: 'cnc'          },
  { key: 'torna',        label: 'Torna / Oyma',           role: 'torna'        },
  { key: 'marble_glass', label: 'Mermer / Cam',           role: 'marble_glass' },
  { key: 'assembly',     label: 'Montaj / Paketleme',     role: 'assembly'     },
  { key: 'sevkiyat',     label: 'Sevkiyat / Depo',        role: 'driver'       },
]

// ─── Durum etiketleri ──────────────────────────────────────────────────────────

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending:     'Beklemede',
  in_progress: 'İşlemde',
  completed:   'Tamamlandı',
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  waiting_pickup: 'Alım Bekliyor',
  on_the_way:     'Yolda',
  delivered:      'Teslim Edildi',
}
