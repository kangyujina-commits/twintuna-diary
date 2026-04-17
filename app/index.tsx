import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDiary } from '../src/context/DiaryContext'

const DAYS = ['Sun/일', 'Mon/월', 'Tue/화', 'Wed/수', 'Thu/목', 'Fri/금', 'Sat/토']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const APP_NAME_KEY = '@twintuna_diary:appName'
const DEFAULT_NAME = 'TwinTuna_Diary'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarScreen() {
  const router = useRouter()
  const { getEntry, diaryId, isConnected, nickname, setNickname, connectDiary } = useDiary()
  const [showShare, setShowShare] = useState(false)
  const [connectInput, setConnectInput] = useState('')
  const [connectMsg, setConnectMsg] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')

  useEffect(() => { setNicknameInput(nickname) }, [nickname])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const [appName, setAppName] = useState(DEFAULT_NAME)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(DEFAULT_NAME)

  useEffect(() => {
    AsyncStorage.getItem(APP_NAME_KEY).then((saved) => {
      if (saved) { setAppName(saved); setNameInput(saved) }
    })
  }, [])

  function saveName() {
    const trimmed = nameInput.trim() || DEFAULT_NAME
    setAppName(trimmed)
    setNameInput(trimmed)
    AsyncStorage.setItem(APP_NAME_KEY, trimmed)
    setEditingName(false)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                maxLength={30}
              />
              <TouchableOpacity onPress={saveName} style={styles.nameConfirmBtn}>
                <Text style={styles.nameConfirmTxt}>Done / 완료</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onLongPress={() => { setNameInput(appName); setEditingName(true) }} activeOpacity={0.8}>
              <Text style={styles.appTitle}>{appName}</Text>
            </TouchableOpacity>
          )}
          {!editingName && (
            <Text style={styles.nameHint}>Long press to rename / 길게 눌러서 이름 변경</Text>
          )}
          {!editingName && (
            <View style={styles.statusRow}>
              {isConnected && <Text style={styles.connectedBadge}>🔗 연결 중</Text>}
              {nickname ? <Text style={styles.nicknameBadge}>✏️ {nickname}</Text> : null}
              <TouchableOpacity onPress={() => { setShowShare(true); setConnectMsg('') }} style={styles.shareBtn}>
                <Text style={styles.shareBtnTxt}>연결 설정</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 공유 코드 패널 */}
        {showShare && (
          <View style={styles.sharePanel}>
            <Text style={styles.sharePanelTitle}>📎 공유 코드 / Share Code</Text>
            <View style={styles.nicknameRow}>
              <Text style={styles.nicknameLabel}>내 이름</Text>
              <TextInput
                style={styles.nicknameInput}
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="닉네임 입력"
                placeholderTextColor="#c5a890"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={() => setNickname(nicknameInput.trim())}
                onBlur={() => setNickname(nicknameInput.trim())}
              />
            </View>
            <View style={styles.myCodeRow}>
              <Text style={styles.myCodeLabel}>내 코드</Text>
              <Text style={styles.myCode}>{diaryId}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    navigator.clipboard?.writeText(diaryId)
                  }
                  setConnectMsg('복사됐어요!')
                  setTimeout(() => setConnectMsg(''), 2000)
                }}
                style={styles.copyBtn}
              >
                <Text style={styles.copyBtnTxt}>복사</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.shareDivider}>파트너 코드 입력 / Enter partner's code</Text>
            <View style={styles.connectRow}>
              <TextInput
                style={styles.connectInput}
                value={connectInput}
                onChangeText={(t) => setConnectInput(t.toUpperCase())}
                placeholder="XXXXXX"
                placeholderTextColor="#c5a890"
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={async () => {
                  if (connectInput.length < 6) {
                    setConnectMsg('6자리 코드를 입력하세요')
                    return
                  }
                  await connectDiary(connectInput)
                  setConnectInput('')
                  setShowShare(false)
                  setConnectMsg('')
                }}
              >
                <Text style={styles.connectBtnTxt}>연결</Text>
              </TouchableOpacity>
            </View>
            {connectMsg ? <Text style={styles.connectMsg}>{connectMsg}</Text> : null}
            <TouchableOpacity onPress={() => setShowShare(false)} style={styles.sharePanelClose}>
              <Text style={styles.sharePanelCloseTxt}>닫기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTHS_EN[month]} / {month + 1}월 {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week header */}
        <View style={styles.weekRow}>
          {DAYS.map((d, i) => (
            <Text
              key={d}
              style={[styles.weekLabel, i === 0 && styles.sun, i === 6 && styles.sat]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.cell} />
            const dateStr = toDateString(year, month, day)
            const entry = getEntry(dateStr)
            const isToday = dateStr === todayStr
            const col = idx % 7

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.cell, isToday && styles.todayCell]}
                onPress={() => router.push({ pathname: '/entry', params: { date: dateStr } })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNum,
                    col === 0 && styles.sun,
                    col === 6 && styles.sat,
                    isToday && styles.todayNum,
                  ]}
                >
                  {day}
                </Text>
                {entry?.mood
                  ? <Text style={styles.icon}>{entry.mood}</Text>
                  : null}
                {entry?.schedule?.trim()
                  ? <Text style={styles.schedulePreview} numberOfLines={1} ellipsizeMode="tail">
                      {entry.schedule.trim()}
                    </Text>
                  : null}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendText}>Tap a date to write / 날짜를 탭해서 일기를 써보세요 ✏️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const CELL_SIZE = 48

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdf6f0' },
  scroll: { paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 4 },
  appTitle: { fontSize: 22, fontWeight: '700', color: '#3d2c1e', letterSpacing: 0.5 },
  nameHint: { fontSize: 11, color: '#c9b8a8', marginTop: 3 },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3d2c1e',
    borderBottomWidth: 2,
    borderBottomColor: '#c9a882',
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 120,
    textAlign: 'center',
  },
  nameConfirmBtn: {
    backgroundColor: '#c9a882',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nameConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 24,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: '#c9a882', lineHeight: 30 },
  monthLabel: { fontSize: 18, fontWeight: '600', color: '#3d2c1e', minWidth: 160, textAlign: 'center' },

  weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#a08070' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: {
    width: `${100 / 7}%`,
    minHeight: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayCell: { backgroundColor: '#ffe8d2' },
  dayNum: { fontSize: 13, color: '#5a3e2b', fontWeight: '500' },
  todayNum: { fontWeight: '700', color: '#c96a30' },
  sun: { color: '#e05c5c' },
  sat: { color: '#5b8ee0' },
  icon: { fontSize: 14, lineHeight: 18 },
  schedulePreview: {
    fontSize: 9,
    color: '#8b6f56',
    width: '92%',
    textAlign: 'center',
    lineHeight: 12,
  },

  legend: { alignItems: 'center', marginTop: 20 },
  legendText: { fontSize: 12, color: '#b09080' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  connectedBadge: { fontSize: 11, color: '#4a9e6b', fontWeight: '700', backgroundColor: '#e8f7ee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  nicknameBadge: { fontSize: 11, color: '#7a5c3e', backgroundColor: '#fff0e6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  shareBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#f5e8d8', borderWidth: 1, borderColor: '#e8c9a8' },
  shareBtnTxt: { fontSize: 11, color: '#a07050', fontWeight: '600' },

  nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, backgroundColor: '#fdf6f0', borderRadius: 12, padding: 10 },
  nicknameLabel: { fontSize: 12, color: '#a08070', width: 44 },
  nicknameInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3d2c1e', borderBottomWidth: 1.5, borderBottomColor: '#e8c9a8', paddingVertical: 2 },

  sharePanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
  },
  sharePanelTitle: { fontSize: 14, fontWeight: '700', color: '#3d2c1e', marginBottom: 12, textAlign: 'center' },
  myCodeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf0e8', borderRadius: 12, padding: 10, marginBottom: 12, gap: 8 },
  myCodeLabel: { fontSize: 12, color: '#a08070' },
  myCode: { flex: 1, fontSize: 22, fontWeight: '800', color: '#c96a30', letterSpacing: 3, textAlign: 'center' },
  copyBtn: { backgroundColor: '#c9a882', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  copyBtnTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  shareDivider: { fontSize: 11, color: '#b09080', textAlign: 'center', marginBottom: 10 },
  connectRow: { flexDirection: 'row', gap: 8 },
  connectInput: {
    flex: 1,
    backgroundColor: '#fdf6f0',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f0e0d0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#3d2c1e',
    letterSpacing: 3,
    textAlign: 'center',
  },
  connectBtn: { backgroundColor: '#c9a882', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  connectBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  connectMsg: { fontSize: 12, color: '#c96a30', textAlign: 'center', marginTop: 8 },
  sharePanelClose: { alignItems: 'center', marginTop: 12 },
  sharePanelCloseTxt: { fontSize: 12, color: '#b09080' },
})
