# 🐶🐱 TwinTuna Diary — 기능 정리

> 커플 공유 일기 앱 (Expo React Native Web + Firebase + Vercel)

---

## 🏗️ 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Expo (React Native Web) |
| 배포 | Vercel (정적 웹) |
| DB | Firebase Firestore (실시간 동기화) |
| 스토리지 | Firebase Storage (미사용), AsyncStorage (로컬) |
| 폰트 | Nunito (Google Fonts) |
| 라우팅 | Expo Router |

---

## 📱 주요 기능

### 🔗 커플 연결
- 6자리 코드로 파트너와 연결
- 연결 끊기 기능
- 연결 상태 뱃지 표시
- deviceId 기반으로 내 일기 / 파트너 일기 구분

### 📅 캘린더
- 월별 캘린더 뷰
- 날짜 셀에 기분 이모티콘 + 일정 미리보기
- 파트너 일기 있는 날 `＋` 뱃지 표시
- 오늘 날짜 강조 표시
- **Today 버튼** — 다른 달 보다가 오늘로 바로 돌아오기

### ✏️ 일기 작성
- 기분 이모티콘 선택 (8가지 + 커스텀)
- 날씨 이모티콘 선택 (6가지 + 커스텀)
- 오늘 하루 텍스트 (글자수 카운터, 최대 500자)
- 일정 입력
- 편집 / 삭제 / 저장
- **뒤로가기 경고** — 저장 안 된 내용 있을 때 확인 팝업
- 파트너 일기 접기/펼치기 토글

### 🐶🐱 Tunas 기능
- **Tunas 버튼** — 일기 저장 후 보기 모드에서 표시
  - 🐶 강아지 말투 공감 (멍멍)
  - 🐱 고양이 말투 분석 (냥냥)
  - 기분/날씨/텍스트 키워드 기반 템플릿
- **Tunas 코너** — 앱 열 때마다 홈 화면에 표시
  - 요일별 인사 (7가지)
  - 연속 작성 스트릭 반응 (1일 / 2일 / 3~6일 / 7~13일 / 14일+)
  - ✕ 버튼으로 닫기

### 📅 D-day
- D-day 날짜 + 라벨 설정
- 숫자 8자리 입력 시 자동 YYYY-MM-DD 포맷
- 헤더와 캘린더 사이 독립 행 표시
- 탭하면 인라인 편집 카드 (바깥 탭으로 닫기)

### 🔒 PIN 잠금
- 4자리 PIN 설정/해제
- Firestore 저장 → 파트너와 공유 (같은 PIN)
- 앱 열 때 PIN 화면 표시

### 🎨 테마 & 디자인
- **다크/라이트 모드** 토글
- **Accent 색상** — 7가지 팔레트에서 선택 (개인 저장)
  - 전체 색상이 accent에서 파생 (배경, 텍스트, 뱃지, 캘린더 등)
- **배경 사진** — 갤러리에서 선택, base64로 로컬 저장
  - **투명도 슬라이더** — 10%~100% 실시간 조절
- **Nunito 폰트** — 둥글둥글한 귀여운 폰트
- **🐶🐱 파비콘** + 탭 제목 "🐶🐱 TwinTuna"

### ⚙️ 설정 패널
- 📔 다이어리 이름 (Firestore 공유)
- 🔗 파트너 연결 / 연결 끊기
- 🎨 Accent 색상 팔레트
- 🖼️ 배경 사진 + 투명도 슬라이더
- 🔒 PIN 잠금 설정/해제
- ⚙️ 버튼 다시 누르면 닫힘

### 👤 닉네임
- 헤더 뱃지에서 인라인 편집
- AsyncStorage 로컬 저장

---

## 🗂️ 파일 구조

```
app/
  _layout.tsx        — 루트 레이아웃, 폰트/파비콘 주입, Provider 구조
  index.tsx          — 캘린더 홈 화면
  entry.tsx          — 일기 작성/보기 화면

src/
  context/
    DiaryContext.tsx  — Firestore 연동, 일기 CRUD, 연결/D-day/PIN
    ThemeContext.tsx  — 테마, 다크모드, accent색, 배경사진, 투명도
    LockContext.tsx   — PIN 잠금 상태 관리

  components/
    PinScreen.tsx     — PIN 입력 화면 (잠금/설정/확인)
    OpacitySlider.tsx — 배경 투명도 슬라이더

  utils/
    analyzeEntry.ts   — 🐶🐱 Tunas 일기 분석 템플릿
    tunasMessages.ts  — 요일별 인사 + 스트릭 반응
    uploadPhoto.ts    — Firebase Storage 업로드 유틸
```

---

## 🔥 Firestore 구조

```
diaries/{diaryId}/
  appName: string
  pin: string | null
  dday: { label: string, date: string } | null

  entries/{date}_{deviceId}/
    id: string
    date: string
    mood?: string
    weather?: string
    text?: string
    schedule?: string
    author?: string
    deviceId: string
```

---

## 💾 AsyncStorage 키

| 키 | 내용 |
|----|------|
| `@twintuna_diary:diaryId` | 다이어리 코드 |
| `@twintuna_diary:nickname` | 닉네임 |
| `@twintuna_diary:isConnected` | 연결 상태 |
| `@twintuna_diary:deviceId` | 기기 고유 ID |
| `@twintuna_diary:theme` | 다크/라이트 |
| `@twintuna_diary:accent` | accent 색상 |
| `@twintuna_diary:bgImage` | 배경 이미지 (base64) |
| `@twintuna_diary:bgOpacity` | 배경 투명도 |

---

## 🚀 개발/배포

```bash
# 개발 서버
npm run web

# 빌드
npx expo export -p web

# 배포 (GitHub push → Vercel 자동 배포)
git push origin main
```

GitHub: `kangyujina-commits/twintuna-diary`
