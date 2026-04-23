import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useLock } from '../context/LockContext'
import { useTheme } from '../context/ThemeContext'

const NUMS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

interface Props {
  mode: 'unlock' | 'setup' | 'confirm'
  onSkip?: () => void
  onConfirm?: (pin: string) => void
  title?: string
}

export default function PinScreen({ mode, onSkip, onConfirm, title }: Props) {
  const { unlock } = useLock()
  const { colors } = useTheme()
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')

  function press(key: string) {
    if (key === '⌫') {
      setInput(p => p.slice(0, -1))
      setError('')
      return
    }
    if (key === '') return
    if (input.length >= 4) return
    const next = input + key
    setInput(next)
    setError('')

    if (next.length === 4) {
      setTimeout(() => handleComplete(next), 100)
    }
  }

  function handleComplete(pin: string) {
    if (mode === 'unlock') {
      const ok = unlock(pin)
      if (!ok) {
        setShake(true)
        setError('Wrong PIN · PIN이 틀렸어요')
        setInput('')
        setTimeout(() => setShake(false), 500)
      }
    } else {
      // setup or confirm
      onConfirm?.(pin)
      setInput('')
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        {/* 상단 타이틀 */}
        <Text style={[styles.appName, { color: colors.accent }]}>🐶🐱 TwinTuna</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {title ?? (mode === 'unlock' ? 'Enter PIN · PIN 입력' : 'Set PIN · PIN 설정')}
        </Text>

        {/* 도트 */}
        <View style={[styles.dotsRow, shake && styles.dotsShake]}>
          {[0,1,2,3].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: colors.accent },
                input.length > i && { backgroundColor: colors.accent },
              ]}
            />
          ))}
        </View>

        {/* 에러 */}
        {error ? (
          <Text style={styles.errorTxt}>{error}</Text>
        ) : (
          <Text style={{ height: 20 }} />
        )}

        {/* 넘패드 */}
        <View style={styles.numpad}>
          {NUMS.map((n, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.numBtn,
                n === '' && { opacity: 0 },
                n === '⌫' && { backgroundColor: 'transparent' },
                n !== '' && n !== '⌫' && { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => press(n)}
              activeOpacity={n === '' ? 1 : 0.6}
              disabled={n === ''}
            >
              <Text style={[
                styles.numTxt,
                { color: colors.text },
                n === '⌫' && { color: colors.textMuted, fontSize: 22 },
              ]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 건너뛰기 (설정 모드일 때만) */}
        {mode === 'setup' && onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={[styles.skipTxt, { color: colors.textMuted }]}>Skip · 건너뛰기</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },

  appName: { fontSize: 18, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 32 },

  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  dotsShake: { transform: [{ translateX: 0 }] }, // 실제 shake는 JS animation 없이 색으로 표현
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2,
  },

  errorTxt: { color: '#e05c5c', fontSize: 13, fontWeight: '600', marginBottom: 4 },

  numpad: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 240, marginTop: 24, gap: 12,
  },
  numBtn: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  numTxt: { fontSize: 26, fontWeight: '500' },

  skipBtn: { marginTop: 32 },
  skipTxt: { fontSize: 14 },
})
