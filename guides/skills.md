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
| 설정 위치 | `CLAUDE.local.md` |
| 제출 대상 | Google Sheets (Apps Script 경유) |

**실행 절차**

| 단계 | 내용 |
|------|------|
| 1 | `CLAUDE.local.md`에서 이름·시스템명·제출 URL 읽기 |
| 2 | 세션 전체 대화를 분석해 회고 초안 작성 |
| 3 | 소요시간 질문 |
| 4 | 초안 확인 후 수정 또는 제출 |

**사전 설정** (`CLAUDE.local.md`에 아래 항목 추가)

```markdown
## 세션 회고 설정 (/session-log)

- 세션회고_이름: [이름]
- 세션회고_시스템명: [프로젝트명]
- 세션회고_SCRIPT_URL: [Google Apps Script 배포 URL]
```

**Google Sheets 컬럼 구성**

| 컬럼 | 내용 |
|------|------|
| `date` | 날짜 |
| `name` | 이름 |
| `system` | 시스템명 |
| `requirements` | 요구사항 요약 |
| `wentWell` | 잘된 점 |
| `wentWrong` | 잘못된 점 |
| `ruleImprovement` | 규칙 개선 제안 |
| `duration` | 소요시간 |
| `other` | 기타 |

> Apps Script 초안: `.claude/skills/session-log/scripts/google-apps-script.js`
