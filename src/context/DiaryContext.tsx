import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../firebase'

export type Mood = '😊' | '😄' | '😐' | '😢' | '😠' | '😴' | '🥰' | '😰'
export type Weather = '☀️' | '⛅' | '🌧️' | '❄️' | '🌩️' | '🌈'

export interface DiaryEntry {
  id: string
  date: string
  mood?: Mood
  weather?: Weather
  text?: string
  photo_uris?: string[]
  schedule?: string
}

const DIARY_ID_KEY = '@twintuna_diary:diaryId'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

interface DiaryContextValue {
  diaryId: string
  entries: Record<string, DiaryEntry>
  getEntry: (date: string) => DiaryEntry | undefined
  upsertEntry: (entry: DiaryEntry) => Promise<void>
  deleteEntry: (date: string) => Promise<void>
  connectDiary: (code: string) => Promise<void>
}

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diaryId, setDiaryId] = useState('')
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})

  useEffect(() => {
    AsyncStorage.getItem(DIARY_ID_KEY).then((saved) => {
      const id = saved || generateCode()
      if (!saved) AsyncStorage.setItem(DIARY_ID_KEY, id)
      setDiaryId(id)
    })
  }, [])

  useEffect(() => {
    if (!diaryId) return
    const unsub = onSnapshot(collection(db, 'diaries', diaryId, 'entries'), (snap) => {
      const next: Record<string, DiaryEntry> = {}
      snap.forEach((d) => { next[d.id] = d.data() as DiaryEntry })
      setEntries(next)
    })
    return unsub
  }, [diaryId])

  const getEntry = (date: string) => entries[date]

  async function upsertEntry(entry: DiaryEntry) {
    if (!diaryId) return
    const clean = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined))
    await setDoc(doc(db, 'diaries', diaryId, 'entries', entry.date), clean)
  }

  async function deleteEntry(date: string) {
    if (!diaryId) return
    await deleteDoc(doc(db, 'diaries', diaryId, 'entries', date))
  }

  async function connectDiary(code: string) {
    const newId = code.trim().toUpperCase()
    await AsyncStorage.setItem(DIARY_ID_KEY, newId)
    setEntries({})
    setDiaryId(newId)
  }

  if (!diaryId) return null

  return (
    <DiaryContext.Provider value={{ diaryId, entries, getEntry, upsertEntry, deleteEntry, connectDiary }}>
      {children}
    </DiaryContext.Provider>
  )
}

export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider')
  return ctx
}
