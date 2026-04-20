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
