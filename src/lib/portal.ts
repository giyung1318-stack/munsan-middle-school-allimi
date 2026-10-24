import type { User } from '@supabase/supabase-js'
import { supabase, supabaseSetupHint } from './supabase'

export type AppProfile = {
  id: string
  display_name: string | null
  requested_role: 'student' | 'teacher' | 'general'
  role: 'student' | 'general' | 'teacher' | 'admin'
  teacher_approved: boolean
}
export type LearningResource = {
  id: string
  title: string
  description: string | null
  category: string
  storage_path: string
  audience: 'public' | 'members' | 'teachers'
  created_by: string | null
  created_at: string
}
const bucket = 'learning-materials'
function client() { if (!supabase) throw new Error(supabaseSetupHint()); return supabase }
export function canPublish(profile: AppProfile | null) {
  return Boolean(profile && (profile.role === 'admin' || (profile.role === 'teacher' && profile.teacher_approved)))
}
export async function loadProfile(userId: string): Promise<AppProfile> {
  const { data, error } = await client().from('profiles').select('id,display_name,requested_role,role,teacher_approved').eq('id', userId).single()
  if (error) throw new Error(`프로필을 불러오지 못했습니다: ${error.message}`)
  return data as AppProfile
}
export async function saveDisplayName(userId: string, displayName: string): Promise<AppProfile> {
  const { data, error } = await client().from('profiles').update({ display_name: displayName.trim() }).eq('id', userId).select('id,display_name,requested_role,role,teacher_approved').single()
  if (error) throw new Error(`프로필을 저장하지 못했습니다: ${error.message}`)
  return data as AppProfile
}
export async function listLearningResources(): Promise<LearningResource[]> {
  const { data, error } = await client().from('learning_resources').select('id,title,description,category,storage_path,audience,created_by,created_at').order('created_at', { ascending: false })
  if (error) throw new Error(`자료를 불러오지 못했습니다: ${error.message}`)
  return (data ?? []) as LearningResource[]
}
export async function uploadLearningResource(input: { user: User; profile: AppProfile; file: File; title: string; description: string; category: string }): Promise<void> {
  if (!canPublish(input.profile)) throw new Error('승인된 교사 또는 관리자만 자료를 올릴 수 있습니다.')
  if (input.file.size > 20 * 1024 * 1024) throw new Error('파일은 20MB 이하만 올릴 수 있습니다.')
  const safeName = input.file.name.normalize('NFC').replace(/[^\p{L}\p{N}._-]+/gu, '-')
  const path = `${input.user.id}/${crypto.randomUUID()}-${safeName}`
  const storage = client().storage.from(bucket)
  const { error: uploadError } = await storage.upload(path, input.file, { contentType: input.file.type || 'application/octet-stream', upsert: false })
  if (uploadError) throw new Error(`파일 업로드에 실패했습니다: ${uploadError.message}`)
  const { error: rowError } = await client().from('learning_resources').insert({
    title: input.title.trim(), description: input.description.trim() || null,
    category: input.category, audience: 'members', storage_path: path, created_by: input.user.id,
  })
  if (rowError) {
    await storage.remove([path])
    throw new Error(`자료 정보 저장에 실패했습니다: ${rowError.message}`)
  }
}
export async function createResourceDownloadUrl(path: string): Promise<string> {
  const { data, error } = await client().storage.from(bucket).createSignedUrl(path, 60)
  if (error) throw new Error(`다운로드 링크를 만들지 못했습니다: ${error.message}`)
  return data.signedUrl
}
