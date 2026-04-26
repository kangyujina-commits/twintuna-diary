import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, ImageBackground,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useDiary, getEmojiForDevice } from '../src/context/DiaryContext'
import { useTheme } from '../src/context/ThemeContext'

export default function MemoScreen() {
  const router = useRouter()
  const { memo, setMemo, nickname, deviceId } = useDiary()
  const { colors, bgImage, bgOpacity, fontScale } = useTheme()

  const [localMemo, setLocalMemo] = useState(memo)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // 파트너가 수정했을 때만 동기화 (내가 타이핑 중이 아닐 때)
  useEffect(() => {
    if (!isTypingRef.current) setLocalMemo(memo)
  }, [memo])

  function handleChange(text: string) {
    isTypingRef.current = true
    setLocalMemo(text)
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await setMemo(text)
      isTypingRef.current = false
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    }, 800)
  }

  // 키보드 단축키 (웹)
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const myEmoji = getEmojiForDevice(deviceId)
  const authorLabel = nickname ? `${myEmoji} ${nickname}` : myEmoji

  const inner = (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgImage ? 'transparent' : colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.accent }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.text, fontSize: 16 * fontScale }]}>
            📝 공유 메모장
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            파트너와 실시간으로 공유돼요
          </Text>
        </View>
        <Text style={[
          styles.saveStatus,
          { color: saveState === 'saving' ? colors.accent : saveState === 'saved' ? colors.connectedText : 'transparent' },
        ]}>
          {saveState === 'saving' ? '저장 중...' : '저장됨 ✓'}
        </Text>
      </View>

      {/* 에디터 */}
      <TextInput
        style={[
          styles.editor,
          {
            color: colors.text,
            backgroundColor: bgImage ? 'transparent' : colors.card,
            fontSize: 16 * fontScale,
            lineHeight: 28 * fontScale,
            borderColor: colors.cardBorder,
          },
        ]}
        multiline
        value={localMemo}
        onChangeText={handleChange}
        placeholder={`${authorLabel} 여기에 자유롭게 써요 ✏️\n할 일, 약속, 메모, 뭐든지!`}
        placeholderTextColor={colors.hint}
        textAlignVertical="top"
        autoFocus
      />

      {/* 글자수 */}
      <Text style={[styles.counter, { color: colors.textMuted }]}>
        {localMemo.length}자
      </Text>
    </SafeAreaView>
  )

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }} imageStyle={{ opacity: bgOpacity }}>
        {inner}
      </ImageBackground>
    )
  }
  return inner
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 30, lineHeight: 34 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 1 },
  saveStatus: { fontSize: 11, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  editor: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    fontSize: 16,
    lineHeight: 28,
  },
  counter: { fontSize: 11, fontWeight: '600', textAlign: 'right', paddingRight: 20, paddingBottom: 12 },
})
