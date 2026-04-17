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
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
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
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photo_uri)
  const [isEditing, setIsEditing] = useState(!existing)

  useEffect(() => {
    if (existing) {
      setMood(existing.mood)
      setWeather(existing.weather)
      setText(existing.text ?? '')
      setPhotoUri(existing.photo_uri)
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
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 권한이 필요해요.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  function showPhotoOptions() {
    Alert.alert('사진 추가', '', [
      { text: '카메라로 찍기', onPress: takePhoto },
      { text: '앨범에서 선택', onPress: pickPhoto },
      { text: '취소', style: 'cancel' },
    ])
  }

  function handleSave() {
    if (!date) return
    upsertEntry({ date, mood, weather, text: text.trim(), photo_uri: photoUri })
    setIsEditing(false)
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
          {existing && isEditing ? (
            <TouchableOpacity onPress={handleDelete} style={styles.editBtn}>
              <Text style={styles.deleteTxt}>삭제</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Mood */}
          <Text style={styles.sectionLabel}>오늘의 기분</Text>
          <View style={styles.emojiRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.emoji}
                style={[
                  styles.emojiBtn,
                  mood === m.emoji && styles.emojiBtnActive,
                  !isEditing && mood !== m.emoji && styles.emojiBtnDisabled,
                ]}
                onPress={() => isEditing && setMood(mood === m.emoji ? undefined : m.emoji)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, !isEditing && mood !== m.emoji && styles.emojiDim]}>
                  {m.emoji}
                </Text>
                <Text style={[styles.emojiLabel, mood === m.emoji && styles.emojiLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weather */}
          <Text style={styles.sectionLabel}>오늘의 날씨</Text>
          <View style={styles.emojiRow}>
            {WEATHERS.map((w) => (
              <TouchableOpacity
                key={w.emoji}
                style={[
                  styles.emojiBtn,
                  weather === w.emoji && styles.emojiBtnActive,
                  !isEditing && weather !== w.emoji && styles.emojiBtnDisabled,
                ]}
                onPress={() => isEditing && setWeather(weather === w.emoji ? undefined : w.emoji)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={[styles.emojiIcon, !isEditing && weather !== w.emoji && styles.emojiDim]}>
                  {w.emoji}
                </Text>
                <Text style={[styles.emojiLabel, weather === w.emoji && styles.emojiLabelActive]}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text */}
          <Text style={styles.sectionLabel}>오늘 하루</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="오늘은 어떤 하루였나요? ✍️"
              placeholderTextColor="#c5a890"
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
              autoFocus={!!existing}
            />
          ) : (
            <View style={styles.textView}>
              <Text style={text ? styles.textContent : styles.textEmpty}>
                {text || '기록 없음'}
              </Text>
            </View>
          )}

          {/* Photo */}
          <Text style={styles.sectionLabel}>사진</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              {isEditing && (
                <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhotoUri(undefined)}>
                  <Text style={styles.photoRemoveTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isEditing ? (
            <TouchableOpacity style={styles.photoAddBtn} onPress={showPhotoOptions} activeOpacity={0.7}>
              <Text style={styles.photoAddIcon}>📷</Text>
              <Text style={styles.photoAddTxt}>사진 추가</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoEmpty}>
              <Text style={styles.textEmpty}>사진 없음</Text>
            </View>
          )}

          {/* 버튼 */}
          {!isEditing && existing ? (
            <TouchableOpacity style={styles.editBtnBottom} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
              <Text style={styles.editBtnTxt}>편집</Text>
            </TouchableOpacity>
          ) : isEditing ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
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

  photoContainer: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  photo: { width: '100%', height: 220, borderRadius: 16 },
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
})
