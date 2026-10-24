export type AppPreferences = {
  theme: 'light' | 'dark'
  defaultGrade: number
  defaultClassroom: number
}

export const PREFERENCES_KEY = 'munsan-allimi:preferences:v1'
export const DEFAULT_PREFERENCES: AppPreferences = { theme: 'light', defaultGrade: 1, defaultClassroom: 1 }

export function readPreferences(): AppPreferences {
  try {
    const value = localStorage.getItem(PREFERENCES_KEY)
    if (!value) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(value) as Partial<AppPreferences>
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      defaultGrade: Number.isInteger(parsed.defaultGrade) && parsed.defaultGrade! >= 1 && parsed.defaultGrade! <= 3 ? parsed.defaultGrade! : 1,
      defaultClassroom: Number.isInteger(parsed.defaultClassroom) && parsed.defaultClassroom! >= 1 && parsed.defaultClassroom! <= 12 ? parsed.defaultClassroom! : 1,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(value: AppPreferences): void {
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value)) } catch { /* Private browsing may block local storage. */ }
}
