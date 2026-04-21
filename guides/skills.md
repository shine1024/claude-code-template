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

**용도**: 프로젝트 템플릿을 선택하여 `CLAUDE.md` 파일을 생성

| 항목 | 내용 |
|------|------|
| 호출 방법 | `claude-code-template` 프로젝트에서 `/init-claude-md <출력경로>` 입력 |
| 출력 경로 | 인수로 지정한 디렉터리. 미지정 시 현재 디렉터리 |
| 참조 템플릿 | `template/CLAUDE-TEMPLATE-*.md` |

**실행 흐름**

| 단계 | 내용 |
|------|------|
| 1 | 출력 경로 확인 (인수 or 현재 디렉터리) |
| 2 | 프로젝트 템플릿 목록 표시 → 번호 선택 |
| 3 | `CLAUDE-TEMPLATE.md`(공통 베이스) + 선택한 프로젝트 템플릿 두 파일 읽기 |
| 4 | 프로젝트 템플릿 내용 + 공통 규칙 섹션 병합 |
| 5 | 출력 경로에 `CLAUDE.md` 생성 |

**사용 예시**

```
/init-claude-md D:\projects\uniflow
```

**생성 후 할 일**

1. 프로젝트 실제 구조에 맞게 내용 수정
2. 각 모듈 디렉터리에 모듈별 `CLAUDE.md` 생성 (템플릿 파일 하단 예시 참고)
3. Claude가 틀린 결과를 낼 때마다 추가·수정

> 생성된 `CLAUDE.md`에는 프로젝트 특화 규칙과 공통 규칙(`CLAUDE-TEMPLATE.md`의 `## Claude 동작 규칙 (공통)` 섹션)이 자동으로 포함됩니다.

---

### /session-log — 세션 회고 기록

**용도**: 세션 대화를 분석해 회고 초안을 작성하고 Google Sheets에 제출

| 항목 | 내용 |
|------|------|
| 호출 방법 | 세션 종료 전 `/session-log` 입력 |
| 설정 위치 | `~/.claude/settings.json` 또는 `.claude/settings.local.json` |
| 제출 대상 | Google Sheets (Apps Script 경유) |

**사전 설정** (환경변수로 관리)

```json
{
  "env": {
    "SESSION_LOG_NAME": "[이름]",
    "SESSION_LOG_SCRIPT_URL": "[Google Apps Script 배포 URL]"
  }
}
```

> 개인 정보이므로 `.claude/settings.local.json` 또는 `~/.claude/settings.json`에 추가합니다.

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | 환경변수(`SESSION_LOG_NAME`)와 프로젝트명(`basename $(pwd)`) 확인 |
| 2 | 세션 전체 대화를 분석해 회고 초안 작성 |
| 3 | 초안 확인 후 수정 또는 제출 |

**Google Sheets 컬럼 구성**

| 컬럼 | 내용 |
|------|------|
| `date` | 날짜 |
| `name` | 이름 |
| `project` | 프로젝트명 |
| `requirements` | 요구사항 요약 |
| `conversationFlow` | 대화 흐름 요약 |
| `wentWell` | 잘된 점 |
| `wentWrong` | 잘못된 점 |
| `rootCause` | 원인 분석 |
| `improvement` | 개선 내용 |
| `other` | 기타 |

> Apps Script 초안: `.claude/skills/session-log/scripts/google-apps-script.js`

---

### /analyze-feedback — 피드백 분석 및 규칙 개선안 도출

**용도**: Google Sheets 작업세션 데이터를 분석해 CLAUDE.md 규칙 개선안을 보고서로 생성

| 항목 | 내용 |
|------|------|
| 호출 방법 | `claude-code-template` 프로젝트에서 `/analyze-feedback` 입력 |
| 출력 경로 | `reports/feedback-analysis-{YYYY-MM-DD}.md` |
| 분석 대상 | Google Sheets "2) 작업세션 수집" 시트의 미분석 신규 행 |

**사전 설정** (환경변수로 관리)

```json
{
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "[서비스 계정 JSON 키 파일 경로]",
    "SHEETS_FEEDBACK_ID": "[Google Spreadsheet ID]"
  }
}
```

> Google Sheets 연동 설정 방법: [`guides/google-sheets-service-account.md`](google-sheets-service-account.md)

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | 환경변수 확인 (`GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, `SHEETS_FEEDBACK_ID`) |
| 2 | 시트 데이터 조회 — "클로드 분석여부" 컬럼이 비어있는 행만 자동 필터링 |
| 3 | 신규 행에 해당하는 프로젝트 템플릿 파일 읽기 |
| 4 | 규칙 누락·미적용·신규 패턴·성공 패턴 분석 |
| 5 | `reports/feedback-analysis-{날짜}.md` 보고서 생성 |
| 6 | 사용자 확인 후 시트 "클로드 분석여부" 컬럼에 날짜 기입 |

**분류 태그**

| 태그 | 기준 |
|------|------|
| `[규칙-누락]` | 관련 규칙이 없어서 발생한 문제 |
| `[규칙-미적용]` | 규칙이 있는데 Claude가 따르지 않은 경우 |
| `[사용자-가이드]` | 규칙보다 사용자 프롬프트 방식으로 해결해야 할 것 |
| `[정보-부족]` | 규칙 추가보다 참조 정보(함수 목록, 매핑표 등) 보완이 필요한 것 |

> `reports/` 폴더는 git exclude 처리되어 로컬에만 저장됩니다.
