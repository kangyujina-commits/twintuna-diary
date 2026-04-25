import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { DiaryProvider } from '../src/context/DiaryContext'
import { ThemeProvider, useTheme, FONT_PRESETS } from '../src/context/ThemeContext'
import { LockProvider, useLock } from '../src/context/LockContext'
import PinScreen from '../src/components/PinScreen'

// accent hex를 약간 어둡게 (active 커서용)
function darkenHex(hex: string, factor = 0.62): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const to2 = (n: number) => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

function buildPawCSS(accent: string) {
  const paw = (color: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="6" cy="9" r="3" fill="${color}"/><circle cx="12" cy="5.5" r="3" fill="${color}"/><circle cx="18" cy="5.5" r="3" fill="${color}"/><circle cx="22" cy="9" r="3" fill="${color}"/><ellipse cx="14" cy="19" rx="7.5" ry="6.5" fill="${color}"/></svg>`
  const normal = `url("data:image/svg+xml,${encodeURIComponent(paw(accent))}") 14 19, auto`
  const active = `url("data:image/svg+xml,${encodeURIComponent(paw(darkenHex(accent)))}") 14 19, pointer`
  return `* { cursor: ${normal} !important; } button, [role="button"], a, div[tabindex], [style*="cursor: pointer"], [style*="cursor:pointer"], input, textarea, select, label { cursor: ${active} !important; }`
}

// 웹 전용: 귀여운 폰트 + 아이콘 주입
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // 모든 선택 가능 폰트 일괄 로드
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = [
    'https://fonts.googleapis.com/css2?',
    'family=Nunito:wght@400;600;700;800;900',
    '&family=Nanum+Gothic:wght@400;700;800',
    '&family=Gaegu:wght@300;400;700',
    '&family=Jua',
    '&family=Do+Hyeon',
    '&display=swap',
  ].join('')
  document.head.appendChild(fontLink)

  // 폰트 적용 스타일 (id 붙여서 나중에 교체 가능)
  const fontStyle = document.createElement('style')
  fontStyle.id = 'font-family-style'
  fontStyle.textContent = `* { font-family: 'Nunito', sans-serif !important; }`
  document.head.appendChild(fontStyle)

  // 🐶🐱 이모지 파비콘
  const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement ?? document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='45'>🐶</text><text x='45' y='.9em' font-size='45'>🐱</text></svg>"
  document.head.appendChild(favicon)

  // 탭 제목
  document.title = '🐶🐱 TwinTuna'

  // 고양이 발바닥 커서 (초기값 — accent 기본색으로, id 부여해서 나중에 교체)
  const pawStyle = document.createElement('style')
  pawStyle.id = 'paw-cursor-style'
  pawStyle.textContent = buildPawCSS('#c9a882')
  document.head.appendChild(pawStyle)
}

function AppContent() {
  const { isDark, accentColor, fontFamilyKey } = useTheme()
  const { isLoaded, isLocked, setupPin } = useLock()
  const [pinStep, setPinStep] = useState<'setup' | 'confirm' | null>(null)
  const [firstPin, setFirstPin] = useState('')

  // accent 바뀔 때 커서 색상 동기화
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const el = document.getElementById('paw-cursor-style') as HTMLStyleElement | null
    if (el) el.textContent = buildPawCSS(accentColor)
  }, [accentColor])

  // 폰트 바뀔 때 font-family 동기화
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const el = document.getElementById('font-family-style') as HTMLStyleElement | null
    const preset = FONT_PRESETS.find(f => f.key === fontFamilyKey)
    if (el && preset) el.textContent = `* { font-family: ${preset.css} !important; }`
  }, [fontFamilyKey])

  // 로딩 중
  if (!isLoaded) return null

  // PIN 잠금 상태
  if (isLocked) {
    return <PinScreen mode="unlock" />
  }

  // 첫 실행 — PIN 설정 안 내밀기, 그냥 앱으로 진입
  // (PIN 설정은 연결 설정 패널에서)

  // PIN 새로 설정 중 (setup flow)
  if (pinStep === 'setup') {
    return (
      <PinScreen
        mode="setup"
        title="새 PIN 입력 (4자리)"
        onSkip={() => setPinStep(null)}
        onConfirm={(p) => { setFirstPin(p); setPinStep('confirm') }}
      />
    )
  }
  if (pinStep === 'confirm') {
    return (
      <PinScreen
        mode="confirm"
        title="PIN 확인 (다시 입력)"
        onConfirm={async (p) => {
          if (p === firstPin) {
            await setupPin(p)
            setPinStep(null)
          } else {
            setPinStep('setup')
            setFirstPin('')
          }
        }}
      />
    )
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DiaryProvider>
        <LockProvider>
          <AppContent />
        </LockProvider>
      </DiaryProvider>
    </ThemeProvider>
  )
}
