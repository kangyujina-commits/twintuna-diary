import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDiary, Mood, Weather } from '../src/context/DiaryContext'

const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: '😄', label: '신나요' },
  { emoji: '🥰', label: '설레요' },
  { emoji: '😊', label: '좋아요' },
  { emoji: '😐', label: '그냥요' },
  { emoji: '😴', label: '피곤해요' },
  { emoji: '😢', label: '슬퍼요' },
  { emoji: '😠', label: '화나요' },
  { emoji: '😰', label: '불안해요' },
]

const WEATHERS: { emoji: Weather; label: string }[] = [
  { emoji: '☀️', label: '맑음' },
  { emoji: '⛅', label: '구름' },
  { emoji: '🌧️', label: '비' },
  { emoji: '❄️', label: '눈' },
  { emoji: '🌩️', label: '번개' },
  { emoji: '🌈', label: '무지개' },
]

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${year}년 ${month}월 ${day}일 (${days[d.getDay()]})`
}

export default function EntryScreen() {
  const router = useRouter()
  const { date } = useLocalSearchParams<{ date: string }>()
  const { getEntry, upsertEntry, deleteEntry } = useDiary()

  const existing = date ? getEntry(date) : undefined

  const [mood, setMood] = useState<Mood | undefined>(existing?.mood)
  const [weather, setWeather] = useState<Weather | undefined>(existing?.weather)
  const [text, setText] = useState(existing?.text ?? '')

  useEffect(() => {
    if (existing) {
      setMood(existing.mood)
      setWeather(existing.weather)
      setText(existing.text ?? '')
    }
  }, [date])

  function handleSave() {
    if (!date) return
    upsertEntry({ date, mood, weather, text: text.trim() })
    router.back()
  }

  function handleDelete() {
    if (!date) return
    Alert.alert('일기 삭제', '이 날의 일기를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteEntry(date)
          router.back()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{date ? formatDate(date) : ''}</Text>
          {existing ? (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteTxt}>삭제</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Mood picker */}
          <Text style={styles.sectionLabel}>오늘의 기분</Text>
          <View style={styles.emojiRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.emoji}
                style={[styles.emojiBtn, mood === m.emoji && styles.emojiBtnActive]}
                onPress={() => setMood(mood === m.emoji ? undefined : m.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiIcon}>{m.emoji}</Text>
                <Text style={[styles.emojiLabel, mood === m.emoji && styles.emojiLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weather picker */}
          <Text style={styles.sectionLabel}>오늘의 날씨</Text>
          <View style={styles.emojiRow}>
            {WEATHERS.map((w) => (
              <TouchableOpacity
                key={w.emoji}
                style={[styles.emojiBtn, weather === w.emoji && styles.emojiBtnActive]}
                onPress={() => setWeather(weather === w.emoji ? undefined : w.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiIcon}>{w.emoji}</Text>
                <Text style={[styles.emojiLabel, weather === w.emoji && styles.emojiLabelActive]}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <Text style={styles.sectionLabel}>오늘 하루</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="오늘은 어떤 하루였나요? ✍️"
            placeholderTextColor="#c5a890"
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveTxt}>저장하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdf6f0' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e0d0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 30, color: '#c9a882', lineHeight: 34 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#3d2c1e' },
  deleteBtn: { width: 40, alignItems: 'flex-end' },
  deleteTxt: { fontSize: 13, color: '#e05c5c' },

  content: { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a08070',
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    minWidth: 60,
  },
  emojiBtnActive: {
    borderColor: '#c9a882',
    backgroundColor: '#fff4ec',
  },
  emojiIcon: { fontSize: 22 },
  emojiLabel: { fontSize: 11, color: '#b09080', marginTop: 2 },
  emojiLabelActive: { color: '#8b5e3c', fontWeight: '600' },

  textInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    padding: 16,
    minHeight: 160,
    fontSize: 15,
    color: '#3d2c1e',
    lineHeight: 24,
  },

  saveBtn: {
    backgroundColor: '#c9a882',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  saveTxt: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
})
