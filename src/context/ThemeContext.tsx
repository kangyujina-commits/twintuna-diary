import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = '@twintuna_diary:theme'
const ACCENT_KEY = '@twintuna_diary:accent'

export const ACCENT_PRESETS = [
  '#c9a882', // tuna (default)
  '#e07a8a', // rose
  '#5ab89e', // mint
  '#9b8ee0', // lavender
  '#5b8ee0', // sky
  '#e08c60', // peach
  '#7aaa7a', // sage
]

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}
function adjustColor(hex: string, factor: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.min(255, Math.round(r * factor))},${Math.min(255, Math.round(g * factor))},${Math.min(255, Math.round(b * factor))})`
}
function accentAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}
function tintBg(base: string, accent: string, amount: number): string {
  if (!base.startsWith('#') || !accent.startsWith('#')) return base
  const b = hexToRgb(base), a = hexToRgb(accent)
  return `rgb(${Math.round(b.r + (a.r - b.r) * amount)},${Math.round(b.g + (a.g - b.g) * amount)},${Math.round(b.b + (a.b - b.b) * amount)})`
}

const LIGHT_BASE = {
  bg: '#fdf6f0',
  card: '#ffffff',
  cardBorder: '#f0e0d0',
  text: '#3d2c1e',
  textMuted: '#a08070',
  textLight: '#b09080',
  sun: '#e05c5c',
  sat: '#5b8ee0',
  inputBg: '#fdf6f0',
  sectionLabel: '#a08070',
  hint: '#c9b8a8',
  connectedBg: '#e8f7ee',
  connectedText: '#4a9e6b',
}

const DARK_BASE = {
  bg: '#1a1210',
  card: '#2a1d16',
  cardBorder: '#3d2c20',
  text: '#f0dece',
  textMuted: '#7a6050',
  textLight: '#5a4838',
  sun: '#e07070',
  sat: '#7090e0',
  inputBg: '#221810',
  sectionLabel: '#7a6050',
  hint: '#4a3828',
  connectedBg: '#1a3020',
  connectedText: '#5ab87a',
}

function buildColors(isDark: boolean, accent: string) {
  const base = isDark ? DARK_BASE : LIGHT_BASE
  return {
    ...base,
    bg: tintBg(isDark ? '#1a1210' : '#fdf6f0', accent, isDark ? 0.18 : 0.12),
    inputBg: tintBg(isDark ? '#221810' : '#fdf6f0', accent, isDark ? 0.15 : 0.10),
    accent,
    accentText: adjustColor(accent, isDark ? 1.15 : 0.78),
    todayBg: accentAlpha(accent, isDark ? 0.28 : 0.18),
    todayText: adjustColor(accent, isDark ? 1.05 : 0.72),
    cellEntry: accentAlpha(accent, isDark ? 0.14 : 0.07),
    cellEntryBorder: accentAlpha(accent, isDark ? 0.32 : 0.22),
  }
}

export type Colors = ReturnType<typeof buildColors>

interface ThemeContextValue {
  isDark: boolean
  colors: Colors
  toggleTheme: () => void
  accentColor: string
  setAccentColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [accentColor, setAccentColorState] = useState('#c9a882')

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, ACCENT_KEY]).then((results) => {
      if (results[0][1] === 'dark') setIsDark(true)
      if (results[1][1]) setAccentColorState(results[1][1])
    })
  }, [])

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
      return next
    })
  }

  function setAccentColor(color: string) {
    setAccentColorState(color)
    AsyncStorage.setItem(ACCENT_KEY, color)
  }

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: buildColors(isDark, accentColor),
      toggleTheme,
      accentColor,
      setAccentColor,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
