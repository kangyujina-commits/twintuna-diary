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
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useDiary } from '../src/context/DiaryContext'
import { useTheme, ACCENT_PRESETS } from '../src/context/ThemeContext'
import { useLock } from '../src/context/LockContext'
import { getDayGreeting, getStreakMessage } from '../src/utils/tunasMessages'
import OpacitySlider from '../src/components/OpacitySlider'
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
  const {
    getMyEntry, getEntriesForDate, entries, diaryId, deviceId,
    isConnected, nickname, setNickname,
    appName: sharedAppName, setAppName: setSharedAppName,
    connectDiary, disconnectDiary,
    dday, setDday,
  } = useDiary()
  const { isDark, colors, toggleTheme, accentColor, setAccentColor, bgImage, setBgImage, isBgLoading, bgOpacity, setBgOpacity } = useTheme()
  const { hasPin, removePin, setupPin } = useLock()

  const hasOtherDevice = Object.values(entries).some(e => e.deviceId && e.deviceId !== deviceId)
  const showConnected = isConnected || hasOtherDevice

  // PIN 설정 플로우
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinFirstInput, setPinFirstInput] = useState('')
  const [pinStep, setPinStep] = useState<'first' | 'confirm' | null>(null)

  // 설정 패널
  const [showSettings, setShowSettings] = useState(false)
  const [nameInput, setNameInput] = useState(sharedAppName)
  const [connectInput, setConnectInput] = useState('')
  const [connectMsg, setConnectMsg] = useState('')
  const [disconnectConfirm, setDisconnectConfirm] = useState(false)
  const [uploadBgError, setUploadBgError] = useState('')

  // 인라인 편집 모드 (nickname | dday | null)
  const [editMode, setEditMode] = useState<'nickname' | 'dday' | null>(null)
  const [showTunas, setShowTunas] = useState(true)

  // 스트릭 계산 (오늘부터 연속 작성일 수)
  const streak = (() => {
    let count = 0
    const check = new Date()
    check.setHours(0, 0, 0, 0)
    while (true) {
      const ds = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`
      const has = Object.values(entries).some(e => e.deviceId === deviceId && e.date === ds)
      if (!has) break
      count++
      check.setDate(check.getDate() - 1)
    }
    return count
  })()
  const [nicknameInput, setNicknameInput] = useState('')
  const [ddayLabelInput, setDdayLabelInput] = useState('')
  const [ddayDateInput, setDdayDateInput] = useState('')

  function calcDday(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return 'D-Day!'
    if (diff < 0) return `D+${Math.abs(diff)}`
    return `D-${diff}`
  }

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())

  useEffect(() => { setNameInput(sharedAppName) }, [sharedAppName])
  useEffect(() => { setNicknameInput(nickname) }, [nickname])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function openSettings() {
    setNameInput(sharedAppName)
    setConnectMsg('')
    setDisconnectConfirm(false)
    setShowSettings(true)
  }
  function closeSettings() {
    setShowSettings(false)
    setDisconnectConfirm(false)
    setConnectMsg('')
  }

  // PIN 설정 플로우 화면 전환
  if (showPinSetup && pinStep === null) {
    return <PinScreen mode="setup" title={"New PIN · 새 PIN 입력"}
      onSkip={() => setShowPinSetup(false)}
      onConfirm={(p) => { setPinFirstInput(p); setPinStep('confirm') }} />
  }
  if (showPinSetup && pinStep === 'confirm') {
    return <PinScreen mode="confirm" title={"Confirm PIN · PIN 확인"}
      onConfirm={async (p) => {
        if (p === pinFirstInput) { await setupPin(p); setShowPinSetup(false); setPinStep(null) }
        else { setPinStep(null) }
      }} />
  }

  const screenContent = (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgImage ? 'transparent' : colors.bg }]}>
      {/* ── 인라인 편집 오버레이 (바깥 탭 → 닫기) ── */}
      {editMode && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
          onPress={() => setEditMode(null)}
          activeOpacity={1}
        />
      )}

      {/* ── 닉네임 편집 카드 (overlay 위, 절대 위치) ── */}
      {editMode === 'nickname' && (
        <View style={[styles.floatingCard, { zIndex: 100, backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.ddayDateRow}>
            <TextInput
              style={[styles.ddayDateInput, { color: colors.text, borderBottomColor: colors.accent, flex: 1, fontSize: 15 }]}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="My Name · 내 이름"
              placeholderTextColor={colors.hint}
              maxLength={10}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={async () => { await setNickname(nicknameInput.trim()); setEditMode(null) }}
            />
            <TouchableOpacity
              style={[styles.ddaySaveBtn, { backgroundColor: colors.accent }]}
              onPress={async () => { await setNickname(nicknameInput.trim()); setEditMode(null) }}
            >
              <Text style={styles.ddaySaveTxt}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── D-day 편집 카드 (overlay 위, 절대 위치) ── */}
      {editMode === 'dday' && (
        <View style={[styles.floatingCard, { zIndex: 100, backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.ddayLabelInput, { color: colors.text, borderBottomColor: colors.accent }]}
            value={ddayLabelInput}
            onChangeText={setDdayLabelInput}
            placeholder="Label · 이름"
            placeholderTextColor={colors.hint}
            maxLength={20}
            autoFocus
            returnKeyType="next"
          />
          <View style={styles.ddayDateRow}>
            <TextInput
              style={[styles.ddayDateInput, { color: colors.text, borderBottomColor: colors.accent, flex: 1 }]}
              value={ddayDateInput}
              onChangeText={(t) => {
                const digits = t.replace(/\D/g, '').slice(0, 8)
                let formatted = digits
                if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4)
                if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6)
                setDdayDateInput(formatted)
              }}
              placeholder="YYYYMMDD"
              placeholderTextColor={colors.hint}
              maxLength={10}
              keyboardType="numeric"
              returnKeyType="done"
            />
            {dday && (
              <TouchableOpacity
                style={[styles.ddayRemoveBtn, { borderColor: '#e05c5c' }]}
                onPress={async () => { await setDday(null); setEditMode(null) }}
              >
                <Text style={styles.ddayRemoveTxt}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.ddaySaveBtn, { backgroundColor: colors.accent }]}
              onPress={async () => {
                const d = ddayDateInput.trim()
                const l = ddayLabelInput.trim()
                if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return
                await setDday({ label: l || 'D-day', date: d })
                setEditMode(null)
              }}
            >
              <Text style={styles.ddaySaveTxt}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── 헤더 ── */}
        <View style={styles.header}>
          {/* 버튼 행 (오른쪽) */}
          <View style={styles.headerBtnRow}>
            <TouchableOpacity onPress={toggleTheme}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={styles.iconBtnTxt}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => showSettings ? closeSettings() : openSettings()}
              style={[styles.iconBtn, { backgroundColor: showSettings ? colors.accent : colors.card, borderColor: colors.cardBorder }]}>
              <Text style={styles.iconBtnTxt}>⚙️</Text>
            </TouchableOpacity>
          </View>
          {/* 타이틀 (가운데) */}
          <Text style={[styles.appTitle, { color: colors.accent }]}>{sharedAppName}</Text>

          {/* 상태 뱃지 */}
          <View style={styles.statusRow}>
            {showConnected && (
              <View style={[styles.badge, { backgroundColor: colors.connectedBg }]}>
                <Text style={[styles.badgeTxt, { color: colors.connectedText }]}>🔗 Connected · 연결 중</Text>
              </View>
            )}
            {hasPin && (
              <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                <Text style={[styles.badgeTxt, { color: colors.textMuted }]}>🔒 PIN</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => { setNicknameInput(nickname); setEditMode('nickname') }}
              style={[styles.badge, { backgroundColor: nickname ? colors.todayBg : colors.card, borderColor: colors.cardBorder, borderWidth: nickname ? 0 : 1 }]}
            >
              <Text style={[styles.badgeTxt, { color: nickname ? colors.todayText : colors.hint }]}>
                {nickname || '👤 My Name · 이름'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 설정 패널 ── */}
        {showSettings && (
          <View style={styles.panelWrap}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>⚙️ Settings · 설정</Text>

            {/* ① 다이어리 이름 */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>📔 Diary Name · 다이어리 이름</Text>
              <TextInput
                style={[styles.cardInput, { color: colors.text, borderBottomColor: colors.accent }]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={DEFAULT_NAME}
                placeholderTextColor={colors.hint}
                maxLength={30} returnKeyType="done"
                onSubmitEditing={() => { const t = nameInput.trim() || DEFAULT_NAME; setSharedAppName(t); setNameInput(t) }}
                onBlur={() => { const t = nameInput.trim() || DEFAULT_NAME; setSharedAppName(t); setNameInput(t) }}
              />
            </View>

            {/* ② 파트너 연결 */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>🔗 Partner Connect · 파트너 연결</Text>
              {/* 내 코드 */}
              <View style={[styles.codeRow, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.codeLabel, { color: colors.textMuted }]}>My Code · 내 코드</Text>
                <Text style={[styles.codeText, { color: colors.todayText }]}>{diaryId}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === 'web') navigator.clipboard?.writeText(diaryId)
                    setConnectMsg('Copied! · 복사됐어요!')
                    setTimeout(() => setConnectMsg(''), 2000)
                  }}
                  style={[styles.copyBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.copyBtnTxt}>Copy · 복사</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.codeHint, { color: colors.textLight }]}>↑ Share with partner, or enter their code below · 파트너에게 알려주거나 아래에 입력</Text>
              <View style={styles.connectCol}>
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
                    if (connectInput.length < 6) { setConnectMsg('Enter 6-digit code · 6자리 코드 입력'); return }
                    await connectDiary(connectInput)
                    setConnectInput(''); closeSettings()
                  }}
                >
                  <Text style={styles.connectBtnTxt}>Connect · 연결</Text>
                </TouchableOpacity>
              </View>
              {connectMsg ? <Text style={[styles.connectMsg, { color: colors.todayText }]}>{connectMsg}</Text> : null}

              {showConnected && (
                <View style={[styles.disconnectBox, { borderTopColor: colors.cardBorder }]}>
                  {disconnectConfirm ? (
                    <View style={styles.disconnectConfirmRow}>
                      <Text style={[styles.disconnectConfirmTxt, { color: colors.textMuted }]}>Disconnect? · 연결을 끊을까요?</Text>
                      <View style={styles.disconnectBtnRow}>
                        <TouchableOpacity
                          style={[styles.disconnectCancelBtn, { borderColor: colors.cardBorder }]}
                          onPress={() => setDisconnectConfirm(false)}
                        >
                          <Text style={[styles.disconnectCancelTxt, { color: colors.textMuted }]}>Cancel · 취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.disconnectConfirmBtn}
                          onPress={async () => { await disconnectDiary(); closeSettings() }}
                        >
                          <Text style={styles.disconnectConfirmBtnTxt}>Disconnect · 끊기</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.disconnectBtn, { borderColor: '#e05c5c' }]}
                      onPress={() => setDisconnectConfirm(true)}
                    >
                      <Text style={styles.disconnectBtnTxt}>🔌 Disconnect · 연결 끊기</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* ③ 테마 */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>🎨 Accent Color · 강조색</Text>
              <View style={styles.paletteRow}>
                {ACCENT_PRESETS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.paletteCircle, { backgroundColor: c }, accentColor === c && { borderWidth: 3, borderColor: colors.text }]}
                    onPress={() => setAccentColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>

              <Text style={[styles.cardLabel, { color: colors.textMuted, marginTop: 14 }]}>🖼️ Background · 배경</Text>
              {bgImage ? (
                <View style={{ gap: 8 }}>
                  <Image source={{ uri: bgImage }} style={{ height: 80, borderRadius: 10 }} resizeMode="cover" />
                  <Text style={[styles.cardLabel, { color: colors.textMuted, marginTop: 4, marginBottom: 0 }]}>
                    Opacity · 투명도
                  </Text>
                  <OpacitySlider value={bgOpacity} onValueChange={setBgOpacity} color={colors.accent} />
                  <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: '#e05c5c' }]}
                    onPress={async () => { await setBgImage(null) }}
                  >
                    <Text style={styles.connectBtnTxt}>Remove · 제거</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: colors.accent }]}
                  disabled={isBgLoading}
                  onPress={async () => {
                    setUploadBgError('')
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.7,
                    })
                    if (!result.canceled) {
                      try {
                        await setBgImage(result.assets[0].uri)
                      } catch (e: any) {
                        setUploadBgError(e?.message ?? 'Failed · 실패')
                      }
                    }
                  }}
                >
                  {isBgLoading
                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.connectBtnTxt}>Processing · 변환 중...</Text>
                      </View>
                    : <Text style={styles.connectBtnTxt}>📷 Upload Photo · 사진 선택</Text>
                  }
                  {uploadBgError ? (
                    <Text style={{ color: '#ffcccc', fontSize: 11, marginTop: 4, textAlign: 'center' }}>{uploadBgError}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
            </View>

            {/* ④ PIN 잠금 */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>🔒 PIN Lock · PIN 잠금</Text>
              <View style={styles.pinRow}>
                <Text style={[styles.pinStatus, { color: colors.text }]}>
                  {hasPin ? 'Active · 설정됨' : 'Not set · 설정 안 됨'}
                </Text>
                <TouchableOpacity
                  style={[styles.pinBtn, { borderColor: hasPin ? '#e05c5c' : colors.accent, backgroundColor: hasPin ? 'transparent' : colors.accent }]}
                  onPress={() => {
                    closeSettings()
                    if (hasPin) { removePin() }
                    else { setShowPinSetup(true) }
                  }}
                >
                  <Text style={[styles.pinBtnTxt, { color: hasPin ? '#e05c5c' : '#fff' }]}>
                    {hasPin ? 'Remove PIN · 해제' : 'Set PIN · 설정'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        )}

        {/* ── Tunas 코너 ── */}
        {showTunas && (() => {
          const greeting = getDayGreeting()
          const streakMsg = getStreakMessage(streak)
          return (
            <View style={[styles.tunasCard, { backgroundColor: colors.todayBg, borderColor: colors.cellEntryBorder }]}>
              <TouchableOpacity style={styles.tunasDismiss} onPress={() => setShowTunas(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Text style={[styles.tunasDismissTxt, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.tunasTxt, { color: colors.text }]}>🐶 {greeting.dog}</Text>
              <Text style={[styles.tunasTxt, { color: colors.text }]}>🐱 {greeting.cat}</Text>
              {streakMsg && (
                <>
                  <View style={[styles.tunasDivider, { backgroundColor: colors.cellEntryBorder }]} />
                  <Text style={[styles.tunasTxt, { color: colors.text }]}>🔥 {streak}일 연속</Text>
                  <Text style={[styles.tunasTxt, { color: colors.text }]}>🐶 {streakMsg.dog}</Text>
                  <Text style={[styles.tunasTxt, { color: colors.text }]}>🐱 {streakMsg.cat}</Text>
                </>
              )}
            </View>
          )
        })()}

        {/* ── D-day 행 ── */}
        <TouchableOpacity
          style={styles.ddayRow}
          onPress={() => {
            setDdayLabelInput(dday?.label ?? '')
            setDdayDateInput(dday?.date ?? '')
            setEditMode('dday')
          }}
          activeOpacity={0.7}
        >
          {dday ? (
            <>
              <Text style={[styles.ddayLabel, { color: colors.textMuted }]}>{dday.label}</Text>
              <Text style={[styles.ddayCount, { color: colors.accent }]}>{calcDday(dday.date)}</Text>
            </>
          ) : (
            <Text style={[styles.ddayEmpty, { color: colors.hint }]}>＋ Add D-day · 날짜 추가</Text>
          )}
        </TouchableOpacity>

        {/* ── 월 네비 ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.accent }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
            activeOpacity={0.7}
          >
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTHS_EN[month]} / {month + 1}월 {year}
            </Text>
            {(year !== today.getFullYear() || month !== today.getMonth()) && (
              <Text style={[styles.todayBtn, { color: colors.accent, borderColor: colors.accent }]}>
                Today · 오늘
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── 요일 헤더 ── */}
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

        {/* ── 캘린더 그리드 ── */}
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

                <View style={styles.moodRow}>
                  {myEntry?.mood ? <Text style={[styles.moodIcon, { color: colors.text }]}>{myEntry.mood}</Text> : null}
                  {otherEntry?.mood ? <Text style={[styles.moodIcon, { color: colors.text, opacity: 0.6 }]}>{otherEntry.mood}</Text> : null}
                </View>

                {(myEntry?.schedule || otherEntry?.schedule)
                  ? <Text style={[styles.schedulePreview, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                      {(myEntry?.schedule || otherEntry?.schedule)!.trim()}
                    </Text>
                  : null}

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
          <Text style={[styles.legendText, { color: colors.textLight }]}>Tap a date to write · 날짜를 탭해서 써보세요 ✏️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }} imageStyle={{ opacity: bgOpacity }}>
        {screenContent}
      </ImageBackground>
    )
  }
  return screenContent
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // 헤더
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  headerBtnRow: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end', paddingRight: 20, marginBottom: 6 },
  appTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtnTxt: { fontSize: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },

  // 설정 패널
  panelWrap: { marginHorizontal: 16, marginBottom: 8 },
  panelTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 10 },
  cardLabel: { fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardInput: { fontSize: 16, fontWeight: '600', borderBottomWidth: 1.5, paddingVertical: 4 },

  codeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 10, marginBottom: 8, gap: 8 },
  codeLabel: { fontSize: 12 },
  codeText: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  copyBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  copyBtnTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  codeHint: { fontSize: 11, textAlign: 'center', marginBottom: 8 },
  connectCol: { gap: 8 },
  connectInput: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, fontWeight: '700', letterSpacing: 3, textAlign: 'center' },
  connectBtn: { borderRadius: 12, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  connectBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  connectMsg: { fontSize: 12, textAlign: 'center', marginTop: 6 },

  disconnectBox: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, alignItems: 'center' },
  disconnectBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  disconnectBtnTxt: { fontSize: 13, fontWeight: '700', color: '#e05c5c' },
  disconnectConfirmRow: { alignItems: 'center', gap: 10 },
  disconnectConfirmTxt: { fontSize: 13, fontWeight: '600' },
  disconnectBtnRow: { flexDirection: 'row', gap: 10 },
  disconnectCancelBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  disconnectCancelTxt: { fontSize: 13, fontWeight: '600' },
  disconnectConfirmBtn: { backgroundColor: '#e05c5c', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  disconnectConfirmBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },

  pinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinStatus: { fontSize: 14, fontWeight: '600' },
  pinBtn: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 7 },
  pinBtnTxt: { fontSize: 13, fontWeight: '700' },

  panelClose: { alignItems: 'center', marginTop: 4, marginBottom: 4 },
  panelCloseTxt: { fontSize: 12 },

  paletteRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  paletteCircle: { width: 32, height: 32, borderRadius: 16 },

  // Tunas 코너
  tunasCard: { marginHorizontal: 16, marginBottom: 6, borderRadius: 16, borderWidth: 1.5, padding: 12, gap: 5 },
  tunasTxt: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  tunasDismiss: { position: 'absolute', top: 8, right: 10, zIndex: 1 },
  tunasDismissTxt: { fontSize: 13, fontWeight: '700' },
  tunasDivider: { height: 1, marginVertical: 4 },

  // 플로팅 편집 카드 (SafeAreaView 레벨, overlay 위)
  floatingCard: {
    position: 'absolute', left: 16, right: 16, top: 148,
    borderRadius: 14, padding: 12, borderWidth: 1.5, gap: 8,
  },

  // D-day
  ddayRow: { alignSelf: 'center', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', gap: 8 },
  ddayLabel: { fontSize: 12, fontWeight: '600' },
  ddayCount: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  ddayEmpty: { fontSize: 13 },
  ddayCard: { marginHorizontal: 16, marginBottom: 4, borderRadius: 14, padding: 12, borderWidth: 1.5, gap: 8 },
  ddayLabelInput: { fontSize: 13, fontWeight: '600', borderBottomWidth: 1.5, paddingVertical: 3 },
  ddayDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ddayDateInput: { fontSize: 15, fontWeight: '700', borderBottomWidth: 1.5, paddingVertical: 3, letterSpacing: 1 },
  ddayRemoveBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  ddayRemoveTxt: { fontSize: 12, fontWeight: '700', color: '#e05c5c' },
  ddaySaveBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  ddaySaveTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // 캘린더
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 24 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, lineHeight: 30 },
  monthLabel: { fontSize: 18, fontWeight: '600', minWidth: 160, textAlign: 'center' },
  todayBtn: { fontSize: 11, fontWeight: '800', textAlign: 'center', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: 'center' },

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
})
