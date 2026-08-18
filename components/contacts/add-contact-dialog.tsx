'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/types'
import { AvatarUpload } from './avatar-upload'
import { uploadAvatar } from '@/lib/supabase-queries'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS: Role[] = [
  'skeletor',
  'polisher',
  'upholsterer',
  'metal',
  'cnc',
  'torna',
  'marble_glass',
  'assembly',
  'driver',
  'admin',
]

export function AddContactDialog() {
  const { addContact } = useStore()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [workshopName, setWorkshopName] = useState('')
  const [roles, setRoles] = useState<Role[]>(['skeletor'])
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setFullName('')
    setWorkshopName('')
    setRoles(['skeletor'])
    setPhone('')
    setAddress('')
    setAvatarFile(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      toast.error('İsim ve telefon zorunludur.')
      return
    }
    setIsSubmitting(true)
    try {
      let avatarUrl: string | null = null
      
      // Geçici bir id veya timestamp ile dosyayı yükle (insertContact sonrası dönen ID'yi almak için 
      // API imzasını değiştirmemek adına, benzersiz bir id üretiyoruz ya da temp id veriyoruz).
      // Daha güvenli bir yol: geçici id, örneğin randomUUID, çünkü contact henüz db'ye kaydedilmedi.
      if (avatarFile) {
        const tempId = crypto.randomUUID()
        avatarUrl = await uploadAvatar(avatarFile, tempId)
      }

      await addContact({ fullName: fullName.trim(), workshopName, roles, phone, address, avatarUrl })
      toast.success(`${fullName.trim()} rehbere eklendi.`)
      reset()
      setOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      toast.error(`Kişi eklenemedi: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Yeni Kişi
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Yeni Kişi / Atölye</DialogTitle>
            <DialogDescription>
              Fason usta veya şoför bilgilerini girin. Telegram bağlantısı
              sonra kurulur.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2">
            <AvatarUpload
              initials={fullName ? fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '??'}
              onFileSelect={(file) => setAvatarFile(file)}
              onRemove={() => setAvatarFile(null)}
            />
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="c-name">Ad Soyad *</FieldLabel>
              <Input
                id="c-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramazan Demir"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="c-workshop">Atölye Adı</FieldLabel>
              <Input
                id="c-workshop"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                placeholder="Demir Ahşap İskelet"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>Uzmanlık Alanları (Çoklu Seçim)</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLE_OPTIONS.map((r) => {
                    const isSelected = roles.includes(r)
                    // @ts-ignore dynamic import styles
                    const colorStyle = ROLE_COLORS[r] || 'bg-primary text-primary-foreground'
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          setRoles((prev) =>
                            prev.includes(r)
                              ? prev.filter((x) => x !== r)
                              : [...prev, r]
                          )
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                          isSelected
                            ? `${colorStyle} border-transparent`
                            : 'bg-card border-border text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="c-phone">Telefon *</FieldLabel>
                <Input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="c-address">Adres</FieldLabel>
              <Input
                id="c-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Cerrah OSB, İnegöl / Bursa"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>
              İptal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
