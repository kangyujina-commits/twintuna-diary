import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../firebase'

export type Mood = '😊' | '😄' | '😐' | '😢' | '😠' | '😴' | '🥰' | '😰'
export type Weather = '☀️' | '⛅' | '🌧️' | '❄️' | '🌩️' | '🌈'

export interface DiaryEntry {
  id: string       // docId: "{date}_{deviceId}" 또는 구버전 "{date}"
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
  // PIN (Firestore 공유)
  diaryPin: string | null
  diaryPinLoaded: boolean
  setDiaryPin: (pin: string | null) => Promise<void>
  // 날짜별 모든 entries (docId → entry)
  entries: Record<string, DiaryEntry>
  // 내 entry 가져오기
  getMyEntry: (date: string) => DiaryEntry | undefined
  // 해당 날짜 모든 entries
  getEntriesForDate: (date: string) => DiaryEntry[]
  upsertEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>
  deleteEntry: (docId: string) => Promise<void>
  connectDiary: (code: string) => Promise<void>
  disconnectDiary: () => Promise<void>
}

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diaryId, setDiaryId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [nickname, setNicknameState] = useState('')
  const [appName, setAppNameState] = useState('TwinTuna_Diary')
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [diaryPin, setDiaryPinState] = useState<string | null>(null)
  const [diaryPinLoaded, setDiaryPinLoaded] = useState(false)

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
    setDiaryPinLoaded(false)
    const unsubMeta = onSnapshot(doc(db, 'diaries', diaryId), (snap) => {
      const data = snap.data()
      if (data?.appName) setAppNameState(data.appName)
      setDiaryPinState(data?.pin ?? null)
      setDiaryPinLoaded(true)
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

  // 내 entry: deviceId 일치 또는 구버전(date만 있는 doc), 신포맷 우선
  function getMyEntry(date: string): DiaryEntry | undefined {
    const all = Object.values(entries).filter(e => e.date === date)
    return (
      all.find(e => e.deviceId && e.deviceId === deviceId && e.id !== date) || // 신포맷 우선
      all.find(e => e.deviceId && e.deviceId === deviceId) ||                  // 구포맷(deviceId 있음)
      all.find(e => !e.deviceId && e.id === date)                              // 구버전(deviceId 없음)
    )
  }

  // 같은 deviceId에서 구/신 포맷 둘 다 있으면 신포맷만 남김 (중복 제거)
  function getEntriesForDate(date: string): DiaryEntry[] {
    const all = Object.values(entries).filter(e => e.date === date)
    const seen = new Map<string, DiaryEntry>()
    for (const entry of all) {
      const key = entry.deviceId ?? entry.id
      const existing = seen.get(key)
      if (!existing) {
        seen.set(key, entry)
      } else {
        // 신포맷(id에 deviceId 포함)이 있으면 구포맷 대체
        if (entry.id !== entry.date) seen.set(key, entry)
      }
    }
    return Array.from(seen.values())
  }

  async function upsertEntry(entry: Omit<DiaryEntry, 'id'>) {
    if (!diaryId || !deviceId) return
    const docId = `${entry.date}_${deviceId}`
    const full: DiaryEntry = { ...entry, id: docId, deviceId }
    const clean = Object.fromEntries(Object.entries(full).filter(([, v]) => v !== undefined))
    await setDoc(doc(db, 'diaries', diaryId, 'entries', docId), clean)
  }

  async function deleteEntry(docId: string) {
    if (!diaryId) return
    await deleteDoc(doc(db, 'diaries', diaryId, 'entries', docId))
  }

  async function connectDiary(code: string) {
    const newId = code.trim().toUpperCase()
    await AsyncStorage.setItem(DIARY_ID_KEY, newId)
    await AsyncStorage.setItem(CONNECTED_KEY, 'true')
    setEntries({})
    setIsConnected(true)
    setDiaryId(newId)
  }

  async function disconnectDiary() {
    const newId = generateCode()
    await AsyncStorage.setItem(DIARY_ID_KEY, newId)
    await AsyncStorage.setItem(CONNECTED_KEY, 'false')
    setEntries({})
    setIsConnected(false)
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

  async function setDiaryPin(pin: string | null) {
    if (!diaryId) return
    await setDoc(doc(db, 'diaries', diaryId), { pin: pin ?? null }, { merge: true })
    setDiaryPinState(pin)
  }

  if (!diaryId) return null

  return (
    <DiaryContext.Provider value={{
      diaryId, deviceId, isConnected, nickname, setNickname,
      appName, setAppName,
      diaryPin, diaryPinLoaded, setDiaryPin,
      entries,
      getMyEntry, getEntriesForDate, upsertEntry, deleteEntry, connectDiary, disconnectDiary,
    }}>
      {children}
    </DiaryContext.Provider>
  )
}

export function useDiary() {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider')
  return ctx
}
