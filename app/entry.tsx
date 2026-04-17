import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useDiary, Mood, Weather } from '../src/context/DiaryContext'
import { useTheme } from '../src/context/ThemeContext'

const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: '😄', label: 'Joy/신나요' },
  { emoji: '🥰', label: 'Love/설레요' },
  { emoji: '😊', label: 'Good/좋아요' },
  { emoji: '😐', label: 'Meh/그냥요' },
  { emoji: '😴', label: 'Tired/피곤해요' },
  { emoji: '😢', label: 'Sad/슬퍼요' },
  { emoji: '😠', label: 'Angry/화나요' },
  { emoji: '😰', label: 'Anxious/불안해요' },
]

const WEATHERS: { emoji: Weather; label: string }[] = [
  { emoji: '☀️', label: 'Clear/맑음' },
  { emoji: '⛅', label: 'Cloudy/구름' },
  { emoji: '🌧️', label: 'Rain/비' },
  { emoji: '❄️', label: 'Snow/눈' },
  { emoji: '🌩️', label: 'Storm/번개' },
  { emoji: '🌈', label: 'Rainbow/무지개' },
]

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dow = d.getDay()
  return `${MONTHS_EN[month - 1]} ${day}, ${year} (${EN_DAYS[dow]}) / ${year}년 ${month}월 ${day}일 (${KO_DAYS[dow]})`
}

export default function EntryScreen() {
  const router = useRouter()
  const { date } = useLocalSearchParams<{ date: string }>()
  const { getEntry, upsertEntry, deleteEntry, nickname } = useDiary()
  const { colors } = useTheme()

  const existing = date ? getEntry(date) : undefined

  const [mood, setMood] = useState<string | undefined>(existing?.mood)
  const [weather, setWeather] = useState<string | undefined>(existing?.weather)
  const [showCustomMood, setShowCustomMood] = useState(false)
  const [showCustomWeather, setShowCustomWeather] = useState(false)
  const [customMoodInput, setCustomMoodInput] = useState('')
  const [customWeatherInput, setCustomWeatherInput] = useState('')
  const [text, setText] = useState(existing?.text ?? '')
  const [photoUris, setPhotoUris] = useState<string[]>(existing?.photo_uris ?? [])
  const [schedule, setSchedule] = useState(existing?.schedule ?? '')
  const [isEditing, setIsEditing] = useState(!existing)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (existing) {
      setMood(existing.mood)
      setWeather(existing.weather)
      setText(existing.text ?? '')
      setPhotoUris(existing.photo_uris ?? [])
      setSchedule(existing.schedule ?? '')
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }, [date])

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요해요.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)])
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 권한이 필요해요.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri])
    }
  }

  function handleSave() {
    if (!date) return
    upsertEntry({ id: date, date, mood, weather, text: text.trim(), photo_uris: photoUris, schedule: schedule.trim(), author: nickname || undefined })
    setIsEditing(false)
  }

  function handleDelete() {
    if (!date) return
    deleteEntry(date)
    router.back()
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.dateLabel, { color: colors.text }]}>{date ? formatDate(date) : ''}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <View style={[styles.deleteConfirmBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.deleteConfirmTxt, { color: colors.text }]}>이 날의 일기를 삭제할까요?</Text>
            <View style={styles.deleteConfirmBtns}>
              <TouchableOpacity style={[styles.deleteConfirmCancel, { borderColor: colors.accent }]} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={[styles.deleteConfirmCancelTxt, { color: colors.accentText }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmOk} onPress={handleDelete}>
                <Text style={styles.deleteConfirmOkTxt}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 작성자 */}
          {!isEditing && existing?.author && (
            <View style={[styles.authorBadge, { backgroundColor: colors.todayBg }]}>
              <Text style={[styles.authorText, { color: colors.todayText }]}>✍️ {existing.author}</Text>
            </View>
          )}

          {/* Mood */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Mood / 오늘의 기분</Text>
          <View style={styles.emojiRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.emoji}
                style={[styles.emojiBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }, mood === m.emoji && { borderColor: colors.accent, backgroundColor: colors.todayBg }, !isEditing && mood !== m.emoji && styles.emojiBtnDisabled]}
                onPress={() => isEditing && setMood(mood === m.emoji ? undefined : m.emoji)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, !isEditing && mood !== m.emoji && styles.emojiDim]}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
            {/* 커스텀 기분 */}
            {isEditing && !showCustomMood && (
              <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowCustomMood(true)} activeOpacity={0.7}>
                <Text style={styles.emojiIcon}>＋</Text>
              </TouchableOpacity>
            )}
            {isEditing && showCustomMood && (
              <View style={[styles.emojiBtn, { width: 64, backgroundColor: colors.todayBg, borderColor: colors.accent }]}>
                <TextInput
                  style={[styles.customEmojiInput, { color: colors.text }]}
                  value={customMoodInput}
                  onChangeText={(t) => {
                    setCustomMoodInput(t)
                    if (t.trim()) { setMood(t.trim()); }
                  }}
                  placeholder="😺"
                  placeholderTextColor="#c5a890"
                  autoFocus
                  maxLength={4}
                  onBlur={() => { if (!customMoodInput.trim()) setShowCustomMood(false) }}
                />
              </View>
            )}
            {mood && !MOODS.find((m) => m.emoji === mood) && !showCustomMood && (
              <TouchableOpacity
                style={[styles.emojiBtn, { backgroundColor: colors.todayBg, borderColor: colors.accent }]}
                onPress={() => isEditing && setMood(undefined)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, { color: colors.text }]}>{mood}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Weather */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Weather / 오늘의 날씨</Text>
          <View style={styles.emojiRow}>
            {WEATHERS.map((w) => (
              <TouchableOpacity
                key={w.emoji}
                style={[styles.emojiBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }, weather === w.emoji && { borderColor: colors.accent, backgroundColor: colors.todayBg }, !isEditing && weather !== w.emoji && styles.emojiBtnDisabled]}
                onPress={() => isEditing && setWeather(weather === w.emoji ? undefined : w.emoji)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, !isEditing && weather !== w.emoji && styles.emojiDim]}>{w.emoji}</Text>
              </TouchableOpacity>
            ))}
            {/* 커스텀 날씨 */}
            {isEditing && !showCustomWeather && (
              <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowCustomWeather(true)} activeOpacity={0.7}>
                <Text style={styles.emojiIcon}>＋</Text>
              </TouchableOpacity>
            )}
            {isEditing && showCustomWeather && (
              <View style={[styles.emojiBtn, { width: 64, backgroundColor: colors.todayBg, borderColor: colors.accent }]}>
                <TextInput
                  style={[styles.customEmojiInput, { color: colors.text }]}
                  value={customWeatherInput}
                  onChangeText={(t) => {
                    setCustomWeatherInput(t)
                    if (t.trim()) { setWeather(t.trim()); }
                  }}
                  placeholder="🌊"
                  placeholderTextColor="#c5a890"
                  autoFocus
                  maxLength={4}
                  onBlur={() => { if (!customWeatherInput.trim()) setShowCustomWeather(false) }}
                />
              </View>
            )}
            {weather && !WEATHERS.find((w) => w.emoji === weather) && !showCustomWeather && (
              <TouchableOpacity
                style={[styles.emojiBtn, { backgroundColor: colors.todayBg, borderColor: colors.accent }]}
                onPress={() => isEditing && setWeather(undefined)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, { color: colors.text }]}>{weather}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Schedule */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Schedule / 일정</Text>
          {isEditing ? (
            <TextInput
              style={[styles.scheduleInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder="오늘의 일정을 입력하세요 🐈‍⬛"
              placeholderTextColor={colors.hint}
              value={schedule} onChangeText={setSchedule} returnKeyType="done"
            />
          ) : (
            <View style={[styles.scheduleView, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={schedule ? [styles.scheduleContent, { color: colors.text }] : [styles.textEmpty, { color: colors.hint }]}>
                {schedule || '일정 없음'}
              </Text>
            </View>
          )}

          {/* Text */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Today / 오늘 하루</Text>
          {isEditing ? (
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
              multiline
              placeholder="오늘은 어떤 하루였나요? ✍️"
              placeholderTextColor={colors.hint}
              value={text} onChangeText={setText}
              textAlignVertical="top" autoFocus={!!existing}
            />
          ) : (
            <View style={[styles.textView, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={text ? [styles.textContent, { color: colors.text }] : [styles.textEmpty, { color: colors.hint }]}>
                {text || '기록 없음'}
              </Text>
            </View>
          )}

          {/* Photo */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Photo / 사진</Text>
          {photoUris.length > 0 && (
            <View style={styles.photoGrid}>
              {photoUris.map((uri, idx) => (
                <View key={uri + idx} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => setPhotoUris((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Text style={styles.photoRemoveTxt}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
          {isEditing ? (
            showPhotoMenu ? (
              <View style={styles.photoMenuRow}>
                <TouchableOpacity style={[styles.photoMenuBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={async () => { setShowPhotoMenu(false); await takePhoto() }} activeOpacity={0.7}>
                  <Text style={styles.photoMenuIcon}>📸</Text>
                  <Text style={[styles.photoMenuTxt, { color: colors.textMuted }]}>카메라</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoMenuBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={async () => { setShowPhotoMenu(false); await pickPhoto() }} activeOpacity={0.7}>
                  <Text style={styles.photoMenuIcon}>🖼️</Text>
                  <Text style={[styles.photoMenuTxt, { color: colors.textMuted }]}>앨범</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoMenuBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => setShowPhotoMenu(false)} activeOpacity={0.7}>
                  <Text style={styles.photoMenuIcon}>✕</Text>
                  <Text style={[styles.photoMenuTxt, { color: colors.textMuted }]}>취소</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.photoAddBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => setShowPhotoMenu(true)} activeOpacity={0.7}>
                <Text style={styles.photoAddIcon}>📷</Text>
                <Text style={[styles.photoAddTxt, { color: colors.textMuted }]}>사진 추가</Text>
              </TouchableOpacity>
            )
          ) : photoUris.length === 0 ? (
            <View style={[styles.photoEmpty, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.textEmpty, { color: colors.hint }]}>사진 없음</Text>
            </View>
          ) : null}

          {/* 버튼 */}
          {!isEditing && existing ? (
            <View style={styles.bottomBtnRow}>
              {(!existing.author || existing.author === nickname) ? (
                <>
                  <TouchableOpacity style={[styles.editBtnBottom, { flex: 1, borderColor: colors.accent, backgroundColor: colors.card, marginTop: 0 }]} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                    <Text style={[styles.editBtnTxt, { color: colors.accent }]}>편집</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtnBottom} onPress={() => setShowDeleteConfirm(true)} activeOpacity={0.8}>
                    <Text style={styles.deleteBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[styles.editBtnBottom, { flex: 1, backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 0 }]}>
                  <Text style={[styles.editBtnTxt, { color: colors.textMuted }]}>읽기 전용</Text>
                </View>
              )}
            </View>
          ) : isEditing ? (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveTxt}>저장하기</Text>
            </TouchableOpacity>
          ) : null}
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
  backBtn: { width: 44, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 30, color: '#c9a882', lineHeight: 34 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#3d2c1e' },
  editBtn: { width: 44, alignItems: 'flex-end' },
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

  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  emojiBtnActive: { borderColor: '#c9a882', backgroundColor: '#fff4ec' },
  emojiBtnDisabled: { opacity: 0.3 },
  emojiIcon: { fontSize: 22 },
  emojiDim: { opacity: 0.4 },
  emojiLabel: { fontSize: 11, color: '#b09080', marginTop: 2 },
  emojiLabelActive: { color: '#8b5e3c', fontWeight: '600' },
  customEmojiInput: { fontSize: 22, textAlign: 'center', width: 40, color: '#3d2c1e' },

  scheduleInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3d2c1e',
  },
  scheduleView: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scheduleContent: { fontSize: 15, color: '#3d2c1e' },

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
  textView: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    padding: 16,
    minHeight: 80,
  },
  textContent: { fontSize: 15, color: '#3d2c1e', lineHeight: 24 },
  textEmpty: { fontSize: 14, color: '#c5a890' },

  photoMenuRow: { flexDirection: 'row', gap: 8 },
  photoMenuBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  photoMenuCancel: { borderColor: '#f0c0c0', backgroundColor: '#fff8f8' },
  photoMenuIcon: { fontSize: 22 },
  photoMenuTxt: { fontSize: 12, color: '#a08070' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  photoThumbContainer: { position: 'relative', width: '47%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  photoRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  photoAddBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    borderStyle: 'dashed',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoAddIcon: { fontSize: 28 },
  photoAddTxt: { fontSize: 13, color: '#b09080' },

  photoEmpty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    padding: 16,
    alignItems: 'center',
  },

  editBtnBottom: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#c9a882',
    backgroundColor: '#fff',
  },
  editBtnTxt: { fontSize: 16, fontWeight: '600', color: '#c9a882', letterSpacing: 0.5 },

  saveBtn: {
    backgroundColor: '#c9a882',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  saveTxt: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  deleteConfirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#f5d0d0',
  },
  deleteConfirmTxt: { fontSize: 13, color: '#3d2c1e', flex: 1 },
  deleteConfirmBtns: { flexDirection: 'row', gap: 8 },
  deleteConfirmCancel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0b0a0',
  },
  deleteConfirmCancelTxt: { fontSize: 13, color: '#8b5e3c' },
  deleteConfirmOk: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#e05c5c',
  },
  deleteConfirmOkTxt: { fontSize: 13, color: '#fff', fontWeight: '600' },

  authorBadge: { alignSelf: 'flex-start', backgroundColor: '#fff0e6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 4 },
  authorText: { fontSize: 13, color: '#a07050', fontWeight: '600' },

  bottomBtnRow: { flexDirection: 'row', gap: 10, marginTop: 24, alignItems: 'center' },
  deleteBtnBottom: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: '#f5c0c0', alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt: { fontSize: 20 },
})
