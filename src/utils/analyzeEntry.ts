/**
 * 기분/날씨/텍스트 기반 공감 + 분석 (템플릿)
 * 🐶 공감 / 🐱 분석 형식으로 반환
 */

type EntryResponse = { empathy: string[]; analysis: string[] }

const MOOD_RESPONSES: Record<string, EntryResponse> = {
  '😄': {
    empathy: [
      '오늘 정말 신났겠어요, 그 에너지 너무 좋아요!',
      '이런 날은 기억해뒀다가 힘들 때 꺼내봐요 🎉',
      '신나는 하루, 옆에서 같이 기뻐요!',
    ],
    analysis: [
      '활기찬 감정은 뇌에서 도파민이 활발할 때 나타나요. 오늘 좋은 자극이 있었군요.',
      '즐거운 날일수록 뭐가 그랬는지 기억해두면 나중에 도움이 돼요.',
      '긍정 에너지가 가득한 하루였네요. 주변에도 전파됐을 것 같아요.',
    ],
  },
  '🥰': {
    empathy: [
      '설레는 마음이 느껴져요, 너무 소중한 감정이에요 💕',
      '사랑받고 있거나 사랑하고 있는 하루군요, 행복해 보여요!',
      '두근두근하는 하루였겠어요, 그 감정 오래 간직해요 🌸',
    ],
    analysis: [
      '설렘은 애착 호르몬인 옥시토신과 연관돼요. 좋은 관계의 신호예요.',
      '사랑스러운 감정은 전반적인 행복감과 집중력도 올려줘요.',
      '이런 감정을 느끼는 날은 심리적으로 매우 안정된 상태예요.',
    ],
  },
  '😊': {
    empathy: [
      '잔잔하게 좋은 하루, 그것만으로도 충분해요 😊',
      '평온한 행복이 느껴져요, 내일도 이런 하루이길!',
      '작은 행복이 쌓이는 하루였겠어요, 정말 다행이에요.',
    ],
    analysis: [
      '잔잔한 만족감은 장기적 행복에 더 깊이 기여해요. 오늘 잘 보낸 거예요.',
      '평온한 상태는 판단력과 창의력이 가장 높은 때예요.',
      '소소한 좋음을 알아채는 능력, 그게 행복의 핵심이에요.',
    ],
  },
  '😐': {
    empathy: [
      '그냥 그런 날도 있어요, 충분히 괜찮아요 🌫️',
      '무난한 하루도 나쁘지 않아요, 쉬어가는 날인 거예요.',
      '별일 없이 지나가는 날, 그것도 삶의 일부예요.',
    ],
    analysis: [
      '무기력하거나 밋밋한 감정은 뇌가 과부하를 줄이려는 신호일 수 있어요.',
      '무난한 날이 이어지면 작은 변화나 자극이 도움이 될 수 있어요.',
      '특별하지 않은 날은 오히려 에너지를 충전하는 시간이에요.',
    ],
  },
  '😴': {
    empathy: [
      '많이 지쳤겠어요, 오늘은 그냥 푹 쉬어요 🌙',
      '고생 많았어요, 이제 내려놓고 쉬어도 돼요.',
      '피곤한 몸이 느껴져요, 오늘 정말 열심히 살았군요 💤',
    ],
    analysis: [
      '피로감은 몸이 수면과 회복을 요청하는 신호예요. 무시하지 마세요.',
      '만성 피로가 지속되면 감정 기복도 커질 수 있어요. 충분한 수면이 중요해요.',
      '오늘의 피로는 내일의 에너지를 위한 투자예요. 잘 쉬면 돼요.',
    ],
  },
  '😢': {
    empathy: [
      '많이 힘들었겠어요, 혼자가 아니에요 🤍',
      '슬픈 감정 충분히 느껴도 괜찮아요, 그럴 자격 있어요.',
      '힘든 하루를 버텨낸 것만으로도 대단해요.',
    ],
    analysis: [
      '슬픔은 상실이나 기대와 현실의 차이에서 나와요. 자연스러운 감정이에요.',
      '슬픔을 억누르는 것보다 표현하는 게 회복에 더 도움이 돼요.',
      '힘든 감정도 보통 72시간 안에 변화가 시작돼요. 지나가요.',
    ],
  },
  '😠': {
    empathy: [
      '화가 날 만 했겠어요, 그 감정 충분히 이해해요 🔥',
      '억울하거나 답답했겠어요, 당연히 화날 수 있어요.',
      '그 화, 충분히 표현해도 괜찮아요. 참는 게 답이 아닐 수 있어요.',
    ],
    analysis: [
      '분노는 경계가 침범됐을 때 나오는 자기보호 감정이에요.',
      '화가 난 직후엔 중요한 결정을 미루는 게 좋아요. 생각이 왜곡될 수 있어요.',
      '분노의 원인을 파악하면 같은 상황에서 더 현명하게 대처할 수 있어요.',
    ],
  },
  '😰': {
    empathy: [
      '많이 불안했겠어요, 그 마음 알아요 🕊️',
      '걱정이 많은 하루, 천천히 숨 한번 쉬어봐요.',
      '긴장된 하루를 버텨냈어요, 정말 잘했어요 💪',
    ],
    analysis: [
      '불안은 미래의 불확실성에 대한 뇌의 경고 신호예요. 너무 나쁜 게 아니에요.',
      '걱정되는 일을 적어두면 뇌가 반복 처리하는 걸 줄여줘요.',
      '불안할 때 호흡을 천천히 하면 자율신경계가 진정되는 효과가 있어요.',
    ],
  },
}

const DEFAULT_RESPONSE: EntryResponse = {
  empathy: [
    '오늘 하루도 수고했어요, 일기 써줘서 고마워요 🌿',
    '하루를 기록한 것만으로도 정말 잘한 거예요 ✍️',
    '오늘도 무사히 하루를 마쳤군요, 잘했어요.',
  ],
  analysis: [
    '일기를 꾸준히 쓰는 것만으로도 자기 이해도가 높아져요.',
    '하루를 돌아보는 습관은 감정 조절 능력을 키워줘요.',
    '기록은 나중에 내 패턴을 발견하는 데 큰 도움이 돼요.',
  ],
}

const WEATHER_PREFIX: Record<string, string> = {
  '☀️': '맑은 날씨였는데도',
  '⛅': '흐린 하늘 아래',
  '🌧️': '비 오는 날',
  '❄️': '눈 내리는 날',
  '🌩️': '천둥치는 날',
  '🌈': '무지개 뜬 날인데도',
}

const SAD_KEYWORDS = ['힘들', '슬프', '울었', '울고', '외롭', '그리워', '아프', '지쳤', '포기', '못하겠', '싫어', '괴롭', '걱정', '무서']
const HAPPY_KEYWORDS = ['행복', '좋았', '즐거', '웃었', '신났', '설렜', '감사', '사랑', '재밌', '최고', '기뻐', '뿌듯']

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

export function analyzeEntry(mood?: string, weather?: string, text?: string): string {
  const seed = (text?.length ?? 0) + (mood?.charCodeAt(0) ?? 7)

  const lowerText = text ?? ''
  const hasSadKeyword = SAD_KEYWORDS.some(k => lowerText.includes(k))
  const hasHappyKeyword = HAPPY_KEYWORDS.some(k => lowerText.includes(k))

  let effectiveMood = mood
  if (!effectiveMood) {
    if (hasSadKeyword) effectiveMood = '😢'
    else if (hasHappyKeyword) effectiveMood = '😊'
  }

  const responses = (effectiveMood && MOOD_RESPONSES[effectiveMood]) ?? DEFAULT_RESPONSE
  const empathy = pick(responses.empathy, seed)
  const analysis = pick(responses.analysis, seed + 1)

  const weatherPre = weather ? WEATHER_PREFIX[weather] : null
  const empathyFull = weatherPre ? `${weatherPre}, ${empathy}` : empathy

  return `🐶  ${empathyFull}\n🐱  ${analysis}`
}
