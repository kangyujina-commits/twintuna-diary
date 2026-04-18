import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const PIN_KEY = '@twintuna_diary:pin'

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
  const [pin, setPin] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then((saved) => {
      if (saved) {
        setPin(saved)
        setIsLocked(true)
      }
      setIsLoaded(true)
    })
  }, [])

  function unlock(entered: string): boolean {
    if (entered === pin) {
      setIsLocked(false)
      return true
    }
    return false
  }

  async function setupPin(newPin: string) {
    await AsyncStorage.setItem(PIN_KEY, newPin)
    setPin(newPin)
    setIsLocked(false)
  }

  async function removePin() {
    await AsyncStorage.removeItem(PIN_KEY)
    setPin(null)
    setIsLocked(false)
  }

  return (
    <LockContext.Provider value={{ isLoaded, isLocked, hasPin: !!pin, unlock, setupPin, removePin }}>
      {children}
    </LockContext.Provider>
  )
}

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used inside LockProvider')
  return ctx
}
