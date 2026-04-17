import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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
  const { getEntry } = useDiary()

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
        </View>

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
                  : entry?.text?.trim()
                    ? <Text style={styles.icon}>✏️</Text>
                    : null}
                {entry?.weather
                  ? <Text style={styles.icon}>{entry.weather}</Text>
                  : entry?.photo_uris?.length
                    ? <Text style={styles.icon}>📷</Text>
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

  legend: { alignItems: 'center', marginTop: 20 },
  legendText: { fontSize: 12, color: '#b09080' },
})
