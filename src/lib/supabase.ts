import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
export const supabaseConfigured = Boolean(url && key)
export const supabase: SupabaseClient | null = supabaseConfigured ? createClient(url!, key!) : null

export const supabaseSetupHint = () =>
  'Supabase 설정이 아직 완료되지 않았습니다. .env.example을 .env.local로 복사해 키를 입력한 뒤 개발 서버를 다시 시작해 주세요.'
