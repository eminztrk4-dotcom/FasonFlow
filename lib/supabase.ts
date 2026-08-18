import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>

/**
 * Lazy Supabase istemcisi.
 * Build/prerender sırasında URL boş olabilir; istemci yalnızca
 * ilk gerçek kullanımda (runtime'da) oluşturulur.
 */
function createLazyClient(): AnySupabase {
  let instance: AnySupabase | null = null

  return new Proxy({} as AnySupabase, {
    get(_target, prop: string) {
      if (!instance) {
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error(
            '[FasonFlow] Supabase ortam değişkenleri eksik.\n' +
              '.env.local dosyasına NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin.',
          )
        }
        instance = createClient(supabaseUrl, supabaseAnonKey)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (instance as any)[prop]
      return typeof val === 'function' ? val.bind(instance) : val
    },
  })
}

export const supabase = createLazyClient()
