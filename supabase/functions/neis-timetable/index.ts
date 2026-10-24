import "jsr:@supabase/functions-js/edge-runtime.d.ts"
const SCHOOL = { office: 'J10', code: '7681006' } as const
const CORS: Record<string, string> = {
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-max-age': '86400',
}
function headers(origin: string | null) {
  const allowed = origin && (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173' || origin === 'https://giyung1318-stack.github.io')
  return { ...CORS, 'access-control-allow-origin': allowed ? origin! : 'null', 'vary': 'Origin', 'content-type': 'application/json; charset=utf-8' }
}
function json(body: unknown, status: number, origin: string | null, cache = 'no-store') {
  return new Response(JSON.stringify(body), { status, headers: { ...headers(origin), 'cache-control': cache } })
}
function bad(message: string, status: number, origin: string | null) { return json({ error: message }, status, origin) }
class NeisApiError extends Error {
  constructor(readonly code: string, message: string) { super(message) }
}
async function neis(endpoint: string, params: Record<string, string>) {
  const key = Deno.env.get('NEIS_API_KEY')
  if (!key) throw new Error('CONFIG')
  const url = new URL('https://open.neis.go.kr/hub/' + endpoint)
  url.search = new URLSearchParams({ KEY: key, Type: 'json', pIndex: '1', pSize: '1000', ATPT_OFCDC_SC_CODE: SCHOOL.office, SD_SCHUL_CODE: SCHOOL.code, ...params }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const data = await response.json().catch(() => null)
  const code = data?.RESULT?.CODE
  if (typeof code === 'string' && code) {
    if (code === 'INFO-200') return []
    const message = typeof data.RESULT.MESSAGE === 'string' ? data.RESULT.MESSAGE.slice(0, 240) : 'NEIS API 요청 오류'
    throw new NeisApiError(code.slice(0, 40), message)
  }
  if (!response.ok || !data) throw new Error('UPSTREAM')
  return data
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) })
  if (req.method !== 'GET') return bad('허용되지 않은 요청입니다.', 405, origin)
  const input = new URL(req.url).searchParams
  const date = input.get('date') ?? '', grade = Number(input.get('grade')), room = Number(input.get('classroom'))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(grade) || grade < 1 || grade > 3 || !Number.isInteger(room) || room < 1 || room > 20) return bad('날짜, 학년, 반을 확인해 주세요.', 400, origin)
  try {
    const dateCode = date.replaceAll('-', '')
    const data = await neis('misTimetable', { ALL_TI_YMD: dateCode, GRADE: String(grade), CLASS_NM: String(room) })
    const rows = data.misTimetable?.[1]?.row ?? []
    const lessons = rows.map((row: Record<string, string>) => ({ period: Number(row.PERIO), subject: row.ITRT_CNTNT || row.SUBJECT || '과목 정보 없음' })).filter((lesson: { period: number }) => Number.isFinite(lesson.period)).sort((a: {period:number}, b: {period:number}) => a.period - b.period)
    return json({ lessons }, 200, origin, 'public, max-age=120, s-maxage=120')
  } catch (error) {
    if (error instanceof NeisApiError) return bad(`NEIS ${error.code}: ${error.message}`, 502, origin)
    return bad(error instanceof Error && error.message === 'CONFIG' ? 'NEIS 서버 키가 설정되지 않았습니다.' : 'NEIS 시간표를 불러오지 못했습니다.', error instanceof Error && error.message === 'CONFIG' ? 503 : 502, origin)
  }
})
