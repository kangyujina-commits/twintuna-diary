import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
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
import { uploadPhoto } from '../src/utils/uploadPhoto'
import { analyzeEntry } from '../src/utils/analyzeEntry'

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

const MAX_TEXT = 500
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
  const { getMyEntry, getEntriesForDate, upsertEntry, deleteEntry, nickname, deviceId, diaryId } = useDiary()
  const { colors, bgImage } = useTheme()

  const myEntry = date ? getMyEntry(date) : undefined
  const allEntries = date ? getEntriesForDate(date) : []
  // 내 entry id를 기준으로 제외 (포맷 무관하게 가장 정확)
  const myEntryDocId = myEntry?.id ?? `${date}_${deviceId}`
  const otherEntries = allEntries.filter(e => e.id !== myEntryDocId)

  const [mood, setMood] = useState<string | undefined>(myEntry?.mood)
  const [weather, setWeather] = useState<string | undefined>(myEntry?.weather)
  const [showCustomMood, setShowCustomMood] = useState(false)
  const [showCustomWeather, setShowCustomWeather] = useState(false)
  const [customMoodInput, setCustomMoodInput] = useState('')
  const [customWeatherInput, setCustomWeatherInput] = useState('')
  const [text, setText] = useState(myEntry?.text ?? '')
  const [photoUris, setPhotoUris] = useState<string[]>(myEntry?.photo_uris ?? [])
  const [schedule, setSchedule] = useState(myEntry?.schedule ?? '')
  // 남의 일기가 있으면 먼저 보기 모드, 아무것도 없을 때만 바로 작성 모드
  const [isEditing, setIsEditing] = useState(!myEntry && otherEntries.length === 0)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [collapsedOthers, setCollapsedOthers] = useState<Set<string>>(new Set())
  const [analysis, setAnalysis] = useState<string | null>(null)

  function toggleCollapse(id: string) {
    setCollapsedOthers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (myEntry) {
      setMood(myEntry.mood)
      setWeather(myEntry.weather)
      setText(myEntry.text ?? '')
      setPhotoUris(myEntry.photo_uris ?? [])
      setSchedule(myEntry.schedule ?? '')
      setIsEditing(false)
    } else {
      setMood(undefined)
      setWeather(undefined)
      setText('')
      setPhotoUris([])
      // 남의 일기가 있으면 보기 모드 유지, 없으면 바로 작성 모드
      setIsEditing(allEntries.length === 0)
    }
  }, [date, myEntry?.id, allEntries.length])

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

  async function handleSave() {
    if (!date) return
    await upsertEntry({ date, mood, weather, text: text.trim(), schedule: schedule.trim(), author: nickname || undefined })
    setIsEditing(false)
  }

  function handleDelete() {
    if (!myEntry) return
    deleteEntry(myEntry.id)
    router.back()
  }

  const inner = (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgImage ? 'transparent' : colors.bg }]}>
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


        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 상대방 일기 */}
          {otherEntries.map((other) => {
            const collapsed = collapsedOthers.has(other.id)
            return (
              <View key={other.id} style={[styles.otherEntry, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                {/* 헤더 행: 작성자 + 기분/날씨 + 토글 버튼 */}
                <TouchableOpacity style={styles.otherHeader} onPress={() => toggleCollapse(other.id)} activeOpacity={0.7}>
                  <View style={styles.otherHeaderLeft}>
                    {other.author && (
                      <Text style={[styles.otherAuthor, { color: colors.accent }]}>{other.author}</Text>
                    )}
                    <View style={styles.otherMoodRow}>
                      {other.mood && <Text style={styles.otherMoodIcon}>{other.mood}</Text>}
                      {other.weather && <Text style={styles.otherMoodIcon}>{other.weather}</Text>}
                    </View>
                  </View>
                  <Text style={[styles.otherToggleIcon, { color: colors.textMuted }]}>
                    {collapsed ? '▾' : '▴'}
                  </Text>
                </TouchableOpacity>

                {/* 본문 (펼쳐진 상태) */}
                {!collapsed && (<>
                  {other.schedule?.trim() ? (
                    <Text style={[styles.otherText, { color: colors.textMuted }]}>📅 {other.schedule}</Text>
                  ) : null}
                  {other.text?.trim() ? (
                    <Text style={[styles.otherText, { color: colors.text }]}>{other.text}</Text>
                  ) : null}
                  {other.photo_uris && other.photo_uris.length > 0 && (
                    <View style={[styles.photoGrid, { marginTop: 8 }]}>
                      {other.photo_uris.map((uri, idx) => (
                        <View key={uri + idx} style={styles.photoThumbContainer}>
                          <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                        </View>
                      ))}
                    </View>
                  )}
                </>)}
              </View>
            )
          })}

          {/* 남의 일기만 있고 내 일기 없을 때 → 버튼을 바로 여기에 */}
          {otherEntries.length > 0 && !myEntry && !isEditing && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.accent, marginTop: 8 }]}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveTxt, { color: colors.accent }]}>✏️ Write My Entry · 내 일기 작성하기</Text>
            </TouchableOpacity>
          )}

          {/* 내 일기 구분선 (편집 중이거나 내 일기가 있을 때) */}
          {otherEntries.length > 0 && (myEntry || isEditing) && (
            <View style={[styles.myEntryDivider, { borderColor: colors.accent }]}>
              <Text style={[styles.myEntryDividerTxt, { color: colors.accent }]}>
                {myEntry?.author || 'My Diary · 내 일기'}
              </Text>
            </View>
          )}

          {/* 내 폼 - 내 일기가 있거나 편집 중일 때만 표시 */}
          {(myEntry || isEditing) && (<>

          {/* 내 작성자 표시 */}
          {!isEditing && myEntry?.author && otherEntries.length === 0 && (
            <View style={[styles.authorBadge, { backgroundColor: colors.todayBg }]}>
              <Text style={[styles.authorText, { color: colors.todayText }]}>{myEntry.author}</Text>
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
              placeholder="Today's schedule · 오늘의 일정 🐈‍⬛"
              placeholderTextColor={colors.hint}
              value={schedule} onChangeText={setSchedule} returnKeyType="done"
            />
          ) : (
            <View style={[styles.scheduleView, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={schedule ? [styles.scheduleContent, { color: colors.text }] : [styles.textEmpty, { color: colors.hint }]}>
                {schedule || 'No schedule · 일정 없음'}
              </Text>
            </View>
          )}

          {/* Text */}
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>Today / 오늘 하루</Text>
          {isEditing ? (
            <View>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                multiline
                placeholder="How was your day? · 오늘은 어떤 하루였나요? ✍️"
                placeholderTextColor={colors.hint}
                value={text} onChangeText={(t) => setText(t.slice(0, MAX_TEXT))}
                textAlignVertical="top" autoFocus={!myEntry}
                maxLength={MAX_TEXT}
              />
              <Text style={[
                styles.charCounter,
                { color: text.length >= MAX_TEXT ? '#e05c5c' : text.length >= MAX_TEXT * 0.85 ? colors.accent : colors.textMuted }
              ]}>
                {text.length} / {MAX_TEXT}
              </Text>
            </View>
          ) : (
            <View style={[styles.textView, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={text ? [styles.textContent, { color: colors.text }] : [styles.textEmpty, { color: colors.hint }]}>
                {text || 'No entry · 기록 없음'}
              </Text>
            </View>
          )}

          {/* Photo - Firebase Storage 업그레이드 후 활성화 예정 */}

          {/* 버튼 */}
          {!isEditing && myEntry ? (
            <View style={{ marginTop: 24 }}>
              {showDeleteConfirm && (
                <View style={[styles.deleteConfirmInline, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.deleteConfirmInlineTxt, { color: colors.text }]}>Delete this entry? · 정말 삭제할까요?</Text>
                  <View style={styles.deleteConfirmInlineBtns}>
                    <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} style={[styles.deleteConfirmInlineBtn, { borderColor: colors.cardBorder }]}>
                      <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: colors.textMuted }]}>Cancel · 취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={[styles.deleteConfirmInlineBtn, { backgroundColor: '#e05c5c', borderColor: '#e05c5c' }]}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Delete · 삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={styles.bottomBtnRow}>
                <TouchableOpacity style={[styles.editBtnBottom, { flex: 1, borderColor: colors.accent, backgroundColor: colors.card, marginTop: 0 }]} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                  <Text style={[styles.editBtnTxt, { color: colors.accent }]}>Edit · 편집</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtnBottom, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => setShowDeleteConfirm((v) => !v)} activeOpacity={0.8}>
                  <Text style={styles.deleteBtnTxt}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isEditing ? (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveTxt}>Save · 저장하기</Text>
            </TouchableOpacity>
          ) : null}

          {/* AI 분석 버튼 — 내 일기 있고 보기 모드일 때 */}
          {myEntry && !isEditing && (text || mood) && (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.analysisBtn, { borderColor: colors.accent }]}
                onPress={() => setAnalysis(analyzeEntry(mood, weather, text))}
                activeOpacity={0.7}
              >
                <Text style={[styles.analysisBtnTxt, { color: colors.accent }]}>🐶🐱 Tunas</Text>
              </TouchableOpacity>

              {analysis && (
                <View style={[styles.analysisCard, { backgroundColor: colors.todayBg, borderColor: colors.cellEntryBorder }]}>
                  <Text style={[styles.analysisTxt, { color: colors.text }]}>{analysis}</Text>
                  <TouchableOpacity onPress={() => setAnalysis(null)} style={styles.analysisDismiss}>
                    <Text style={[styles.analysisDismissTxt, { color: colors.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}


          </>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }} imageStyle={{ opacity: 0.45 }}>
        {inner}
      </ImageBackground>
    )
  }
  return inner
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
  charCounter: { fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 5, paddingRight: 2 },

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


  authorBadge: { alignSelf: 'flex-start', backgroundColor: '#fff0e6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 4 },
  authorText: { fontSize: 13, color: '#a07050', fontWeight: '600' },

  otherEntry: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  otherHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otherHeaderLeft: { flex: 1 },
  otherToggleIcon: { fontSize: 16, paddingLeft: 8 },
  otherAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  otherMoodRow: { flexDirection: 'row', gap: 6 },
  otherMoodIcon: { fontSize: 20 },
  otherText: { fontSize: 14, lineHeight: 20, marginTop: 8 },

  bottomBtnRow: { flexDirection: 'row', gap: 10, marginTop: 24, alignItems: 'center' },
  deleteBtnBottom: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt: { fontSize: 20 },
  deleteConfirmInline: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  deleteConfirmInlineTxt: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  deleteConfirmInlineBtns: { flexDirection: 'row', gap: 8 },
  deleteConfirmInlineBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },

  analysisBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderStyle: 'dashed' },
  analysisBtnTxt: { fontSize: 14, fontWeight: '700' },
  analysisCard: { marginTop: 10, borderRadius: 14, borderWidth: 1.5, padding: 14, position: 'relative' },
  analysisTxt: { fontSize: 14, lineHeight: 24, fontWeight: '500' },
  analysisDismiss: { position: 'absolute', top: 8, right: 10 },
  analysisDismissTxt: { fontSize: 14, fontWeight: '700' },

  myEntryDivider: { borderTopWidth: 1.5, marginVertical: 16, paddingTop: 12, alignItems: 'center' },
  myEntryDividerTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
})
