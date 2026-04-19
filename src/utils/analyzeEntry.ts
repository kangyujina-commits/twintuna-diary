/**
 * 기분/날씨/텍스트 기반 공감 분석 (템플릿)
 * mood, weather, text를 받아 한국어+영어 1줄씩 반환
 */

type MoodResponse = { ko: string[]; en: string[] }

const MOOD_RESPONSES: Record<string, MoodResponse> = {
  '😄': {
    ko: ['오늘 정말 신났겠어요! 그 에너지 계속 이어가요 🎉', '신나는 하루였군요, 이런 날이 더 많아졌으면 좋겠어요 ✨', '기분 최고인 날이네요! 좋은 에너지 가득해요 🌟'],
    en: ["What an exciting day! Keep that energy going 🎉", "You seem on top of the world today ✨", "Such great vibes today — love it 🌟"],
  },
  '🥰': {
    ko: ['설레는 감정이 느껴져요, 정말 소중한 하루였겠어요 💕', '사랑스러운 하루를 보냈군요, 행복해 보여요 🌸', '두근두근한 하루네요! 그 감정 오래 간직해요 💗'],
    en: ["Such a warm, lovely feeling today 💕", "Sounds like your heart was full today 🌸", "That fluttery feeling is so special — cherish it 💗"],
  },
  '😊': {
    ko: ['잔잔하게 좋은 하루였군요, 그것만으로도 충분해요 😊', '평온하고 좋은 하루를 보냈네요, 내일도 이런 날이길 🍀', '작은 행복들이 모인 하루였겠어요 🌼'],
    en: ["A quietly good day — that's more than enough 😊", "Peaceful and pleasant. Hope tomorrow brings the same 🍀", "Little moments of happiness add up beautifully 🌼"],
  },
  '😐': {
    ko: ['그냥 그런 날도 있죠, 그것도 괜찮아요 🌫️', '무난한 하루였군요, 내일은 더 특별한 일이 생길 거예요 🌤️', '평범한 하루도 나쁘지 않아요, 쉬어가는 날이에요 ☁️'],
    en: ["Some days are just... meh, and that's totally okay 🌫️", "A low-key day — tomorrow might surprise you 🌤️", "Ordinary days are a rest in disguise ☁️"],
  },
  '😴': {
    ko: ['많이 지쳤겠어요, 오늘은 푹 쉬어요 🌙', '피곤한 하루였군요, 몸이 쉬자고 신호를 보내고 있어요 💤', '고생 많았어요, 이제 내려놓고 쉬어요 🛌'],
    en: ["You must be exhausted — please rest well tonight 🌙", "Your body is asking for a break. Listen to it 💤", "You worked hard. Time to recharge 🛌"],
  },
  '😢': {
    ko: ['많이 힘들었겠어요, 혼자가 아니에요 🤍', '슬픈 하루였군요, 그 마음 충분히 느껴도 괜찮아요 💧', '힘든 감정도 지나가요, 조금만 더 버텨요 🌧️'],
    en: ["It sounds really tough. You're not alone 🤍", "It's okay to feel sad. Your feelings are valid 💧", "Hard days pass. You're stronger than you think 🌧️"],
  },
  '😠': {
    ko: ['화가 날 만 했겠어요, 그 감정 충분히 이해해요 🔥', '억울하거나 답답했겠어요, 그 마음 알아요 💢', '화난 감정도 중요한 신호예요, 천천히 풀어나가요 🌊'],
    en: ["That frustration makes complete sense 🔥", "Sounds like a really aggravating day. I hear you 💢", "Anger is a signal — take it one step at a time 🌊"],
  },
  '😰': {
    ko: ['걱정이 많은 하루였군요, 천천히 숨 한번 쉬어요 🌬️', '불안한 마음이 느껴져요, 지금 이 순간은 괜찮아요 🕊️', '많이 긴장했겠어요, 잘 해내고 있어요 💪'],
    en: ["A worrying day — take a slow, deep breath 🌬️", "Anxiety is heavy. But right now, you're okay 🕊️", "You're doing better than you think, even when it's scary 💪"],
  },
}

const DEFAULT_RESPONSES: MoodResponse = {
  ko: ['오늘 하루도 수고했어요 🌿', '일기를 쓴 것만으로도 대단해요, 오늘도 잘 했어요 ✍️', '하루를 기록했다는 것, 그 자체가 의미 있어요 📖'],
  en: ["You made it through the day — that counts 🌿", "Writing it down takes courage. Well done ✍️", "Every day recorded is a day remembered 📖"],
}

const WEATHER_PREFIX: Record<string, { ko: string; en: string }> = {
  '☀️': { ko: '맑은 하늘 아래', en: 'Under the bright sun,' },
  '⛅': { ko: '구름 사이로', en: 'Between the clouds,' },
  '🌧️': { ko: '비 오는 날', en: 'On a rainy day,' },
  '❄️': { ko: '눈 내리는 날', en: 'In the snow,' },
  '🌩️': { ko: '천둥치는 날', en: 'Through the storm,' },
  '🌈': { ko: '무지개 뜬 날', en: 'Under a rainbow,' },
}

const SAD_KEYWORDS = ['힘들', '슬프', '울었', '울고', '외롭', '그리워', '아프', '지쳤', '포기', '못하겠', '싫어', '괴롭', '걱정', '무서']
const HAPPY_KEYWORDS = ['행복', '좋았', '즐거', '웃었', '신났', '설렜', '감사', '사랑', '재밌', '최고', '기뻐', '뿌듯']

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

export function analyzeEntry(mood?: string, weather?: string, text?: string): string {
  const seed = (text?.length ?? 0) + (mood?.charCodeAt(0) ?? 0)

  // 텍스트 키워드 분석
  const lowerText = text?.toLowerCase() ?? ''
  const hasSadKeyword = SAD_KEYWORDS.some(k => lowerText.includes(k))
  const hasHappyKeyword = HAPPY_KEYWORDS.some(k => lowerText.includes(k))

  // 기분 선택 (텍스트 키워드로 보정)
  let effectiveMood = mood
  if (!effectiveMood) {
    if (hasSadKeyword) effectiveMood = '😢'
    else if (hasHappyKeyword) effectiveMood = '😊'
  }

  const responses = (effectiveMood && MOOD_RESPONSES[effectiveMood]) ?? DEFAULT_RESPONSES
  const koLine = pick(responses.ko, seed)
  const enLine = pick(responses.en, seed + 1)

  // 날씨 접두사
  const weatherPre = weather ? WEATHER_PREFIX[weather] : null
  const koFull = weatherPre ? `${weatherPre.ko}, ${koLine}` : koLine
  const enFull = weatherPre ? `${weatherPre.en} ${enLine}` : enLine

  return `🇰🇷 ${koFull}\n🇺🇸 ${enFull}`
}
