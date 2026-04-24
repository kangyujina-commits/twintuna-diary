import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { DiaryProvider } from '../src/context/DiaryContext'
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'
import { LockProvider, useLock } from '../src/context/LockContext'
import PinScreen from '../src/components/PinScreen'

// 웹 전용: 귀여운 폰트 + 아이콘 주입
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Nunito 폰트 (귀엽고 둥근 폰트)
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
  document.head.appendChild(fontLink)

  const fontStyle = document.createElement('style')
  fontStyle.textContent = `* { font-family: 'Nunito', sans-serif !important; }`
  document.head.appendChild(fontStyle)

  // 🐶🐱 이모지 파비콘
  const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement ?? document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='45'>🐶</text><text x='45' y='.9em' font-size='45'>🐱</text></svg>"
  document.head.appendChild(favicon)

  // 탭 제목
  document.title = '🐶🐱 TwinTuna'

  // 고양이 발바닥 커서
  const paw = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="6" cy="9" r="3" fill="${color}"/><circle cx="12" cy="5.5" r="3" fill="${color}"/><circle cx="18" cy="5.5" r="3" fill="${color}"/><circle cx="22" cy="9" r="3" fill="${color}"/><ellipse cx="14" cy="19" rx="7.5" ry="6.5" fill="${color}"/></svg>`
  const pawStyle = document.createElement('style')
  const normal = `url("data:image/svg+xml,${encodeURIComponent(paw('#c9a882'))}") 14 19, auto`
  const active = `url("data:image/svg+xml,${encodeURIComponent(paw('#8b5e3c'))}") 14 19, pointer`
  pawStyle.textContent = `* { cursor: ${normal} !important; } button, [role="button"], a, [style*="cursor: pointer"], [style*="cursor:pointer"], input, textarea, select, label { cursor: ${active} !important; }`
  document.head.appendChild(pawStyle)
}

function AppContent() {
  const { isDark } = useTheme()
  const { isLoaded, isLocked, setupPin } = useLock()
  const [pinStep, setPinStep] = useState<'setup' | 'confirm' | null>(null)
  const [firstPin, setFirstPin] = useState('')

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
