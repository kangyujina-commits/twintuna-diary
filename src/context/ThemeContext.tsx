import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = '@twintuna_diary:theme'
const ACCENT_KEY = '@twintuna_diary:accent'
const BGIMAGE_KEY = '@twintuna_diary:bgImage'
const BGOPACITY_KEY = '@twintuna_diary:bgOpacity'

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

// 이미지를 압축된 base64로 변환 (web canvas 사용)
async function imageUriToBase64(uri: string, maxWidth = 1200, quality = 0.6): Promise<string> {
  if (typeof document === 'undefined') {
    // React Native native 환경 - 그냥 fetch → base64
    const res = await fetch(uri)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  // Web 환경 - Canvas로 리사이즈 + 압축
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = uri
  })
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
    // 배경
    bg: tintBg(isDark ? '#1a1210' : '#fdf6f0', accent, isDark ? 0.18 : 0.12),
    inputBg: tintBg(isDark ? '#221810' : '#fdf6f0', accent, isDark ? 0.15 : 0.10),
    // 텍스트 — accent 기반 파생
    text: adjustColor(accent, isDark ? 3.2 : 0.38),
    textMuted: adjustColor(accent, isDark ? 1.5 : 0.68),
    textLight: adjustColor(accent, isDark ? 1.0 : 0.80),
    sectionLabel: adjustColor(accent, isDark ? 1.4 : 0.65),
    hint: accentAlpha(accent, isDark ? 0.4 : 0.45),
    // 강조
    accent,
    accentText: adjustColor(accent, isDark ? 1.15 : 0.78),
    todayBg: accentAlpha(accent, isDark ? 0.28 : 0.18),
    todayText: adjustColor(accent, isDark ? 1.05 : 0.72),
    cellEntry: accentAlpha(accent, isDark ? 0.14 : 0.07),
    cellEntryBorder: accentAlpha(accent, isDark ? 0.32 : 0.22),
    // 연결 뱃지 — accent 계열로
    connectedBg: accentAlpha(accent, isDark ? 0.22 : 0.14),
    connectedText: adjustColor(accent, isDark ? 1.1 : 0.70),
  }
}

export type Colors = ReturnType<typeof buildColors>

interface ThemeContextValue {
  isDark: boolean
  colors: Colors
  toggleTheme: () => void
  accentColor: string
  setAccentColor: (color: string) => void
  bgImage: string | null
  setBgImage: (uri: string | null) => Promise<void>
  isBgLoading: boolean
  bgOpacity: number
  setBgOpacity: (v: number) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [accentColor, setAccentColorState] = useState('#c9a882')
  const [bgImage, setBgImageState] = useState<string | null>(null)
  const [isBgLoading, setIsBgLoading] = useState(false)
  const [bgOpacity, setBgOpacityState] = useState(0.45)

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, ACCENT_KEY, BGIMAGE_KEY, BGOPACITY_KEY]).then((results) => {
      if (results[0][1] === 'dark') setIsDark(true)
      if (results[1][1]) setAccentColorState(results[1][1])
      if (results[2][1]) setBgImageState(results[2][1])
      if (results[3][1]) setBgOpacityState(parseFloat(results[3][1]))
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

  async function setBgImage(uri: string | null) {
    if (!uri) {
      setBgImageState(null)
      await AsyncStorage.removeItem(BGIMAGE_KEY)
      return
    }
    setIsBgLoading(true)
    try {
      const base64 = await imageUriToBase64(uri)
      setBgImageState(base64)
      await AsyncStorage.setItem(BGIMAGE_KEY, base64)
    } finally {
      setIsBgLoading(false)
    }
  }

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: buildColors(isDark, accentColor),
      toggleTheme,
      accentColor,
      setAccentColor,
      bgImage,
      setBgImage,
      isBgLoading,
      bgOpacity,
      setBgOpacity: (v: number) => {
        setBgOpacityState(v)
        AsyncStorage.setItem(BGOPACITY_KEY, String(v))
      },
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
