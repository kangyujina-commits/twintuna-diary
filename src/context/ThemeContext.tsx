import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = '@twintuna_diary:theme'

export const LIGHT = {
  bg: '#fdf6f0',
  card: '#ffffff',
  cardBorder: '#f0e0d0',
  text: '#3d2c1e',
  textMuted: '#a08070',
  textLight: '#b09080',
  accent: '#c9a882',
  accentText: '#8b5e3c',
  todayBg: '#ffe8d2',
  todayText: '#c96a30',
  sun: '#e05c5c',
  sat: '#5b8ee0',
  cellEntry: '#fff8f2',
  cellEntryBorder: '#e8d0b8',
  inputBg: '#fdf6f0',
  sectionLabel: '#a08070',
  hint: '#c9b8a8',
  connectedBg: '#e8f7ee',
  connectedText: '#4a9e6b',
}

export const DARK = {
  bg: '#1a1210',
  card: '#2a1d16',
  cardBorder: '#3d2c20',
  text: '#f0dece',
  textMuted: '#7a6050',
  textLight: '#5a4838',
  accent: '#c9a882',
  accentText: '#e8c8a0',
  todayBg: '#3a2010',
  todayText: '#e88040',
  sun: '#e07070',
  sat: '#7090e0',
  cellEntry: '#2a1e16',
  cellEntryBorder: '#4a3020',
  inputBg: '#221810',
  sectionLabel: '#7a6050',
  hint: '#4a3828',
  connectedBg: '#1a3020',
  connectedText: '#5ab87a',
}

export type Colors = typeof LIGHT

interface ThemeContextValue {
  isDark: boolean
  colors: Colors
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'dark') setIsDark(true)
    })
  }, [])

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
