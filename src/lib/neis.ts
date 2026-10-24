export type Lesson = { period: number; subject: string }
export type TimetableQuery = { grade: number; classroom: number; date: string }
export type SchoolEvent = { date: string; title: string; category: string }
export const MUNSAN_SCHOOL = { name: '문산중학교', officeCode: 'J10', schoolCode: '7681006' } as const

// NEIS 키는 브라우저에 두지 않습니다. 이 모듈은 서버 프록시/Edge Function만 호출합니다.
const proxyBase = import.meta.env.VITE_NEIS_PROXY_URL as string | undefined
export const neisProxyConfigured = Boolean(proxyBase)
async function request<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`/functions/v1/${path}`, proxyBase)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  const response = await fetch(url, { headers: publishableKey ? { apikey: publishableKey } : undefined })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error || 'NEIS 정보를 불러오지 못했습니다.')
  }
  return response.json() as Promise<T>
}
export async function fetchCalendarEvents(year: number, month: number): Promise<SchoolEvent[]> {
  if (!proxyBase) return []
  const body = await request<{ events?: SchoolEvent[] }>('neis-calendar', {
    year, month, officeCode: MUNSAN_SCHOOL.officeCode, schoolCode: MUNSAN_SCHOOL.schoolCode,
  })
  return body.events ?? []
}
export async function fetchTimetable(query: TimetableQuery): Promise<Lesson[]> {
  if (!proxyBase) return []
  const body = await request<{ lessons?: Lesson[] }>('neis-timetable', {
    ...query, officeCode: MUNSAN_SCHOOL.officeCode, schoolCode: MUNSAN_SCHOOL.schoolCode,
  })
  return body.lessons ?? []
}
