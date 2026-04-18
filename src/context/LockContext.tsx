import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useDiary } from './DiaryContext'

interface LockContextValue {
  isLoaded: boolean
  isLocked: boolean
  hasPin: boolean
  unlock: (entered: string) => boolean   // 맞으면 true
  setupPin: (pin: string) => Promise<void>
  removePin: () => Promise<void>
}

const LockContext = createContext<LockContextValue | null>(null)

export function LockProvider({ children }: { children: ReactNode }) {
  const { diaryPin, diaryPinLoaded, setDiaryPin } = useDiary()
  const [isLocked, setIsLocked] = useState(false)

  // 첫 로드 시 PIN 있으면 잠금
  useEffect(() => {
    if (diaryPinLoaded && diaryPin) {
      setIsLocked(true)
    }
  }, [diaryPinLoaded]) // intentionally only on initial load

  function unlock(entered: string): boolean {
    if (entered === diaryPin) {
      setIsLocked(false)
      return true
    }
    return false
  }

  async function setupPin(pin: string) {
    await setDiaryPin(pin)
    setIsLocked(false)
  }

  async function removePin() {
    await setDiaryPin(null)
    setIsLocked(false)
  }

  return (
    <LockContext.Provider value={{
      isLoaded: diaryPinLoaded,
      isLocked,
      hasPin: !!diaryPin,
      unlock,
      setupPin,
      removePin,
    }}>
      {children}
    </LockContext.Provider>
  )
}

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used inside LockProvider')
  return ctx
}
