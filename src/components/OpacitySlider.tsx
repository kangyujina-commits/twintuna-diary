import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  value: number        // 0.0 ~ 1.0
  onValueChange: (v: number) => void
  color: string
  min?: number
  max?: number
  step?: number
}

export default function OpacitySlider({ value, onValueChange, color, min = 0.1, max = 1.0, step = 0.05 }: Props) {
  const [trackWidth, setTrackWidth] = useState(0)
  const percent = (value - min) / (max - min)

  function handleTouch(locationX: number) {
    if (trackWidth === 0) return
    const raw = min + (locationX / trackWidth) * (max - min)
    const stepped = Math.round(raw / step) * step
    onValueChange(Math.max(min, Math.min(max, parseFloat(stepped.toFixed(2)))))
  }

  return (
    <View style={styles.wrap}>
      <View
        style={styles.trackWrap}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={e => handleTouch(e.nativeEvent.locationX)}
      >
        {/* 배경 트랙 */}
        <View style={[styles.track, { backgroundColor: color + '33' }]} />
        {/* 채워진 트랙 */}
        <View style={[styles.trackFill, { backgroundColor: color, width: `${percent * 100}%` as any }]} />
        {/* 썸 */}
        {trackWidth > 0 && (
          <View style={[styles.thumb, { backgroundColor: color, left: trackWidth * percent - 11 }]} />
        )}
      </View>
      <Text style={[styles.label, { color }]}>{Math.round(value * 100)}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  trackWrap: { flex: 1, height: 36, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, position: 'absolute', left: 0, right: 0 },
  trackFill: { height: 5, borderRadius: 3, position: 'absolute', left: 0 },
  thumb: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    top: 7,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  label: { fontSize: 12, fontWeight: '800', width: 36, textAlign: 'right' },
})
