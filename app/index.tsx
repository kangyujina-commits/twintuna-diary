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
import { useTheme } from '../src/context/ThemeContext'
import { useLock } from '../src/context/LockContext'
import PinScreen from '../src/components/PinScreen'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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
  const { getMyEntry, getEntriesForDate, diaryId, deviceId, isConnected, nickname, setNickname, appName: sharedAppName, setAppName: setSharedAppName, connectDiary } = useDiary()
  const { isDark, colors, toggleTheme } = useTheme()
  const { hasPin, removePin, setupPin } = useLock()
  const [pinFirstInput, setPinFirstInput] = useState('')
  const [pinStep, setPinStep] = useState<'first' | 'confirm' | null>(null)

  const [showShare, setShowShare] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [connectInput, setConnectInput] = useState('')
  const [connectMsg, setConnectMsg] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(sharedAppName)

  useEffect(() => { setNameInput(sharedAppName) }, [sharedAppName])
  useEffect(() => { setNicknameInput(nickname) }, [nickname])

  function saveName() {
    const trimmed = nameInput.trim() || DEFAULT_NAME
    setSharedAppName(trimmed)
    setEditingName(false)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // PIN 설정 플로우
  if (showPinSetup && pinStep === null) {
    return <PinScreen mode="setup" title="새 PIN 입력 (4자리)"
      onSkip={() => setShowPinSetup(false)}
      onConfirm={(p) => { setPinFirstInput(p); setPinStep('confirm') }} />
  }
  if (showPinSetup && pinStep === 'confirm') {
    return <PinScreen mode="confirm" title="PIN 확인 (다시 입력)"
      onConfirm={async (p) => {
        if (p === pinFirstInput) { await setupPin(p); setShowPinSetup(false); setPinStep(null) }
        else { setPinStep(null) }  // 불일치 → 처음부터
      }} />
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.accent }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus selectTextOnFocus returnKeyType="done"
                  onSubmitEditing={saveName} maxLength={30}
                />
                <TouchableOpacity onPress={saveName} style={[styles.nameConfirmBtn, { backgroundColor: colors.accent }]}>
                  <Text style={styles.nameConfirmTxt}>완료</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.titleRow}>
                <Text style={[styles.appTitle, { color: colors.text }]}>{sharedAppName}</Text>
                <TouchableOpacity
                  onPress={() => { setNameInput(sharedAppName); setEditingName(true) }}
                  style={[styles.editTitleBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <Text style={styles.editTitleIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            )}
            {!editingName && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => hasPin ? removePin() : setShowPinSetup(true)}
                  style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <Text style={styles.themeBtnIcon}>{hasPin ? '🔒' : '🔓'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={styles.themeBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!editingName && (
            <View style={styles.statusRow}>
              {isConnected && (
                <View style={[styles.badge, { backgroundColor: colors.connectedBg }]}>
                  <Text style={[styles.badgeTxt, { color: colors.connectedText }]}>🔗 연결 중</Text>
                </View>
              )}
              {nickname ? (
                <View style={[styles.badge, { backgroundColor: colors.todayBg }]}>
                  <Text style={[styles.badgeTxt, { color: colors.todayText }]}>{nickname}</Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={() => { setShowShare(true); setConnectMsg('') }}
                style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.shareBtnTxt, { color: colors.textMuted }]}>연결 설정</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 공유 패널 */}
        {showShare && (
          <View style={[styles.sharePanel, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sharePanelTitle, { color: colors.text }]}>📎 공유 코드</Text>

            <View style={[styles.nicknameRow, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.nicknameLabel, { color: colors.textMuted }]}>내 이름</Text>
              <TextInput
                style={[styles.nicknameInput, { color: colors.text, borderBottomColor: colors.accent }]}
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="닉네임 입력"
                placeholderTextColor={colors.hint}
                maxLength={10} returnKeyType="done"
                onSubmitEditing={() => setNickname(nicknameInput.trim())}
                onBlur={() => setNickname(nicknameInput.trim())}
              />
            </View>

            <View style={[styles.myCodeRow, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.myCodeLabel, { color: colors.textMuted }]}>내 코드</Text>
              <Text style={[styles.myCode, { color: colors.todayText }]}>{diaryId}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') navigator.clipboard?.writeText(diaryId)
                  setConnectMsg('복사됐어요!')
                  setTimeout(() => setConnectMsg(''), 2000)
                }}
                style={[styles.copyBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.copyBtnTxt}>복사</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.shareDivider, { color: colors.textLight }]}>↑ 이 코드를 파트너에게 알려주거나, 파트너 코드 입력</Text>
            <View style={styles.connectRow}>
              <TextInput
                style={[styles.connectInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
                value={connectInput}
                onChangeText={(t) => setConnectInput(t.toUpperCase())}
                placeholder="XXXXXX" placeholderTextColor={colors.hint}
                autoCapitalize="characters" maxLength={6}
              />
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: colors.accent }]}
                onPress={async () => {
                  if (connectInput.length < 6) { setConnectMsg('6자리 코드를 입력하세요'); return }
                  await connectDiary(connectInput)
                  setConnectInput(''); setShowShare(false); setConnectMsg('')
                }}
              >
                <Text style={styles.connectBtnTxt}>연결</Text>
              </TouchableOpacity>
            </View>
            {connectMsg ? <Text style={[styles.connectMsg, { color: colors.todayText }]}>{connectMsg}</Text> : null}
            <TouchableOpacity onPress={() => setShowShare(false)} style={styles.sharePanelClose}>
              <Text style={[styles.sharePanelCloseTxt, { color: colors.textMuted }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 월 네비 */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.accent }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {MONTHS_EN[month]} / {month + 1}월 {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekRow}>
          {DAYS.map((d, i) => (
            <Text key={d} style={[
              styles.weekLabel,
              { color: colors.textMuted },
              i === 0 && { color: colors.sun },
              i === 6 && { color: colors.sat },
            ]}>
              {d}{'\n'}{DAYS_KO[i]}
            </Text>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.cell} />
            const dateStr = toDateString(year, month, day)
            const myEntry = getMyEntry(dateStr)
            const allEntries = getEntriesForDate(dateStr)
            const myEntryDocId = myEntry?.id ?? `${dateStr}_${deviceId}`
            const otherEntry = allEntries.find(e => e.id !== myEntryDocId)
            const hasEntry = allEntries.length > 0
            const isToday = dateStr === todayStr
            const col = idx % 7

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  hasEntry && { backgroundColor: colors.cellEntry, borderColor: colors.cellEntryBorder, borderWidth: 1, borderRadius: 14 },
                  isToday && { backgroundColor: colors.todayBg, borderColor: colors.accent, borderWidth: 1.5, borderRadius: 14 },
                ]}
                onPress={() => router.push({ pathname: '/entry', params: { date: dateStr } })}
                activeOpacity={0.7}
              >
                {/* 날짜 숫자 */}
                <View style={[isToday && styles.todayCircle, isToday && { backgroundColor: colors.todayText }]}>
                  <Text style={[
                    styles.dayNum,
                    { color: colors.text },
                    col === 0 && { color: colors.sun },
                    col === 6 && { color: colors.sat },
                    isToday && styles.todayNum,
                  ]}>
                    {day}
                  </Text>
                </View>

                {/* 기분 이모지 - 나 / 상대 */}
                <View style={styles.moodRow}>
                  {myEntry?.mood
                    ? <Text style={[styles.moodIcon, { color: colors.text }]}>{myEntry.mood}</Text>
                    : null}
                  {otherEntry?.mood
                    ? <Text style={[styles.moodIcon, { color: colors.text, opacity: 0.6 }]}>{otherEntry.mood}</Text>
                    : null}
                </View>

                {/* 일정: 내 것 우선, 없으면 상대 것 */}
                {(myEntry?.schedule || otherEntry?.schedule)
                  ? <Text style={[styles.schedulePreview, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                      {(myEntry?.schedule || otherEntry?.schedule)!.trim()}
                    </Text>
                  : null}

                {/* 남의 일기만 있고 내 일기가 없을 때 + 뱃지 */}
                {!myEntry && otherEntry && (
                  <View style={[styles.addEntryBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.addEntryBadgeTxt}>＋</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: colors.textLight }]}>날짜를 탭해서 일기를 써보세요 ✏️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  nameHint: { fontSize: 11, marginTop: 3 },
  themeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  themeBtnIcon: { fontSize: 18 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editTitleBtn: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  editTitleIcon: { fontSize: 14 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { fontSize: 20, fontWeight: '700', borderBottomWidth: 2, paddingVertical: 2, paddingHorizontal: 4, minWidth: 120, textAlign: 'center' },
  nameConfirmBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  nameConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  shareBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  shareBtnTxt: { fontSize: 11, fontWeight: '600' },

  sharePanel: { marginHorizontal: 16, marginBottom: 8, borderRadius: 18, padding: 18, borderWidth: 1.5 },
  sharePanelTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, borderRadius: 12, padding: 10 },
  nicknameLabel: { fontSize: 12, width: 44 },
  nicknameInput: { flex: 1, fontSize: 15, fontWeight: '600', borderBottomWidth: 1.5, paddingVertical: 2 },
  myCodeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 10, marginBottom: 12, gap: 8 },
  myCodeLabel: { fontSize: 12 },
  myCode: { flex: 1, fontSize: 22, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  copyBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  copyBtnTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  shareDivider: { fontSize: 11, textAlign: 'center', marginBottom: 10 },
  connectRow: { flexDirection: 'row', gap: 8 },
  connectInput: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, fontWeight: '700', letterSpacing: 3, textAlign: 'center' },
  connectBtn: { borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  connectBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  connectMsg: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  sharePanelClose: { alignItems: 'center', marginTop: 12 },
  sharePanelCloseTxt: { fontSize: 12 },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 24 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, lineHeight: 30 },
  monthLabel: { fontSize: 18, fontWeight: '600', minWidth: 160, textAlign: 'center' },

  weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', lineHeight: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, gap: 0 },
  cell: { width: `${100 / 7}%`, minHeight: 64, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 },

  todayCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontWeight: '500' },
  todayNum: { fontWeight: '800', color: '#fff', fontSize: 13 },
  moodRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  moodIcon: { fontSize: 14, lineHeight: 18 },
  schedulePreview: { fontSize: 9, width: '92%', textAlign: 'center', lineHeight: 12, marginTop: 1 },
  addEntryBadge: { marginTop: 4, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 1 },
  addEntryBadgeTxt: { fontSize: 10, color: '#fff', fontWeight: '800' },

  legend: { alignItems: 'center', marginTop: 20 },
  legendText: { fontSize: 12 },

  pinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  pinLabel: { fontSize: 13, fontWeight: '600' },
  pinBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
})
