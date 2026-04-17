import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore'
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
  deviceId?: string
}

const DIARY_ID_KEY = '@twintuna_diary:diaryId'
const NICKNAME_KEY = '@twintuna_diary:nickname'
const CONNECTED_KEY = '@twintuna_diary:isConnected'
const DEVICE_ID_KEY = '@twintuna_diary:deviceId'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateDeviceId() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
}

interface DiaryContextValue {
  diaryId: string
  deviceId: string
  isConnected: boolean
  nickname: string
  setNickname: (name: string) => Promise<void>
  appName: string
  setAppName: (name: string) => Promise<void>
  entries: Record<string, DiaryEntry>
  getEntry: (date: string) => DiaryEntry | undefined
  upsertEntry: (entry: DiaryEntry) => Promise<void>
  deleteEntry: (date: string) => Promise<void>
  connectDiary: (code: string) => Promise<void>
}

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diaryId, setDiaryId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [nickname, setNicknameState] = useState('')
  const [appName, setAppNameState] = useState('TwinTuna_Diary')
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(DIARY_ID_KEY),
      AsyncStorage.getItem(NICKNAME_KEY),
      AsyncStorage.getItem(CONNECTED_KEY),
      AsyncStorage.getItem(DEVICE_ID_KEY),
    ]).then(([savedId, savedNick, savedConnected, savedDeviceId]) => {
      const id = savedId || generateCode()
      if (!savedId) AsyncStorage.setItem(DIARY_ID_KEY, id)
      const dId = savedDeviceId || generateDeviceId()
      if (!savedDeviceId) AsyncStorage.setItem(DEVICE_ID_KEY, dId)
      setDiaryId(id)
      setDeviceId(dId)
      setNicknameState(savedNick || '')
      setIsConnected(savedConnected === 'true')
    })
  }, [])

  useEffect(() => {
    if (!diaryId) return
    // 앱 이름 실시간 동기화
    const unsubMeta = onSnapshot(doc(db, 'diaries', diaryId), (snap) => {
      const data = snap.data()
      if (data?.appName) setAppNameState(data.appName)
    })
    return unsubMeta
  }, [diaryId])

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

  async function setAppName(name: string) {
    if (!diaryId) return
    await setDoc(doc(db, 'diaries', diaryId), { appName: name }, { merge: true })
    setAppNameState(name)
  }

  if (!diaryId) return null

  return (
    <DiaryContext.Provider value={{ diaryId, deviceId, isConnected, nickname, setNickname, appName, setAppName, entries, getEntry, upsertEntry, deleteEntry, connectDiary }}>
      {children}
    </DiaryContext.Provider>
  )
}

export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider')
  return ctx
}
