# claude-code-template 사용법 가이드

> 우리 팀이 Claude Code를 빠르게 적용하고, 쓰면서 함께 개선해나가기 위해 만든 **공용 템플릿 리포** 사용법입니다.  
> 이 문서는 "그대로 따라 쓰는 매뉴얼"이 아닙니다. 팀에 맞게 변형해 쓸 수 있도록 **왜 이렇게 만들었는지(철학)** 와 **어떻게 따라 하는지(절차)** 를 함께 담았습니다.
>
> **성장 사다리에서 8~9단계 (팀 영역)** 를 다룹니다 — 사다리 전체 그림은 [기초 §11 성장 경로](./01_claude-code_기초.md#11-성장-경로) 참고.

---

## 목차

1. [도입 배경](#1-도입-배경)
2. [초기화와 4단계 사이클](#2-초기화와-4단계-사이클)
3. [신규 프로젝트 적용 절차](#3-신규-프로젝트-적용-절차)
4. [일감·커밋 워크플로우](#4-일감커밋-워크플로우)
5. [템플릿 동기화: /sync-template](#5-템플릿-동기화-sync-template)
6. [규칙 작성 모드 (RULE_MODE)](#6-규칙-작성-모드-rule_mode)
7. [회고·개선 사이클](#7-회고개선-사이클)
8. [디렉토리 구조와 파일 역할](#8-디렉토리-구조와-파일-역할)
9. [팀에 맞게 변형하는 가이드](#9-팀에-맞게-변형하는-가이드)

---

## 1. 도입 배경

이 템플릿은 *"Claude Code 를 활용해 솔루션 WEB 개발의 생산성을 높이자"* 라는 주제에서 출발했습니다.

처음에는 각 프로젝트의 규칙(`CLAUDE.md`)을 잘 정리하는 것이 핵심이라고 보았습니다. 그러나 좋은 규칙은 사전 기획만으로 만들어지지 않습니다. 실제로 작업하면서 부딪힌 경험이 쌓여야 의미 있는 규칙으로 정리됩니다.

따라서 이 템플릿의 초점은 잘 정돈된 규칙집을 제공하는 데 있지 않습니다. **그러한 규칙이 쌓일 수 있는 과정 자체를 갖추는 것**이 목적입니다. 작업 경험을 모으고, 패턴을 찾고, 다시 규칙으로 옮기는 흐름을 운영하는 것이 우선입니다.

§2부터는 그 흐름이 어떻게 구성되어 있는지 다룹니다.

---

## 2. 초기화와 4단계 사이클

처음 한 번 환경을 셋업한 뒤, 이후로는 **사용 → 수집 → 분석 → 개선** 네 단계가 반복됩니다. 초기화는 사이클의 일부가 아니라 사이클을 시작하기 위한 1회 셋업입니다.

```
 [초기화]  ← 프로젝트당 1회
     │
     ▼
 ┌─→ [사용] ──→ [수집] ──→ [분석] ──→ [개선] ─┐
 │                                          │
 └──────────────────────────────────────────┘
                  (반복)
```

| 구분 | 단계 | 빈도 | 무엇을 하나 | 도구 |
|------|------|------|-----------|------|
| 1회 셋업 | **초기화** | 프로젝트당 1회 | 새 프로젝트에 Claude Code 환경 셋업 | `init.bat`, `/init-claude-md`, 프로젝트별 템플릿 |
| 사이클 | **사용** | 상시 | 실제 작업에서 Claude Code 로 코드 작성·탐색·리뷰 수행 | Claude Code CLI · IDE 연동 · 등록된 skills/hooks |
| 사이클 | **수집** | 매 세션 종료 시 | 작업 경험(잘된 점·잘못된 점)을 팀이 함께 보는 곳에 기록 | `/session-log`, Google Sheets |
| 사이클 | **분석** | 월 1~2회 | 쌓인 데이터에서 패턴을 찾아 규칙 개선안 도출 | `/analyze-report` |
| 사이클 | **개선** | 분석 직후 | 결과를 규칙·템플릿·스킬에 반영하고 팀 전체에 동기화 | `/apply-report`, `/share-rules`, `/sync-template` |

각 단계의 구체적인 사용법은 §3·§4·§5·§7에서 다룹니다. 먼저 이 흐름이 **왜** 이렇게 설계되었는지 이해해두면, 나중에 도구를 바꾸거나 팀 상황에 맞게 변형할 때 흔들리지 않습니다.

### 설계 원칙

| 원칙 | 의미 |
|------|------|
| **즉시 쓸 수 있어야 한다** | 복잡한 설정 없이 한 명령어로 환경 구축이 끝나야 한다. 안 그러면 도입 자체를 포기한다. |
| **쓰면서 나아져야 한다** | 실제 작업 데이터를 바탕으로 규칙·템플릿이 지속적으로 개선되어야 한다. 정적인 가이드는 금방 낡는다. |
| **공유와 개인을 분리한다** | 팀 공유 규칙(`CLAUDE.md`)과 개인 환경 설정(`CLAUDE.local.md`)을 명확히 나눈다. 섞이면 둘 다 망가진다. |

---

## 3. 신규 프로젝트 적용 절차

기존 프로젝트에 Claude Code 환경을 처음 설정하는 절차입니다. 코드베이스 분석량에 따라 10~20분 정도 소요됩니다.

### 절차 요약

```
[claude-code-template]                     [대상 프로젝트]
       │                                          │
       │  1) init.bat <대상경로>                  │
       ├─────────────────────────────────────────▶│  .claude/ 복사 + settings.local.json 생성
       │                                          │
       │                                          │  2) 대상 프로젝트에서 claude 실행
       │                                          │
       │                                          │  3) /init-claude-md 실행
       │  template/CLAUDE-TEMPLATE-*.md 참조 ◀────┤
       │                                          │
       │                                          │  4) CLAUDE.md / CLAUDE.local.md 다듬기
```

### 단계별 상세

**1) `init.bat` 실행** (claude-code-template 디렉토리에서)

```cmd
init.bat D:\projects\my-project
```

자동으로 처리되는 것:
- 대상 프로젝트에 `.claude/` 폴더 복사 (hooks, rules, skills, settings.json)
- `.gitignore`에 `CLAUDE.local.md`·`settings.local.json`·`reports/` 등 자동 추가
- `settings.local.json` 기본 템플릿 생성

> Windows 전용입니다. macOS/Linux 환경이라면 동등한 셸 스크립트를 직접 작성해 쓰면 됩니다.

**2) 대상 프로젝트에서 Claude 실행**

```bash
cd /path/to/my-project
claude
```

**3) `/init-claude-md` 로 CLAUDE.md 자동 생성**

```
/init-claude-md
```

스킬이 다음을 수행합니다.
- 프로젝트 목록 표시 → 번호 선택
- `template/CLAUDE-TEMPLATE-{project}.md` (해당 프로젝트의 CONTEXT)를 읽음
- 코드를 직접 분석하여 기술 스택·구조·도메인·작업 패턴 추출
- 분석 결과 + CONTEXT를 합쳐 `CLAUDE.md` 작성
- 멀티 모듈이면 모듈별 `CLAUDE.md` 추가 생성

**프로젝트별 템플릿 매핑**

| CONTEXT 파일 | 대상 프로젝트 |
|--------------|--------------|
| `template/CLAUDE-TEMPLATE-uniflow.md` | uniflow (전자결재) |
| `template/CLAUDE-TEMPLATE-uniworks-pce.md` | unidocu6 (UniWorks PCE) |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile.md` | unidocu6-mobile 프론트 |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md` | unidocu6-mobile 백엔드 |
| `template/CLAUDE-TEMPLATE-uniworks-public.md` | unidocu6-public-sap |

> core 템플릿(`pce-core`, `public-core`)은 core 경로 입력 시 자동 적용됩니다.

**4) CLAUDE.md / CLAUDE.local.md 다듬기**

생성된 `CLAUDE.md`에는 `{확인 필요}` 표시가 들어 있습니다. 자동 분석으로 채울 수 없었던 항목입니다. 한 번 훑어보면서 실제 값으로 바꿉니다.

`CLAUDE.local.md`(개인 설정)는 두 섹션으로 나누어 작성합니다.

```markdown
## 공유 가능
### 외부 API DTO 변환 규칙
모든 외부 API 응답은 DTO로 변환 후 사용한다.

## 비공유
- 로컬 경로: D:\workspace\...
- 사번 / 사내 URL 등
```

> `## 공유 가능` 섹션의 규칙만 `/share-rules` 로 팀 시트에 업로드됩니다. `## 비공유`는 어떤 단계에서도 외부로 나가지 않습니다.

### 적용 직후 확인할 것

```
□ 대상 프로젝트에 .claude/ 폴더가 생겼는가
□ /init-claude-md 가 CLAUDE.md 를 만들었는가
□ {확인 필요} 항목을 한 번 훑어 채웠는가
□ CLAUDE.local.md 에 RULE_MODE / 공유·비공유 섹션이 있는가
□ .gitignore 에 CLAUDE.local.md / settings.local.json / reports/ 가 들어갔는가
```

---

## 4. 일감·커밋 워크플로우

Redmine 일감 기반으로 작업하는 팀을 위한 통합 워크플로우입니다. **사용 여부는 선택**이며, Redmine을 쓰지 않는 팀은 이 섹션을 건너뛰어도 됩니다.

### 세 개의 스킬이 한 흐름

```
[작업 시작]                  [작업 진행]                 [작업 마무리]
     │                            │                          │
/issue-new                        │                    /commit-push
   │                              │                          │
   ▼                              │                          ▼
Redmine 임시 일감 생성 ─→ ing__issue__NNNN 브랜치 ─→ 커밋·푸시·일감 갱신
                                                         (제목·진척도·시간)
```

### `/issue-new` — 작업 시작 시 일감 채번

```
/issue-new
```

동작:
- Redmine에 `[임시] YYYY-MM-DD HH:MM:SS` 제목으로 일감 즉시 생성
- 기본은 `ing__issue__NNNN` 형태의 작업 브랜치 자동 생성·체크아웃
- `BRANCH_STRATEGY=never` 설정 시 브랜치는 만들지 않고 일감번호만 캐시(`.claude/cache/current_issue`)

### `/commit-push` — 작업 완료 시 한 번에 정리

```
/commit-push
```

동작:
- 변경 분석 → 커밋 메시지 자동 생성 (`#NNNN [분류] 요약` 형식)
- 사용자 한 번 확인 → 커밋·푸시
- Redmine 일감 자동 갱신: 제목·진척도(100%)·소요시간

### `/issue-update` — 일감만 갱신하고 싶을 때

직전 커밋의 일감번호를 분석해 제목만 정식 형식(`[분류] 요약`)으로 바꿉니다. 커밋·푸시 흐름과 분리해서 일감 정보만 보정할 때 사용합니다.

### 환경변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `REDMINE_URL` | `settings.local.json` | Redmine 서버 주소 |
| `REDMINE_API_KEY` | `settings.local.json` | 본인 API 키 |
| `BRANCH_STRATEGY` | `settings.local.json` | `default` (브랜치 생성) / `never` |
| `BASE_BRANCH` | `settings.local.json` | 작업 브랜치의 기준 (기본 `main`) |
| `REDMINE_STATUS_ID_DONE` | `settings.local.json` | 설정 시 완료 상태로 자동 변경 |

> 상세 컬럼 매핑·내부 동작은 [`.claude/guides/skills.md`](../.claude/guides/skills.md) 참고.

---

## 5. 템플릿 동기화: /sync-template

```
/sync-template
```

`claude-code-template` 리포는 **여러 프로젝트가 공통으로 쓰는 `.claude/` 설정의 단일 출처**입니다. `/sync-template` 은 그 최신본을 현재 프로젝트로 끌어와, 모든 프로젝트가 같은 hooks·rules·skills 위에서 동작하도록 유지하는 메커니즘입니다.

### 왜 필요한가

각 프로젝트가 자기 `.claude/` 를 따로 관리하면 다음 문제가 생깁니다.

- 같은 hook·skill 을 프로젝트마다 따로 수정해야 함
- 한 프로젝트에서 검증된 개선이 다른 프로젝트로 전파되지 않음
- 시간이 지날수록 프로젝트 간 설정이 어긋남

`claude-code-template` 을 단일 출처로 두면 — **한 곳만 고치면 `/sync-template` 으로 모든 프로젝트가 따라갑니다.** 이게 §2 사이클의 "개선" 결과를 팀 전체에 전파하는 통로입니다.

### 동작

| 항목 | 동작 |
|------|------|
| `.claude/hooks/` `.claude/rules/` `.claude/skills/` | template의 최신본으로 **덮어쓰기** |
| `.claude/settings.json` | template의 최신본으로 **덮어쓰기** (직접 수정한 내용은 다음 sync에 사라짐) |
| `.claude/settings.local.json` | **건드리지 않음** — 개인 환경 설정 보존 |
| `CLAUDE.md` | **건드리지 않음** — 프로젝트별 별도 관리 |
| `.claude/state/SYNC_HASH` | sync 완료 시점의 template HEAD 해시 기록 (git 추적) |

### 사전 조건

`.claude/settings.local.json` 에 template 리포 주소를 등록합니다.

```json
{
  "env": {
    "TEMPLATE_REPO_URL": "https://your-gitlab/claude-code-template.git"
  }
}
```

### 자동 업데이트 알림

`TEMPLATE_REPO_URL`이 설정되어 있으면 **세션 시작 시 자동으로** `SYNC_HASH`와 원격 HEAD를 비교합니다. 다르면 콘솔과 Slack DM으로 "/sync-template 실행 권장" 안내가 표시됩니다.

> 동작 상세: [`.claude/hooks/check-update/`](../.claude/hooks/check-update/) — `SessionStart` 훅으로 동작.

---

## 6. 규칙 작성 모드 (RULE_MODE)

Claude가 세션 중에 발견한 규칙을 **어디에 기록할지** 제어하는 설정입니다.

### 두 가지 모드

| 모드 | 동작 | 적합한 경우 |
|------|------|------------|
| `local` | `CLAUDE.local.md` 의 `## 공유 가능` / `## 비공유` 섹션에 자동 분류해서 추가 | 개인이 먼저 발견하고 선별적으로 팀에 공유 (안전한 기본값) |
| `direct` | `CLAUDE.md` 변경안을 제안 → 사용자 확인 후 작성 | 팀 전체에 즉시 반영해야 하는 환경 |

### 우선순위

```
CLAUDE.local.md  의 RULE_MODE   ← 개인 오버라이드 (우선)
       ↓ 없으면
CLAUDE.md       의 RULE_MODE   ← 팀 기본값
       ↓ 없으면
기본값: local
```

### 설정 방법

**팀 기본값** (`CLAUDE.md` 안)

```markdown
## 규칙 작성 모드
RULE_MODE: local
```

**개인 오버라이드** (`CLAUDE.local.md` 안 — 주석 해제)

```markdown
## 규칙 작성 모드
RULE_MODE: direct
```

### 어떤 모드를 골라야 하나

- 팀이 작고 (3~5인) 모두 같은 컨텍스트라면 → `direct`
- 팀이 크거나 도메인이 분산되어 있다면 → `local` (개인 발견을 시트로 모은 뒤 분석으로 승격)
- 시범운영 초기에 데이터 모으는 단계라면 → `local`

> 상세 동작 기준: [`.claude/rules/rule-writing-policy.md`](../.claude/rules/rule-writing-policy.md)

---

## 7. 회고·개선 사이클

이 템플릿의 핵심입니다. 작업 데이터를 모으고, 분석하고, 규칙으로 환원하는 흐름입니다.

```
[세션 종료]               [데이터 축적]              [분석]              [반영]
     │                         │                       │                   │
/session-log              Google Sheets         /analyze-report      /apply-report
     │                    회고 + 개인규칙              │                   │
     ▼                         ▼                       ▼                   ▼
회고 초안 → 시트 append   미분석 행 누적         보고서 생성        선택한 규칙만 적용
                                                                           │
                                                                           ▼
                                                                    CLAUDE.md /
                                                                  .claude/rules/
```

### `/session-log` — 세션 끝낼 때 회고 남기기

```
/session-log
```

- 세션 전체 대화를 분석해 회고 초안 자동 작성
- 사용자 확인·수정 후 Google Sheets `1) 회고` 시트에 추가
- 컬럼: 날짜·이름·프로젝트·요구사항·대화흐름·잘된점·잘못된점·원인·개선·기타·분석여부

### `/share-rules` — 개인 규칙을 팀 후보 시트에 올리기

```
/share-rules
```

- `CLAUDE.local.md` 의 `## 공유 가능` 섹션을 추출
- 미리보기로 사용자 확인
- 확인 시 Google Sheets `3) 개인 규칙 후보` 시트에 append
- `## 비공유` 섹션은 절대 업로드되지 않음

### `/analyze-report` — 패턴 찾기

```
/analyze-report
```

- `1) 회고` 와 `3) 개인 규칙 후보` 시트에서 **미분석 행만** 자동 필터링
- 현재 프로젝트의 `CLAUDE.md` / `.claude/rules/*.md` 와 비교
- `reports/analyze-report/{날짜}-analyze-report.md` 보고서 생성
- 처리 완료된 행에 분석 날짜 자동 기입

분류 태그:

| 태그 | 의미 |
|------|------|
| `[규칙-누락]` | 해당 규칙이 없어 발생한 문제 |
| `[규칙-미적용]` | 규칙이 있는데 Claude가 따르지 않음 |
| `[사용자-가이드]` | 규칙보다 사용자 프롬프트 방식으로 해결 |
| `[정보-부족]` | 규칙보다 참조 정보(매핑표 등) 보완이 필요 |

### `/apply-report` — 보고서를 실제 규칙으로 반영

```
/apply-report                # 최신 보고서 사용
/apply-report 2026-05-06     # 특정 날짜 보고서 사용
```

- 보고서를 파싱하여 적용 후보를 미리보기로 표시
- 사용자가 번호 선택 (`1,3,5` / `all` / `취소`)
- 멱등성 체크 (이미 같은 내용이 있으면 건너뜀)
- 규칙 타입별로 적절한 위치에 자동 추가

| 규칙 타입 | 기본 적용 위치 |
|----------|---------------|
| `[코딩규칙]` | `.claude/rules/{lang}-style.md` |
| `[탐색규칙]` | 루트 `CLAUDE.md` 또는 `.claude/rules/{도메인}.md` |
| `[지식]` | 해당 모듈 `CLAUDE.md` |
| `[워크플로우]` | 루트 `CLAUDE.md` |

> 자동 커밋·푸시는 하지 않습니다. 변경 후 `git diff` 로 본인이 검토하고 커밋합니다.

### 사이클 한 번을 도는 데 걸리는 시간

| 단계 | 빈도 | 소요 시간 |
|------|------|----------|
| `/session-log` | 매 세션 끝날 때 | 2~5분 |
| `/share-rules` | 새 규칙이 쌓였을 때 (주 1회 권장) | 1~2분 |
| `/analyze-report` | 시트에 데이터가 충분히 모이면 (월 1~2회) | 5~10분 |
| `/apply-report` | 분석 직후 | 5~10분 |

> Google Sheets 연동 설정: [`.claude/guides/google-sheets-setup.md`](../.claude/guides/google-sheets-setup.md)

### 개선을 다른 프로젝트로 전파 (템플릿 환원)

`/apply-report` 로 적용한 변경 중 **다른 프로젝트에도 공통으로 적용되어야 하는 것**은 `claude-code-template` 리포에 환원해야 다른 프로젝트가 `/sync-template` 으로 받을 수 있습니다. 환원하지 않으면 개선이 본 프로젝트에만 머무릅니다.

**공통화 가능 여부 판단 기준**

| 변경 위치 | 공통화 |
|---|---|
| `.claude/rules/*-style.md` 같은 언어·일반 규칙 | 대부분 공통 |
| `.claude/skills/<일반 작업>/SKILL.md` | 대부분 공통 |
| `.claude/hooks/<공용 훅>/` | 대부분 공통 |
| 특정 프로젝트 도메인 규칙 (`uniflow`/`uniworks` 한정 등) | 비공통 — 본 프로젝트 그대로 |
| 시크릿·로컬 경로가 섞인 변경 | 비공통 — `.local` 파일 쪽으로 |

**환원 절차**

1. 본 프로젝트에서 `/apply-report` 로 변경 적용
2. 위 기준으로 공통화 가능한 변경 식별
3. `claude-code-template` 리포로 이동(또는 worktree)하여 동일 변경 반영
4. PR 생성 → 리뷰 → main 머지
5. 다른 프로젝트는 `/sync-template` 으로 자동 반영
   - `TEMPLATE_REPO_URL` 이 등록되어 있으면 `SessionStart` 훅이 업데이트 알림을 띄워줌 (§5)

> §5 `/sync-template` 이 template → 프로젝트(pull) 방향이라면, 환원 PR은 프로젝트 → template(push) 방향입니다. 두 흐름이 맞물려야 §2 사이클의 "개선" 결과가 모든 프로젝트로 확산됩니다.

---

## 8. 디렉토리 구조와 파일 역할

```
프로젝트루트/
├── CLAUDE.md                       ← 프로젝트 지침 (git 커밋, 팀 공유)
├── CLAUDE.local.md                 ← 개인 설정 (.gitignore, RULE_MODE 등)
├── reports/                        ← 분석 보고서 (.gitignore, 로컬 전용)
└── .claude/
    ├── settings.json               ← 권한·모델 등 기술 설정 (sync 대상)
    ├── settings.local.json         ← 개인 환경 설정 (.gitignore, 시크릿 포함)
    ├── hooks/                      ← 이벤트 훅 (sync 대상)
    │   ├── slack-notify/           ←   Slack DM (시작/완료 알림)
    │   └── check-update/           ←   템플릿 업데이트 알림
    ├── rules/                      ← 관심사별 규칙 (sync 대상, 세션 시작 시 자동 로드)
    │   ├── coding-behavior.md      ←   LLM 코딩 4원칙 (모든 프로젝트 필수)
    │   ├── java-style.md / js-style.md / sql-style.md
    │   ├── security.md / performance.md
    │   ├── documentation.md        ←   SKILL.md 작성 표준
    │   └── rule-writing-policy.md  ←   RULE_MODE 동작 기준
    ├── skills/                     ← 슬래시 커맨드 (sync 대상)
    │   ├── init-claude-md/         ←   CLAUDE.md 자동 생성
    │   ├── sync-template/          ←   template 동기화
    │   ├── issue-new / issue-update / commit-push  ← Redmine 워크플로우
    │   ├── session-log / share-rules               ← 회고·공유
    │   └── analyze-report / apply-report           ← 분석·반영
    └── state/                      ← 동기화 상태 (git 추적, 프로젝트 단위)
        └── SYNC_HASH               ←   마지막 sync 시점의 template 해시
```

### 무엇이 git에 들어가나

| 분류 | git 커밋 | 이유 |
|------|---------|------|
| `CLAUDE.md` | 한다 | 팀 공유 지침 |
| `CLAUDE.local.md` | **안 한다** | 개인 환경, 비공유 정보 포함 |
| `.claude/settings.json` | 한다 | 팀 공통 권한·모델 설정 |
| `.claude/settings.local.json` | **안 한다** | 시크릿(API 키 등) 포함 |
| `.claude/state/SYNC_HASH` | 한다 | 어느 시점 template 까지 적용했는지 팀이 공유 |
| `reports/` | **안 한다** | 분석 데이터, 로컬 전용 |

---

## 9. 팀에 맞게 변형하는 가이드

이 템플릿을 그대로 쓰지 않아도 됩니다. 사이클 자체가 유지되면 변형은 자유입니다.

### 자주 묻는 변형 케이스

**Q. 우리 팀은 Redmine 대신 Jira를 씁니다.**

→ `issue-new` / `commit-push` / `issue-update` 의 Redmine API 호출 부분만 Jira API로 교체합니다. 흐름(임시 일감 → 작업 → 정식 제목 갱신)은 그대로 유지하면 됩니다.

**Q. Google Sheets 대신 Notion / Airtable 을 쓰고 싶습니다.**

→ `session-log` / `share-rules` / `analyze-report` 의 데이터 저장 레이어만 교체합니다. 컬럼 구조(날짜·이름·프로젝트·내용·분석여부)는 어느 도구든 유지합니다.

**Q. Slack 알림 훅이 필요 없습니다.**

→ `.claude/settings.local.json` 에 `SLACK_NOTIFY_ENABLED: false` 추가하거나, `.claude/settings.json` 에서 해당 훅 등록을 제거합니다.

**Q. CONTEXT 템플릿이 우리 프로젝트에 안 맞습니다.**

→ `template/CLAUDE-TEMPLATE.md` 의 공통 동작 규칙은 유지하되, 프로젝트별 CONTEXT 파일(`template/CLAUDE-TEMPLATE-{project}.md`)을 새로 만들어 등록합니다.

### 변형 시 지켜야 할 것

이것만 깨지지 않으면 어떻게 바꾸든 사이클은 돕니다.

- **공유 vs 개인의 분리** — 팀 공유(`CLAUDE.md`)와 개인 설정(`CLAUDE.local.md`)을 섞지 않는다
- **데이터의 단방향 흐름** — 수집(개인) → 분석(자동) → 반영(검토 후 공유)
- **개선 결과는 검토 없이 자동 커밋하지 않는다** — 분석은 자동, 반영은 사람이 결정한다
- **시크릿은 `settings.local.json`에만** — 어떤 경우에도 git에 들어가지 않는다

### 도움이 되는 관련 문서

| 문서 | 용도 |
|------|------|
| [기초 가이드](./01_claude-code_기초.md) | Claude Code 자체 사용법 |
| [심화 가이드](./02_claude-code_심화.md) | Plan Mode·메모리·Skills·Plugin 등 |
| [`.claude/guides/skills.md`](../.claude/guides/skills.md) | 각 스킬의 상세 동작·컬럼 매핑 |
| [`.claude/guides/hooks.md`](../.claude/guides/hooks.md) | 훅 설정·환경변수 |
| [`.claude/guides/google-sheets-setup.md`](../.claude/guides/google-sheets-setup.md) | Google Sheets 연동 |
| [`.claude/rules/rule-writing-policy.md`](../.claude/rules/rule-writing-policy.md) | RULE_MODE 동작 |

---

## 마무리

이 템플릿의 가치는 **사이클이 도는 동안에만** 유지됩니다. 도구는 바뀌어도, 흐름은 멈추지 않게 운영하는 게 핵심입니다.

- 한 번이라도 `/session-log` 를 써본 사람이 있으면 — **수집 단계가 살아 있다**
- `/analyze-report` 보고서가 한 번이라도 만들어졌으면 — **분석 단계가 살아 있다**
- `/apply-report` 로 한 줄이라도 규칙이 바뀌면 — **개선 단계가 살아 있다**

세 단계 중 하나라도 비어 있으면 사이클은 멈춥니다. 막히는 단계가 있으면 그 부분의 도구를 더 가볍게 만들거나, 아예 다른 도구로 바꾸는 게 옳은 방향입니다. **사이클을 살리는 게 도구를 지키는 것보다 중요합니다.**
