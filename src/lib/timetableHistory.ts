import { fetchTimetable, type Lesson, type TimetableQuery } from './neis'

export type LessonChange = 'added' | 'updated'
export type ComparedLesson = Lesson & { change?: LessonChange; previousSubject?: string }
export type TimetableComparison = { lessons: ComparedLesson[]; baselineAvailable: boolean; changedCount: number }

function keyFor(query: TimetableQuery) {
  return `munsan-allimi:timetable-baseline:v1:${query.date}:${query.grade}:${query.classroom}`
}

function readBaseline(key: string): Lesson[] | null {
  try {
    const value = localStorage.getItem(key)
    if (!value) return null
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed) || !parsed.every(item => item && Number.isInteger(item.period) && typeof item.subject === 'string')) return null
    return parsed as Lesson[]
  } catch { return null }
}

export async function fetchTimetableCompared(query: TimetableQuery): Promise<TimetableComparison> {
  const current = await fetchTimetable(query)
  const key = keyFor(query)
  const baseline = readBaseline(key)

  // Empty NEIS results are not a safe baseline and must not make every lesson look removed.
  if (current.length === 0) return { lessons: [], baselineAvailable: baseline !== null, changedCount: 0 }

  if (!baseline) {
    try { localStorage.setItem(key, JSON.stringify(current)) } catch { /* Continue with the live timetable if storage is unavailable. */ }
    return { lessons: current, baselineAvailable: false, changedCount: 0 }
  }

  const previousByPeriod = new Map(baseline.map(lesson => [lesson.period, lesson]))
  const compared: ComparedLesson[] = current.map(lesson => {
    const previous = previousByPeriod.get(lesson.period)
    if (!previous) return { ...lesson, change: 'added' }
    if (previous.subject !== lesson.subject) return { ...lesson, change: 'updated', previousSubject: previous.subject }
    return lesson
  })
  compared.sort((a, b) => a.period - b.period)
  return { lessons: compared, baselineAvailable: true, changedCount: compared.filter(lesson => lesson.change).length }
}
