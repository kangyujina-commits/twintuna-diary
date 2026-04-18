import { useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { DiaryProvider } from '../src/context/DiaryContext'
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'
import { LockProvider, useLock } from '../src/context/LockContext'
import PinScreen from '../src/components/PinScreen'

function AppContent() {
  const { isDark, colors } = useTheme()
  const { isLoaded, isLocked, hasPin, setupPin } = useLock()
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
      <LockProvider>
        <DiaryProvider>
          <AppContent />
        </DiaryProvider>
      </LockProvider>
    </ThemeProvider>
  )
}
