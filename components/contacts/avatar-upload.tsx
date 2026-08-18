'use client'

import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  /** Mevcut avatar URL'si (varsa önceden gösterilir) */
  currentUrl?: string | null
  /** Ad-soyad baş harfleri (fotoğraf yokken gösterilir) */
  initials: string
  /** Yeni dosya seçildiğinde çağrılır */
  onFileSelect: (file: File, previewUrl: string) => void
  /** Fotoğraf kaldırıldığında çağrılır */
  onRemove: () => void
  className?: string
}

export function AvatarUpload({
  currentUrl,
  initials,
  onFileSelect,
  onRemove,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onFileSelect(file, url)
    // Input'u sıfırla — aynı dosyayı tekrar seçmeye izin ver
    e.target.value = ''
  }

  const handleRemove = (ev: React.MouseEvent) => {
    ev.stopPropagation()
    setPreviewUrl(null)
    onRemove()
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Gizli file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleFile}
      />

      {/* Avatar alanı — tıklanabilir */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary transition-colors hover:border-primary hover:bg-secondary/70"
          aria-label="Fotoğraf yükle"
        >
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt="Avatar önizleme"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-muted-foreground">
              {initials}
            </span>
          )}

          {/* Hover overlay */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6 text-white" />
          </span>
        </button>

        {/* Kaldır butonu — fotoğraf varsa göster */}
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm ring-2 ring-background transition-transform hover:scale-110"
            aria-label="Fotoğrafı kaldır"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {previewUrl ? 'Değiştirmek için tıkla' : 'Fotoğraf ekle'}
      </p>
    </div>
  )
}
