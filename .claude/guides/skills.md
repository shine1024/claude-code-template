# 스킬 (Skills) 가이드

Claude Code에서 스킬은 `/스킬명`으로 직접 호출하는 커스텀 커맨드입니다.  
`.claude/skills/<스킬명>/SKILL.md` 파일로 정의하며, 세션 중 자동으로 감지됩니다.

---

## 스킬 파일 구조

```
.claude/skills/
└── <스킬명>/           ← 폴더명이 커맨드명 (/스킬명)
    ├── SKILL.md        ← 필수: 스킬 실행 지침
    ├── template.md     ← 선택: Claude가 채울 템플릿
    ├── examples/       ← 선택: 예시 파일
    └── scripts/        ← 선택: 실행 스크립트
```

> `SKILL.md` 파일 하나만 있으면 `/스킬명`으로 즉시 호출 가능합니다.

---

## 현재 구성된 스킬

### /init-claude-md — CLAUDE.md 생성

**용도**: 프로젝트를 직접 분석하여 `CLAUDE.md` 초안을 자동 생성

| 항목 | 내용 |
|------|------|
| 호출 방법 | `claude-code-template` 프로젝트에서 `/init-claude-md <출력경로>` 입력 |
| 출력 경로 | 인수로 지정한 디렉터리. 미지정 시 입력 요청 |
| 참조 파일 | `template/CLAUDE-TEMPLATE.md` (공통 규칙) + `template/CLAUDE-TEMPLATE-{project}.md` (CONTEXT) |

**사전 준비 — CONTEXT 파일 작성**

스킬 실행 전 해당 프로젝트의 CONTEXT 파일(`template/CLAUDE-TEMPLATE-{project}.md`)에 아래 내용을 채워두면 생성 품질이 높아집니다.

| 섹션 | 작성 내용 | 미작성 시 |
|------|----------|----------|
| 1. 서비스 개요 | 목적, 주요 기능, 사용자, 시스템 구성 | 기본 서비스명만 반영 |
| 2. 도메인 지식 | 업무 용어, 핵심 개념 | 생략 |
| 3. 코드 히스토리 | 현재 표준 패턴, 변경 이력 | 코드 분석 결과만 반영 |
| 4. 개발 작업 방식 | 배포·빌드·협업 규칙 | 생략 |
| 5. 자주 하는 실수 / 주의사항 | 흔한 오류 패턴, 함정 | 코드 분석 결과만 반영 |
| 6. 고객사 / 운영 특이사항 | 특정 고객사 제약 | 생략 |

**실행 흐름**

| 단계 | 내용 |
|------|------|
| 1 | 프로젝트 목록 표시 → 번호 선택 (출력 경로는 현재 디렉터리 자동 사용) |
| 2 | CONTEXT 파일 읽기 (6개 섹션 전체 추출) |
| 3 | 코드 직접 분석 (기술 스택, 구조, 아키텍처, 도메인, 작업 지침 패턴 도출) |
| 4 | 분석 결과 + CONTEXT 내용을 고정 4섹션 스키마로 종합하여 CLAUDE.md 작성 |
| 5 | 멀티 모듈이면 모듈별 CLAUDE.md 추가 생성 |
| 6 | 기존 파일 덮어쓰기 여부 확인 |
| 7 | 완료 안내 출력 |

**사용 예시**

```
/init-claude-md D:\projects\uniflow
```

**생성 후 할 일**

1. `{확인 필요}` 항목을 실제 값으로 수정
2. CONTEXT 파일 미작성 섹션(도메인 지식, 작업 방식 등)을 팀 실무 지식으로 보완
3. Claude가 틀린 결과를 낼 때마다 해당 규칙 추가·수정

> 생성된 `CLAUDE.md`에는 코드 분석 결과, CONTEXT 파일 내용, 공통 동작 규칙(`CLAUDE-TEMPLATE.md`)이 자동으로 통합됩니다.

---

### /session-log — 세션 회고 기록

**용도**: 세션 대화를 분석해 회고 초안을 작성하고 Google Sheets에 제출

| 항목 | 내용 |
|------|------|
| 호출 방법 | 세션 종료 전 `/session-log` 입력 |
| 설정 위치 | `~/.claude/settings.json` 또는 `.claude/settings.local.json` |
| 제출 대상 | Google Sheets (Sheets API 직접 호출) |

**사전 설정** (환경변수로 관리)

```json
{
  "env": {
    "SESSION_USER_NAME": "[이름]",
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "[서비스 계정 JSON 키 경로]",
    "GOOGLE_SHEETS_FEEDBACK_ID": "[Google Spreadsheet ID]",
    "GOOGLE_SHEETS_SESSION_LOG_GID": "[회고 시트의 gid]"
  }
}
```

> Google Sheets 연동 설정 방법: [`.claude/guides/google-sheets-setup.md`](google-sheets-setup.md)

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | 환경변수와 프로젝트명(`basename $(pwd)`) 확인 |
| 2 | 세션 전체 대화를 분석해 회고 초안 작성 |
| 3 | 초안 확인 후 수정 또는 제출 (`scripts/append-session.js`) |

**Google Sheets 컬럼 구성** (1행 설명, 2행 헤더, 3행~ 데이터)

| 열 | 컬럼 | 내용 |
|----|------|------|
| A | `date` | 날짜 |
| B | `name` | 이름 |
| C | `project` | 프로젝트명 |
| D | `requirements` | 요구사항 요약 |
| E | `conversationFlow` | 대화 흐름 요약 |
| F | `wentWell` | 잘된 점 |
| G | `wentWrong` | 잘못된 점 |
| H | `rootCause` | 원인 분석 |
| I | `improvement` | 개선 내용 |
| J | `other` | 기타 |
| K | `클로드 분석여부` | analyze-feedback 처리 후 날짜 기입 |

---

### /share-rules — 개인 규칙을 팀 시트에 업로드

**용도**: 각자 `CLAUDE.local.md` 의 "공유 가능" 섹션 규칙을 추출해 Google Sheets `3) 개인 규칙 후보` 시트에 업로드. 미리보기 → 확인 후에만 전송.

| 항목 | 내용 |
|------|------|
| 호출 방법 | 프로젝트 루트에서 `/share-rules` 입력 |
| 추출 대상 | `CLAUDE.local.md` 내 `## 공유 가능` 섹션 (다음 `##` 헤딩 직전까지) |
| 제외 대상 | `## 비공유` 섹션 및 헤딩 외 본문 |
| 업로드 대상 | Google Sheets `3) 개인 규칙 후보` (시트는 사전에 만들어 `GOOGLE_SHEETS_PERSONAL_RULES_GID` 등록) |

**CLAUDE.local.md 섹션 컨벤션**

```markdown
## 공유 가능
- 팀에 공유 가능한 일반화된 규칙 (한 줄에 한 규칙)
- 여러 줄 규칙은 빈 줄로 블록 구분

## 비공유
- 개인 환경 경로, 사번, 사내 URL 등 (절대 업로드 안 됨)
```

**사전 설정** (analyze-feedback 과 같은 환경변수 재사용)

```json
{
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "[서비스 계정 JSON 키 파일 경로]",
    "GOOGLE_SHEETS_FEEDBACK_ID": "[Google Spreadsheet ID]",
    "GOOGLE_SHEETS_PERSONAL_RULES_GID": "[개인 규칙 시트의 gid]",
    "SESSION_USER_NAME": "[작성자 이름]"
  }
}
```

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | 환경변수 확인 |
| 2 | `extract-shareable.js` 로 `## 공유 가능` 섹션 추출 (빈 줄 단위 블록) |
| 3 | 추출 결과 미리보기 + 사용자 확인 |
| 4 | 확인 시 `upload-rules.js` stdin 으로 JSON 전달, 개인 규칙 후보 시트에 append |

**Google Sheets 컬럼 구성** — 개인 규칙 후보 시트 (1행 설명, 2행 헤더, 3행~ 데이터)

| 열 | 컬럼 | 내용 |
|----|------|------|
| A | `date` | 업로드 날짜 |
| B | `name` | 작성자 (`SESSION_USER_NAME`) |
| C | `project` | 프로젝트명 |
| D | `rule` | 규칙 본문 (한 블록) |
| E | `클로드 분석여부` | analyze-feedback 처리 후 날짜 기입 |

---

### /analyze-feedback — 피드백 분석 및 규칙 개선안 도출

**용도**: Google Sheets 의 회고 데이터(`2) 작업세션 수집`)와 개인 규칙 후보(`3) 개인 규칙 후보`)를 함께 분석해 CLAUDE.md 규칙 개선안을 보고서로 생성

| 항목 | 내용 |
|------|------|
| 호출 방법 | `claude-code-template` 프로젝트에서 `/analyze-feedback` 입력 |
| 출력 경로 | `reports/feedback-analysis-{YYYY-MM-DD}.md` |
| 분석 대상 | `2) 작업세션 수집` + `3) 개인 규칙 후보` 시트의 미분석 신규 행 |

**사전 설정** (환경변수로 관리)

```json
{
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "[서비스 계정 JSON 키 파일 경로]",
    "GOOGLE_SHEETS_FEEDBACK_ID": "[Google Spreadsheet ID]",
    "GOOGLE_SHEETS_SESSION_LOG_GID": "[회고 시트의 gid]",
    "GOOGLE_SHEETS_PERSONAL_RULES_GID": "[개인 규칙 시트의 gid]"
  }
}
```

> Google Sheets 연동 설정 방법: [`.claude/guides/google-sheets-setup.md`](google-sheets-setup.md)

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | 환경변수 확인 |
| 2 | 두 시트 데이터 조회 — "클로드 분석여부" 컬럼이 비어있는 행만 자동 필터링 (`fetch-sheet.js`, `fetch-personal-rules.js`) |
| 3 | 신규 행에 해당하는 프로젝트 템플릿 파일 읽기 |
| 4 | 규칙 누락·미적용·신규 패턴·성공 패턴 분석 + 개인 규칙 후보 승격 검토(작성자 수, 회고 매칭) |
| 5 | `reports/feedback-analysis-{날짜}.md` 보고서 생성 |
| 6 | 사용자 확인 후 두 시트의 "클로드 분석여부" 컬럼에 날짜 기입 (`mark-analyzed.js`, `mark-personal-rules-analyzed.js`) |

**분류 태그**

| 태그 | 기준 |
|------|------|
| `[규칙-누락]` | 관련 규칙이 없어서 발생한 문제 |
| `[규칙-미적용]` | 규칙이 있는데 Claude가 따르지 않은 경우 |
| `[사용자-가이드]` | 규칙보다 사용자 프롬프트 방식으로 해결해야 할 것 |
| `[정보-부족]` | 규칙 추가보다 참조 정보(함수 목록, 매핑표 등) 보완이 필요한 것 |

> `reports/` 폴더는 git exclude 처리되어 로컬에만 저장됩니다.
