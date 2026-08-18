'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { ROLE_LABELS, ROLE_COLORS, type Contact, type Role } from '@/lib/types'
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

interface Props {
  contact: Contact
}

export function EditContactDialog({ contact }: Props) {
  const { updateContact } = useStore()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(contact.fullName)
  const [workshopName, setWorkshopName] = useState(contact.workshopName ?? '')
  const [roles, setRoles] = useState<Role[]>(contact.roles)
  const [phone, setPhone] = useState(contact.phone)
  const [address, setAddress] = useState(contact.address)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(contact.avatarUrl ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal açıldığında mevcut değerleri tekrar yükle (başka yerden güncellenmiş olabilir)
  useEffect(() => {
    if (open) {
      setFullName(contact.fullName)
      setWorkshopName(contact.workshopName ?? '')
      setRoles(contact.roles)
      setPhone(contact.phone)
      setAddress(contact.address)
      setAvatarUrl(contact.avatarUrl ?? null)
      setAvatarFile(null)
    }
  }, [open, contact])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      toast.error('İsim ve telefon zorunludur.')
      return
    }
    setIsSubmitting(true)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile, contact.id)
      }

      await updateContact(contact.id, {
        fullName: fullName.trim(),
        workshopName: workshopName.trim() || null,
        roles,
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: finalAvatarUrl,
      })
      toast.success(`${fullName.trim()} güncellendi.`)
      setOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      toast.error(`Güncellenemedi: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Pencil className="size-3.5" />
        Düzenle
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Kişiyi Düzenle</DialogTitle>
            <DialogDescription>
              {contact.fullName} kişisinin bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2">
            <AvatarUpload
              currentUrl={avatarUrl}
              initials={fullName ? fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '??'}
              onFileSelect={(file, url) => {
                setAvatarFile(file)
                setAvatarUrl(url)
              }}
              onRemove={() => {
                setAvatarFile(null)
                setAvatarUrl(null)
              }}
            />
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="e-name">Ad Soyad *</FieldLabel>
              <Input
                id="e-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramazan Demir"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="e-workshop">Atölye Adı</FieldLabel>
              <Input
                id="e-workshop"
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
                <FieldLabel htmlFor="e-phone">Telefon *</FieldLabel>
                <Input
                  id="e-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="e-address">Adres</FieldLabel>
              <Input
                id="e-address"
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
