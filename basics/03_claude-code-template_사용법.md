# claude-code-template 사용법 가이드

> 사내 프로젝트에서 Claude Code 를 빠르게 도입하고, 쓰면서 함께 개선해나가기 위한 **공용 템플릿 리포** 의 사용법입니다.
>
> **성장 사다리에서 8~9단계 (팀 영역)** 를 다룹니다 — 사다리 전체 그림은 [기초 §11 성장 경로](./01_claude-code_기초.md#11-성장-경로) 참고.

---

## 목차

1. [개요](#1-개요)
2. [무엇을 만들고 있나](#2-무엇을-만들고-있나)
3. [신규 프로젝트 적용](#3-신규-프로젝트-적용)
4. [반복 사이클](#4-반복-사이클)
5. [부가 기능](#5-부가-기능)
6. [팀에 맞게 변형](#6-팀에-맞게-변형)

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| **과제** | 솔루션 웹 개발에서 Claude Code 사용 및 생산성 강화 |
| **목표** | Claude Code 가 잘 작동하는 솔루션 개발 환경을 만든다 |
| **시범운영 대상** | 퓨리오사 AI 프로젝트 — UniWORKS 2명 + UniFLOW 1명 |
| **산출물** | `claude-code-template` — 데이터 수집·분석·개선·검증 사이클 환경 |
| **운영 기간** | 4월 ~ 5월 (총 8주) |

### 출발 전제

다양한 환경, 서로 다른 프로젝트, 서로 다른 사용자가 Claude Code 를 쓰다보니 모두에게 맞는 정답 규칙은 존재하지 않습니다. 그래서 이 템플릿은 **잘 정리된 규칙집을 제공하지 않습니다.** 대신 어느 정도 합의 가능한 가정에서 출발해, 쓰면서 부딪힌 경험을 모아 규칙으로 환원하는 **반복 구조** 를 제공합니다. 사이클이 정답이 아니라, 정답을 찾아가는 과정 자체가 결과물입니다.

---

## 2. 무엇을 만들고 있나

### 4단계 사이클

처음 한 번 환경을 셋업한 뒤, 이후로는 **사용 → 수집 → 분석 → 개선** 이 반복됩니다.

```
 [초기화]  ← 프로젝트당 1회
     │
     ▼
 ┌─→ [사용] ──→ [수집] ──→ [분석] ──→ [개선] ─┐
 │                                          │
 └──────────────────────────────────────────┘
```

| 단계 | 빈도 | 무엇을 | 도구 |
|------|------|--------|------|
| **초기화** | 프로젝트당 1회 | Claude Code 환경 셋업 | `init.bat`, `/init-claude-md` |
| **사용** | 상시 | 실제 작업 (코드 작성·탐색·리뷰) | Claude Code CLI · IDE · skills/hooks |
| **수집** | 매 세션 종료 시 | 작업 경험을 팀이 함께 보는 곳에 기록 | `/session-log`, Google Sheets |
| **분석** | 월 1~2회 | 쌓인 데이터에서 패턴 찾기 | `/analyze-report` |
| **개선** | 분석 직후 | 규칙·템플릿·스킬에 반영, 팀 동기화 | `/apply-report`, `/share-rules`, `/sync-template` |

### 디렉토리 구조

```
프로젝트루트/
├── CLAUDE.md                       ← 프로젝트 지침 (git 커밋, 팀 공유)
├── CLAUDE.local.md                 ← 개인 설정 (.gitignore)
├── reports/                        ← 분석 보고서 (.gitignore, 로컬 전용)
└── .claude/
    ├── settings.json               ← 권한·모델 (sync 대상)
    ├── settings.local.json         ← 개인 환경·시크릿 (.gitignore)
    ├── hooks/                      ← 이벤트 훅 (sync 대상)
    ├── rules/                      ← 관심사별 규칙 (sync 대상, 세션 시작 시 자동 로드)
    ├── skills/                     ← 슬래시 커맨드 (sync 대상)
    ├── viewer/                     ← claude-viewer 정적 페이지 (런타임 산출물은 .gitignore)
    └── state/SYNC_HASH             ← 마지막 sync 시점의 template 해시 (git 추적)
```

| 분류 | git | 이유 |
|------|-----|------|
| `CLAUDE.md` · `.claude/settings.json` · `.claude/state/` | ✅ | 팀 공유 |
| `CLAUDE.local.md` · `.claude/settings.local.json` · `reports/` | ❌ | 개인 환경·시크릿·로컬 데이터 |

> 각 파일의 상세 역할: [`.claude/guides/skills.md`](../.claude/guides/skills.md), [`.claude/guides/hooks.md`](../.claude/guides/hooks.md)

---

## 3. 신규 프로젝트 적용

기존 프로젝트에 Claude Code 환경을 처음 설정하는 절차입니다 (10~20분).

### 절차

**1) `init.bat` 실행** (claude-code-template 디렉토리에서)

```cmd
init.bat D:\projects\my-project
```

- 대상 프로젝트에 `.claude/` 복사 (hooks·rules·skills·settings.json)
- `.gitignore` 에 `CLAUDE.local.md`·`settings.local.json`·`reports/` 추가
- `settings.local.json` 기본 템플릿 생성

> Windows 전용. macOS/Linux 는 동등한 셸 스크립트를 직접 작성합니다.

**2) Claude 실행 후 `/init-claude-md`**

```bash
cd /path/to/my-project
claude
```

```
/init-claude-md
```

- 프로젝트 목록에서 번호 선택
- `template/CLAUDE-TEMPLATE-{project}.md` (CONTEXT) 를 읽음
- 코드를 분석하여 기술 스택·구조·도메인·작업 패턴 추출
- 분석 결과 + CONTEXT 를 합쳐 `CLAUDE.md` 작성 (멀티 모듈은 모듈별로 추가 생성)

**프로젝트별 템플릿 매핑**

| CONTEXT 파일 | 대상 프로젝트 |
|--------------|--------------|
| `template/CLAUDE-TEMPLATE-uniflow.md` | uniflow (전자결재) |
| `template/CLAUDE-TEMPLATE-uniworks-pce.md` | unidocu6 (UniWorks PCE) |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile.md` | unidocu6-mobile 프론트 |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md` | unidocu6-mobile 백엔드 |
| `template/CLAUDE-TEMPLATE-uniworks-public.md` | unidocu6-public-sap |

> core 템플릿(`pce-core`, `public-core`)은 core 경로 입력 시 자동 적용.

**3) 다듬기**

생성된 `CLAUDE.md` 의 `{확인 필요}` 항목을 실제 값으로 바꿉니다. `CLAUDE.local.md` 는 `## 공유 가능` / `## 비공유` 두 섹션으로 작성합니다 — `## 공유 가능` 만 `/share-rules` 로 팀 시트에 올라가고, `## 비공유` 는 어떤 단계에서도 외부로 나가지 않습니다.

### 적용 직후 확인

```
□ .claude/ 폴더가 대상 프로젝트에 생겼는가
□ /init-claude-md 가 CLAUDE.md 를 만들었는가
□ {확인 필요} 항목을 한 번 훑어 채웠는가
□ CLAUDE.local.md 의 공유·비공유 섹션 구분이 되어 있는가
□ .gitignore 에 CLAUDE.local.md / settings.local.json / reports/ 가 들어갔는가
```

---

## 4. 반복 사이클

이 템플릿의 핵심. 작업 데이터를 모으고, 분석하고, 규칙으로 환원하는 흐름입니다.

```
[세션 종료]          [데이터 축적]          [분석]              [반영]
     │                    │                   │                   │
/session-log         Google Sheets      /analyze-report     /apply-report
     │              회고 + 개인 규칙           │                   │
     ▼                    ▼                   ▼                   ▼
회고 초안 → 시트     미분석 행 누적       보고서 생성        선택한 규칙만 적용
                                                                  │
                                                                  ▼
                                                           CLAUDE.md / rules/
```

### 스킬

| 스킬 | 시점 | 동작 |
|------|------|------|
| `/session-log` | 매 세션 종료 | 세션 대화를 분석해 회고 초안 작성 → 사용자 확인 → Google Sheets `1) 회고` 시트에 추가 |
| `/share-rules` | 새 규칙이 쌓였을 때 | `CLAUDE.local.md` 의 `## 공유 가능` 섹션을 추출 → 미리보기 → `3) 개인 규칙 후보` 시트에 업로드 |
| `/analyze-report` | 월 1~2회 | 시트의 미분석 행만 자동 필터링 → 현재 프로젝트 규칙과 비교 → `reports/analyze-report/` 보고서 생성 |
| `/apply-report` | 분석 직후 | 보고서 후보를 미리보기 → 사용자 선택 (`1,3,5` / `all` / `취소`) → 멱등성 체크 후 규칙 파일에 반영 |

### 사이클 한 번 소요

| 단계 | 빈도 | 소요 |
|------|------|------|
| `/session-log` | 매 세션 | 2~5분 |
| `/share-rules` | 주 1회 권장 | 1~2분 |
| `/analyze-report` | 월 1~2회 | 5~10분 |
| `/apply-report` | 분석 직후 | 5~10분 |

> `/apply-report` 는 자동 커밋·푸시를 하지 않습니다. 변경 후 `git diff` 로 본인이 검토하고 커밋합니다.
> Google Sheets 연동: [`.claude/guides/google-sheets-setup.md`](../.claude/guides/google-sheets-setup.md)

### 개선을 다른 프로젝트로 전파

`/apply-report` 로 적용한 변경 중 **공통화 가능한 것** 은 `claude-code-template` 리포에 환원해야 다른 프로젝트가 `/sync-template` 으로 받을 수 있습니다.

| 공통화 | 예 |
|--------|----|
| 가능 | `.claude/rules/*-style.md`, 일반 작업용 skill·hook |
| 불가 | 특정 프로젝트 도메인 규칙, 시크릿·로컬 경로가 섞인 변경 |

환원 절차: 본 프로젝트에서 적용 → 공통 변경 식별 → template 리포에서 동일 변경 → PR·머지 → 다른 프로젝트는 `/sync-template` 으로 받음.

---

## 5. 부가 기능

사이클의 본류는 아니지만, 실제 운영에 필요한 보조 기능입니다. 상세는 각 가이드 문서를 참고합니다.

### 일감 워크플로우 (Redmine 연동, 선택)

Redmine 일감 기반으로 작업하는 팀을 위한 통합 워크플로우입니다. 쓰지 않는 팀은 건너뜁니다.

- `/issue-new` — Redmine 에 임시 일감 생성 + `ing__issue__NNNN` 작업 브랜치 자동 생성·체크아웃
- `/commit-push` — 변경 분석 → 커밋 메시지(`#NNNN [분류] 요약`) 자동 생성 → 사용자 확인 → 커밋·푸시 + Redmine 일감 갱신 (제목·진척도·시간)
- `/issue-update` — 일감 제목만 정식 형식으로 보정

> 환경변수(`REDMINE_URL`·`REDMINE_API_KEY`·`BRANCH_STRATEGY` 등) 및 상세 동작: [`.claude/guides/skills.md`](../.claude/guides/skills.md)

### `/sync-template` — 템플릿 동기화

`claude-code-template` 의 최신 `.claude/` 설정을 현재 프로젝트로 끌어오는 명령입니다. **한 곳만 고치면 모든 프로젝트가 따라옵니다.**

- 원격 HEAD 해시를 먼저 비교 → 다를 때만 clone·복사
- `hooks/`·`rules/`·`skills/`·`settings.json` 은 **덮어쓰기**
- `settings.local.json` 과 `CLAUDE.md` 는 **건드리지 않음**
- `SessionStart` 훅이 업데이트가 있으면 자동으로 알림

> 사전 조건: `.claude/settings.local.json` 에 `TEMPLATE_REPO_URL` 등록. 상세: [`.claude/hooks/check-update/`](../.claude/hooks/check-update/)

### `claude-viewer` — 브라우저 응답 뷰어

Claude 응답을 콘솔 대신 브라우저(`http://localhost:19988/response.html`)에서 책 페이지 UI로 봅니다.

- `UserPromptSubmit` 훅이 대기 마커(`viewer/.waiting`)를 만들고, `Stop` 훅이 transcript 를 파싱해 `viewer/response.md` 에 응답 + 도구 호출을 시간순으로 기록합니다
- 페이지는 2초 폴링으로 자동 갱신 — 마크다운 렌더링, `+`/`-` diff 컬러링, 응답 대기 중 상단 progress bar
- 의존성은 Python stdlib 만 (marked.js 는 CDN). Anthropic API 송신 없음, HTTP 서버는 `127.0.0.1:19988` 만 listen
- 포트 점유 시 충돌. `stop_hook.py` 의 `PORT` 상수에서 변경 가능

### RULE_MODE — 규칙 작성 모드

Claude 가 세션 중 발견한 규칙을 **어디에 기록할지** 제어합니다.

| 모드 | 동작 | 적합 |
|------|------|------|
| `local` (기본값) | `CLAUDE.local.md` 의 공유/비공유 섹션에 자동 분류 | 개인 발견을 시트로 모은 뒤 분석으로 승격 |
| `direct` | `CLAUDE.md` 변경안 제안 → 사용자 확인 후 작성 | 팀이 작고 (3~5인) 즉시 반영해야 할 때 |

우선순위: `CLAUDE.local.md` 의 `RULE_MODE` → `CLAUDE.md` 의 `RULE_MODE` → 기본값 `local`.

> 상세 동작 기준: [`.claude/rules/rule-writing-policy.md`](../.claude/rules/rule-writing-policy.md)

---

## 6. 팀에 맞게 변형

이 템플릿을 그대로 쓰지 않아도 됩니다. **사이클 자체가 유지되면 변형은 자유** 입니다.

### 자주 묻는 변형

| 상황 | 대응 |
|------|------|
| Redmine 대신 Jira | `issue-new`·`commit-push`·`issue-update` 의 API 호출 부분만 교체. 흐름은 유지 |
| Google Sheets 대신 Notion·Airtable | `session-log`·`share-rules`·`analyze-report` 의 데이터 레이어만 교체. 컬럼 구조는 유지 |
| Slack 알림 불필요 | `settings.local.json` 에 `SLACK_NOTIFY_ENABLED: false` 추가 |
| CONTEXT 템플릿이 안 맞음 | `template/CLAUDE-TEMPLATE-{project}.md` 를 새로 만들어 등록 |

### 깨면 안 되는 것

- **공유 vs 개인 분리** — `CLAUDE.md` 와 `CLAUDE.local.md` 를 섞지 않는다
- **데이터 단방향 흐름** — 수집(개인) → 분석(자동) → 반영(검토 후 공유)
- **반영은 사람이 결정** — 분석은 자동, 자동 커밋 금지
- **시크릿은 `settings.local.json` 에만** — 어떤 경우에도 git 에 들어가지 않는다

### 관련 문서

| 문서 | 용도 |
|------|------|
| [기초 가이드](./01_claude-code_기초.md) | Claude Code 자체 사용법 |
| [심화 가이드](./02_claude-code_심화.md) | Plan Mode·메모리·Skills·Plugin |
| [`.claude/guides/skills.md`](../.claude/guides/skills.md) | 각 스킬의 상세 동작·컬럼 매핑 |
| [`.claude/guides/hooks.md`](../.claude/guides/hooks.md) | 훅 설정·환경변수 |
| [`.claude/guides/google-sheets-setup.md`](../.claude/guides/google-sheets-setup.md) | Google Sheets 연동 |
| [`.claude/rules/rule-writing-policy.md`](../.claude/rules/rule-writing-policy.md) | RULE_MODE 동작 |

---

## 마무리

이 템플릿의 가치는 **사이클이 도는 동안에만** 유지됩니다. 도구는 바뀌어도, 흐름은 멈추지 않게 운영하는 게 핵심입니다. 막히는 단계가 있으면 그 부분의 도구를 더 가볍게 만들거나, 다른 도구로 바꾸는 게 옳은 방향입니다. **사이클을 살리는 게 도구를 지키는 것보다 중요합니다.**
