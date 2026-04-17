import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Mood = '😊' | '😄' | '😐' | '😢' | '😠' | '😴' | '🥰' | '😰'
export type Weather = '☀️' | '⛅' | '🌧️' | '❄️' | '🌩️' | '🌈'

export interface DiaryEntry {
  id: string
  date: string   // 'YYYY-MM-DD'
  mood?: Mood
  weather?: Weather
  text?: string
  photo_uris?: string[]
  schedule?: string
}

interface DiaryContextValue {
  entries: DiaryEntry[]
  getEntry: (date: string) => DiaryEntry | undefined
  upsertEntry: (entry: Omit<DiaryEntry, 'id'> & { id?: string }) => void
  deleteEntry: (date: string) => void
}

const STORAGE_KEY = '@twintuna_diary:entries'

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntriesState] = useState<DiaryEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setEntriesState(JSON.parse(json))
      setLoaded(true)
    })
  }, [])

  function setEntries(updater: DiaryEntry[] | ((prev: DiaryEntry[]) => DiaryEntry[])) {
    setEntriesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const getEntry = (date: string) => entries.find((e) => e.date === date)

  function upsertEntry(entry: Omit<DiaryEntry, 'id'> & { id?: string }) {
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === entry.date)
      if (existing) {
        return prev.map((e) => (e.date === entry.date ? { ...e, ...entry, id: e.id } : e))
      }
      return [...prev, { id: Date.now().toString(), ...entry }]
    })
  }

  const deleteEntry = (date: string) =>
    setEntries((prev) => prev.filter((e) => e.date !== date))

  if (!loaded) return null

  return (
    <DiaryContext.Provider value={{ entries, getEntry, upsertEntry, deleteEntry }}>
      {children}
    </DiaryContext.Provider>
  )
}

export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider')
  return ctx
}
