# 🏔️ 등산 트래커 PWA

GPS 기반 등산 기록 앱 — React + Leaflet + Firebase + Vercel

---

## 🚀 배포 전 필수 설정

### 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. **새 프로젝트 만들기** → 프로젝트명 입력 (예: `hiking-tracker`)
3. Google Analytics 활성화 (권장)
4. **Authentication** → 시작하기 → **Google** 로그인 제공업체 활성화
5. **Firestore Database** → 만들기 → 프로덕션 모드
6. **Storage** → 시작하기

### 2. Firebase 설정값 복사

Firebase 콘솔 → 프로젝트 설정(⚙️) → 내 앱 → 웹 앱 추가(</>) → SDK 구성 복사

### 3. Vercel 배포

1. GitHub에 프로젝트 푸시
2. https://vercel.com → **Import Project** → GitHub 레포 선택
3. **Environment Variables** 탭에서 아래 값 입력:

| 변수명 | 값 |
|--------|-----|
| VITE_FIREBASE_API_KEY | Firebase 설정에서 복사 |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase 설정에서 복사 |
| VITE_FIREBASE_PROJECT_ID | Firebase 설정에서 복사 |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase 설정에서 복사 |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase 설정에서 복사 |
| VITE_FIREBASE_APP_ID | Firebase 설정에서 복사 |
| VITE_FIREBASE_MEASUREMENT_ID | Firebase 설정에서 복사 |

4. **Deploy** 클릭

### 4. Firebase Security Rules 적용

Firebase 콘솔 → Firestore → 규칙 탭 → `firestore.rules` 내용 붙여넣기 → 게시

### 5. Firebase Auth 도메인 허용

Firebase 콘솔 → Authentication → Settings → 승인된 도메인 → Vercel 도메인 추가
(예: `your-app.vercel.app`)

---

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── map/         # 지도 + 메인 화면
│   ├── tracking/    # 트래킹 + 저장 화면
│   ├── history/     # 히스토리 목록 + 상세
│   └── ui/          # 로그인 등 공통 UI
├── hooks/
│   ├── useAuth.ts         # Firebase 인증
│   └── useGpsTracking.ts  # GPS + Wake Lock
├── services/
│   ├── firebase.ts        # Firebase 초기화
│   ├── hikeService.ts     # Firestore CRUD
│   ├── idb.ts             # IndexedDB (오프라인)
│   └── routeGenerator.ts  # OSM 루트 자동 생성
├── store/
│   └── appStore.ts        # Zustand 전역 상태
├── utils/
│   └── gps.ts             # GPS 계산 유틸
└── types/
    └── index.ts           # TypeScript 타입
```

---

## 🔑 사용 API

| API | 용도 | 비용 |
|-----|------|------|
| OSM Overpass API | 등산 지점명 조회 | 무료 |
| Nominatim | 역지오코딩 fallback | 무료 |
| OpenStreetMap Tiles | 지도 타일 | 무료 |
| Firebase Auth | Google 로그인 | 무료 (Spark) |
| Firebase Firestore | 기록 저장 | 무료 (Spark) |

---

## ⚡ 배터리 최적화 정책

- GPS 수집: 10초 간격 OR 15m 이상 이동 시
- 정확도 30m 초과 포인트 무시
- 저전력 모드: 30초 간격 전환
- Wake Lock API로 화면 유지
- GPS 배열 미저장 → 결과값만 Firestore 저장
