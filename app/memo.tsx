import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, ImageBackground,
  ScrollView, KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useDiary } from '../src/context/DiaryContext'
import { useTheme } from '../src/context/ThemeContext'

export default function MemoScreen() {
  const router = useRouter()
  const { memoMessages, addMemoMessage, deleteMemoMessage, deviceId } = useDiary()
  const { colors, bgImage, bgOpacity, fontScale } = useTheme()

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  // 새 메시지 오면 스크롤 아래로
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }, [memoMessages.length])

  // Escape → 나가기
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') router.back() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    await addMemoMessage(input)
    setInput('')
    setSending(false)
  }

  const inner = (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgImage ? 'transparent' : colors.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.title, { color: colors.text, fontSize: 16 * fontScale }]}>📝 공유 메모장</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>파트너와 실시간 공유</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.closeBtnTxt, { color: colors.textMuted }]}>닫기</Text>
          </TouchableOpacity>
        </View>

        {/* 메시지 리스트 */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {memoMessages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTxt, { color: colors.hint }]}>
                아직 메모가 없어요 ✏️{'\n'}아래에서 첫 메모를 남겨보세요!
              </Text>
            </View>
          ) : (
            memoMessages.map(msg => {
              const isMine = msg.deviceId === deviceId
              const authorLabel = msg.author ? `${msg.emoji} ${msg.author}` : msg.emoji
              return (
                <View key={msg.id} style={[
                  styles.msgRow,
                  isMine && styles.msgRowMine,
                ]}>
                  <View style={[
                    styles.msgBubble,
                    { backgroundColor: isMine ? colors.todayBg : colors.card, borderColor: isMine ? colors.accent : colors.cardBorder },
                  ]}>
                    <Text style={[styles.msgAuthor, { color: colors.accent }]}>{authorLabel}</Text>
                    <Text style={[styles.msgText, { color: colors.text, fontSize: 15 * fontScale }]}>{msg.text}</Text>
                  </View>
                  {isMine && (
                    <TouchableOpacity
                      onPress={() => deleteMemoMessage(msg.id)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <Text style={[styles.deleteBtnTxt, { color: colors.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>

        {/* 입력창 */}
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder, fontSize: 15 * fontScale }]}
            value={input}
            onChangeText={setInput}
            placeholder="메모 입력..."
            placeholderTextColor={colors.hint}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.accent : colors.cardBorder }]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
          >
            <Text style={styles.sendBtnTxt}>추가</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
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
  backBtn: { width: 36, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 30, lineHeight: 34 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  closeBtnTxt: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 16, gap: 10, flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTxt: { fontSize: 14, textAlign: 'center', lineHeight: 24 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgBubble: { maxWidth: '80%', borderRadius: 14, borderWidth: 1.5, padding: 10, gap: 3 },
  msgAuthor: { fontSize: 11, fontWeight: '800' },
  msgText: { fontSize: 15, lineHeight: 22 },
  deleteBtn: { marginTop: 6 },
  deleteBtnTxt: { fontSize: 13, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, borderTopWidth: 1, gap: 8,
  },
  input: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  sendBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
