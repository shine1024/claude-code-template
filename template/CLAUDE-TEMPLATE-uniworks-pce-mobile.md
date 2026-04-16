# CLAUDE-TEMPLATE-uniworks-pce-mobile.md 사용 안내

> 이 파일은 unidocu6-mobile (UniWorks PCE Mobile 프론트엔드) 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] 백엔드(unidocu6-mobile-server)는 `CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md`를 별도 참고했는가?

---

# unidocu6-mobile — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: unidocu6-mobile (UniWorks PCE Mobile 프론트)
- **목적**: UniWorks PCE 모바일 앱 프론트엔드 — iOS·Android·Web 크로스플랫폼
- **기술 스택**:
  - React Native 0.69.8 (iOS·Android), React 18 + Webpack 5 (Web)
  - TypeScript 4.9.5
  - 상태관리: Redux Toolkit 1.9.3 + redux-persist 6.0.0
  - HTTP 통신: axios 1.3.6 (`useAxiosApi` 훅으로 래핑)
  - 라우팅: react-router 6.10.0
- **빌드 / 실행**:
  - 웹 개발: `npm run start-react` (Webpack dev server + API 프록시)
  - 웹 빌드: `npm run build-react` → `build/` 산출물 → 서버 WAR에 포함 배포
- **환경 변수**: `.env.local` (로컬), `.env.dev` (개발), `.env.prd` (운영) — `BASE_PATH` 기준

---

## 2. 프로젝트 구조

```
unidocu6-mobile/
├── src/
│   ├── components/          # 기능별 UI 컴포넌트
│   │   ├── common/          # 공통 (Header, BottomTab, Modal, ProgressBar 등)
│   │   ├── approval/        # 결재
│   │   ├── expense/         # 경비
│   │   ├── home/            # 홈
│   │   └── [기능별 폴더]
│   ├── screens/             # 화면 단위 구성 (components와 대응)
│   ├── hooks/               # 커스텀 훅
│   │   ├── useAxiosApi.ts   # HTTP 통신 핵심 훅 (JWT Bearer Token 자동 삽입)
│   │   ├── useLoginUser.ts  # 로그인 사용자 정보
│   │   ├── useSessionUtil.ts
│   │   └── [기능별 훅]
│   ├── slices/              # Redux Toolkit slice (상태 단위)
│   │   ├── user.ts          # 사용자 정보, 토큰 (영속화)
│   │   ├── approval.ts      # 결재 데이터 (영속화)
│   │   ├── properties.ts    # 서버 속성 (비영속화)
│   │   ├── searchParams.ts  # 검색 파라미터 (비영속화)
│   │   └── [기타 slice]
│   ├── store/               # Redux store 설정 (Redux Persist)
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 공통 유틸 (날짜, AsyncStorage, 이벤트 등)
│   ├── constants/           # 상수 (코드값, 화면명 등)
│   ├── setup/
│   │   └── routeInfo.tsx    # 라우트 정의
│   ├── provider/            # Context Provider (RouteInfoProvider)
│   └── mustache/            # Mustache 템플릿
├── public/
│   └── index.html
├── webpack.config.js        # 웹 빌드 설정 + 개발 API 프록시
├── .env.local / .env.dev / .env.prd
└── package.json
```

---

## 3. 아키텍처 패턴

### HTTP 통신 패턴

```
컴포넌트 / 훅 → useAxiosApi 훅 호출
  → axios (Authorization: Bearer {token} 자동 삽입)
  → /mobile/** 또는 /unidocu/** → unidocu6-mobile-server
```

- **모든 API 호출은 `useAxiosApi` 훅을 통해 한다** — axios 직접 사용 금지
- API 엔드포인트 목록은 `webpack.config.js` 프록시 설정을 기준으로 확인한다

### 상태관리 패턴

```
Redux Persist 영속화: user, setting, approval, multiLanguage
Redux Persist 비영속화 (blacklist): properties, searchParams

상태 변경: dispatch(sliceAction()) 사용
비동기 처리: createAsyncThunk 또는 훅 내 직접 처리
```

### 환경별 분기

```
.env.local → BASE_PATH=/                   (로컬 webpack dev server)
.env.dev   → BASE_PATH=/unidocu6-mobile    (개발 서버)
.env.prd   → BASE_PATH=/unidocu6-mobile    (운영 서버)
```

---

## 4. rules/ 파일 구성

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `js-style.md` | TypeScript / React 코딩 컨벤션 | 필수 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## 5. Claude 작업 지침

- **API 호출은 반드시 `useAxiosApi` 훅을 사용한다** — axios를 직접 import하지 않는다
- **상태 변경은 Redux slice를 통한다** — 컴포넌트 로컬 상태는 화면 UI에만 사용한다
- **신규 API 연동 시** `webpack.config.js` 프록시에 해당 엔드포인트가 등록되어 있는지 확인한다
- **웹·앱 공통 코드** 원칙을 유지한다 — 플랫폼 분기가 필요한 경우 `Platform.OS`를 사용한다
- **환경 변수**는 `.env.*` 파일로 관리한다 — 코드 내 URL·키 하드코딩 금지
- **TypeScript 타입**은 `src/types/` 하위 파일에 정의한다 — 임의로 `any` 타입을 사용하지 않는다
- 프로젝트에 존재하지 않는 훅·컴포넌트를 임의로 생성하지 않는다
  → 불확실한 경우 기존 코드에서 실제 사용 중인 패턴을 먼저 탐색한다
