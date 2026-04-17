import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { DiaryProvider } from '../src/context/DiaryContext'

export default function RootLayout() {
  return (
    <DiaryProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </DiaryProvider>
  )
}
