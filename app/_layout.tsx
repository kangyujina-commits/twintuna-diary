import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { DiaryProvider } from '../src/context/DiaryContext'
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'

function AppStack() {
  const { isDark } = useTheme()
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
        <AppStack />
      </DiaryProvider>
    </ThemeProvider>
  )
}
