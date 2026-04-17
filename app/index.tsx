import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useDiary } from '../src/context/DiaryContext'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

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

  // Build calendar grid cells (null = empty padding)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>TwinTuna_Diary</Text>
          <Text style={styles.subtitle}>나만의 감성 일기</Text>
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {year}년 {month + 1}월
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
                {entry?.mood && (
                  <Text style={styles.icon}>{entry.mood}</Text>
                )}
                {entry?.weather && (
                  <Text style={styles.icon}>{entry.weather}</Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendText}>날짜를 탭해서 일기를 써보세요 ✏️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const CELL_SIZE = 48

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdf6f0' },
  scroll: { paddingBottom: 40 },

  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  appTitle: { fontSize: 22, fontWeight: '700', color: '#3d2c1e', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#a08070', marginTop: 2 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 24,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: '#c9a882', lineHeight: 30 },
  monthLabel: { fontSize: 18, fontWeight: '600', color: '#3d2c1e', minWidth: 120, textAlign: 'center' },

  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#a08070',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayCell: {
    backgroundColor: '#ffe8d2',
  },
  dayNum: {
    fontSize: 13,
    color: '#5a3e2b',
    fontWeight: '500',
  },
  todayNum: {
    fontWeight: '700',
    color: '#c96a30',
  },
  sun: { color: '#e05c5c' },
  sat: { color: '#5b8ee0' },
  icon: { fontSize: 14, lineHeight: 18 },

  legend: { alignItems: 'center', marginTop: 20 },
  legendText: { fontSize: 12, color: '#b09080' },
})
