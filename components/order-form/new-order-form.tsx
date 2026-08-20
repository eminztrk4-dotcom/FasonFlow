'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  GripVertical,
  ImagePlus,
  X,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/lib/store'
import { STAGE_TYPES, ROLE_LABELS, type StageKey } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RouteStep {
  uid: string
  stageKey: StageKey
  assignedContactId: string | null
}

const uid = () => Math.random().toString(36).slice(2, 9)

export function NewOrderForm() {
  const router = useRouter()
  const { contacts, addOrder } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [orderCode, setOrderCode] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [steps, setSteps] = useState<RouteStep[]>([
    { uid: uid(), stageKey: 'iskelet', assignedContactId: null },
    { uid: uid(), stageKey: 'boya', assignedContactId: null },
  ])

  const drivers = contacts.filter((c) => c.roles?.includes('driver'))
  const roleForStage = (key: StageKey) =>
    STAGE_TYPES.find((s) => s.key === key)!.role

  const contactsForStage = (key: StageKey) =>
    contacts.filter((c) => c.roles?.includes(roleForStage(key)))

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { uid: uid(), stageKey: 'doseme', assignedContactId: null },
    ])

  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.uid !== id))

  const updateStep = (id: string, patch: Partial<RouteStep>) =>
    setSteps((prev) =>
      prev.map((s) => (s.uid === id ? { ...s, ...patch } : s)),
    )

  const canSubmit =
    orderCode.trim() && productTitle.trim() && steps.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('Sipariş kodu, ürün başlığı ve en az bir istasyon gerekli.')
      return
    }
    setIsSubmitting(true)
    try {
      await addOrder({
        orderCode: orderCode.trim(),
        productTitle: productTitle.trim(),
        clientName,
        deadline,
        notes,
        imageUrl,
        driverId,
        stages: steps.map((s) => ({
          stageKey: s.stageKey,
          stageName: STAGE_TYPES.find((t) => t.key === s.stageKey)!.label,
          assignedContactId: s.assignedContactId,
        })),
      })
      toast.success(`${orderCode.trim()} siparişi oluşturuldu ve rotaya alındı.`)
      router.push('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      toast.error(`Sipariş oluşturulamadı: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageUrl(URL.createObjectURL(file))
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col gap-6 pb-32 pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Yeni Sipariş & Rota Oluştur
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sipariş bilgilerini girin ve üretim rotasını sırayla tanımlayın.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 shrink-0">
        {/* Order info */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sipariş Bilgileri</CardTitle>
            <CardDescription>
              İş emrinin temel künyesi ve teknik notu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="orderCode">Sipariş Kodu *</FieldLabel>
                  <Input
                    id="orderCode"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="FF-2406"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="deadline">Termin Tarihi</FieldLabel>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="productTitle">Ürün Başlığı *</FieldLabel>
                <Input
                  id="productTitle"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Berjer Koltuk Takımı (3+3+1)"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="clientName">
                  Müşteri / Mağaza Adı
                </FieldLabel>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Modern Mobilya - Ankara"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Teknik Açıklama Notu</FieldLabel>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Kumaş rengi, ölçüler, özel talepler..."
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Reference image */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Referans Görsel</CardTitle>
            <CardDescription>
              Ustaların işi doğru anlaması için görsel ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFile}
            />
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || '/placeholder.svg'}
                  alt="Referans görsel önizleme"
                  className="aspect-video w-full object-cover"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute right-2 top-2"
                  onClick={() => setImageUrl(null)}
                >
                  <X />
                  <span className="sr-only">Görseli kaldır</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <ImagePlus className="size-6" />
                <span className="text-sm font-medium">Görsel Yükle</span>
                <span className="text-xs">PNG, JPG</span>
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route builder */}
      <Card className="shrink-0 h-auto">
        <CardHeader>
          <CardTitle>Üretim Rotası</CardTitle>
          <CardDescription>
            Aşamaları sırayla ekleyin. İlk aşama sipariş oluşturulunca otomatik
            başlatılır.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const options = contactsForStage(step.stageKey)
            return (
              <div
                key={step.uid}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="size-4" />
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Select
                    value={step.stageKey}
                    onValueChange={(v) =>
                      updateStep(step.uid, {
                        stageKey: v as StageKey,
                        assignedContactId: null,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Aşama türü">
                        {STAGE_TYPES.find((t) => t.key === step.stageKey)?.label ?? step.stageKey}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Aşama Türü</SelectLabel>
                        {STAGE_TYPES.map((t) => (
                          <SelectItem key={t.key} value={t.key}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    value={step.assignedContactId ?? ''}
                    onValueChange={(v) =>
                      updateStep(step.uid, { assignedContactId: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Usta ata">
                        {step.assignedContactId
                          ? (options.find((c) => c.id === step.assignedContactId)?.fullName ?? 'Usta')
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>
                          {ROLE_LABELS[
                            STAGE_TYPES.find((t) => t.key === step.stageKey)!
                              .role
                          ]}
                        </SelectLabel>
                        {options.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            Uygun kişi yok — Rehber&apos;den ekleyin.
                          </div>
                        )}
                        {options.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.fullName}
                            {c.workshopName ? ` · ${c.workshopName}` : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="self-end text-muted-foreground hover:text-destructive sm:self-auto"
                  onClick={() => removeStep(step.uid)}
                  disabled={steps.length === 1}
                >
                  <Trash2 />
                  <span className="sr-only">Aşamayı sil</span>
                </Button>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addStep}
          >
            <Plus data-icon="inline-start" />
            İstasyon Ekle
          </Button>

          <Separator className="my-1" />

          <FieldGroup>
            <Field orientation="responsive">
              <FieldLabel htmlFor="driver">Şoför Ataması</FieldLabel>
              <FieldDescription>
                Aşamalar arası transferleri yürütecek şoför.
              </FieldDescription>
              <Select
                value={driverId ?? ''}
                onValueChange={(v) => setDriverId(v)}
              >
                <SelectTrigger className="w-full sm:w-64" id="driver">
                  <SelectValue placeholder="Şoför seçin">
                    {driverId
                      ? (drivers.find((d) => d.id === driverId)?.fullName ?? 'Şoför')
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Şoförler</SelectLabel>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.fullName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 shrink-0 mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/')}
        >
          İptal
        </Button>
        <Button
          type="submit"
          className={cn((!canSubmit || isSubmitting) && 'opacity-60')}
          disabled={isSubmitting}
        >
          <Check data-icon="inline-start" />
          {isSubmitting ? 'Kaydediliyor...' : 'Siparişi Oluştur'}
        </Button>
      </div>
    </form>
  )
}
