import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../firebase'

export type Mood = '😊' | '😄' | '😐' | '😢' | '😠' | '😴' | '🥰' | '😰'
export type Weather = '☀️' | '⛅' | '🌧️' | '❄️' | '🌩️' | '🌈'

export interface DiaryEntry {
  id: string
  date: string
  mood?: string
  weather?: string
  text?: string
  photo_uris?: string[]
  schedule?: string
  author?: string
}

const DIARY_ID_KEY = '@twintuna_diary:diaryId'
const NICKNAME_KEY = '@twintuna_diary:nickname'
const CONNECTED_KEY = '@twintuna_diary:isConnected'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

interface DiaryContextValue {
  diaryId: string
  isConnected: boolean
  nickname: string
  setNickname: (name: string) => Promise<void>
  entries: Record<string, DiaryEntry>
  getEntry: (date: string) => DiaryEntry | undefined
  upsertEntry: (entry: DiaryEntry) => Promise<void>
  deleteEntry: (date: string) => Promise<void>
  connectDiary: (code: string) => Promise<void>
}

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diaryId, setDiaryId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [nickname, setNicknameState] = useState('')
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(DIARY_ID_KEY),
      AsyncStorage.getItem(NICKNAME_KEY),
      AsyncStorage.getItem(CONNECTED_KEY),
    ]).then(([savedId, savedNick, savedConnected]) => {
      const id = savedId || generateCode()
      if (!savedId) AsyncStorage.setItem(DIARY_ID_KEY, id)
      setDiaryId(id)
      setNicknameState(savedNick || '')
      setIsConnected(savedConnected === 'true')
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
    await AsyncStorage.setItem(CONNECTED_KEY, 'true')
    setEntries({})
    setIsConnected(true)
    setDiaryId(newId)
  }

  async function setNickname(name: string) {
    await AsyncStorage.setItem(NICKNAME_KEY, name)
    setNicknameState(name)
  }

  if (!diaryId) return null

  return (
    <DiaryContext.Provider value={{ diaryId, isConnected, nickname, setNickname, entries, getEntry, upsertEntry, deleteEntry, connectDiary }}>
      {children}
    </DiaryContext.Provider>
  )
}

export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider')
  return ctx
}
