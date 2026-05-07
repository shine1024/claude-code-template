# Claude Code 심화 가이드

> [기초 가이드](./01_claude-code_기초.md)를 마친 개발자를 위한 심화 활용법.  
> Plan Mode·메모리·Skills·Plugin·Subagent·비용·MCP 등 운영 단계의 도구를 다룹니다.  
> 참고: [code.claude.com/docs](https://code.claude.com/docs)
>
> **성장 사다리에서 3~7단계 + 10단계** 영역을 다룹니다 — 사다리 전체 그림은 [기초 §11 성장 경로](./01_claude-code_기초.md#11-성장-경로) 참고.

---

## 목차

1. [Plan Mode 심화 활용](#1-plan-mode-심화-활용)
2. [프로젝트 지침과 규칙 관리 (CLAUDE.md · rules · 자동 메모리)](#2-프로젝트-지침과-규칙-관리-claudemd--rules--자동-메모리)
3. [settings.json 완전 가이드](#3-settingsjson-완전-가이드)
4. [Skills 완전 가이드](#4-skills-완전-가이드)
5. [Plugin 활용](#5-plugin-활용)
6. [병렬 작업 패턴 (Subagent · Worktree)](#6-병렬-작업-패턴-subagent--worktree)
7. [비용 & 토큰 관리](#7-비용--토큰-관리)
8. [MCP 서버 연결](#8-mcp-서버-연결)
9. [치트시트 (단축키·문법·실패 패턴)](#9-치트시트-단축키문법실패-패턴)
10. [실습: 35분 심화 실습](#10-실습-35분-심화-실습)

---

## 1. Plan Mode 심화 활용

### Plan Mode란?

Claude가 파일을 수정하지 않고 분석과 계획만 수행하는 **읽기 전용 모드**입니다.

**전환 방법:** `Shift+Tab` 반복 → `⏸ plan mode on` 표시될 때까지

### 4단계 권장 워크플로우

```
1️⃣ 탐색 (Plan Mode)
   → "이 기능에 영향을 주는 파일들을 분석해줘."

2️⃣ 계획 (Plan Mode)
   → "개선 구현 계획을 작성해줘."
   → Ctrl+G 로 계획을 편집기에서 열고 검토/수정

3️⃣ 구현 (Normal Mode로 전환)
   → "계획대로 구현해줘."

4️⃣ 커밋
   → "refs #1234 형식으로 커밋해줘."
```

> 오타 수정, 로그 추가 등 단건 수정은 Plan Mode 없이 바로 진행합니다.

### opusplan 모델 전략 (권장)

`opusplan`은 **계획에는 Opus, 실행에는 Sonnet**을 자동 전환하는 하이브리드 모드입니다.

```bash
# 세션 시작 시 설정
claude --model opusplan

# 또는 settings.json에서 기본값으로 설정
{ "model": "opusplan" }
```

| 단계 | 사용 모델 | 특징 |
|------|-----------|------|
| Plan Mode (계획/분석) | **Opus 4.7** | 복잡한 추론, 아키텍처 결정 |
| Normal Mode (코드 작성) | **Sonnet 4.6** | 빠른 구현, 효율적 |

### 모델 별칭 및 노력 수준

**모델 별칭:**

| 별칭 | 모델 | 용도 |
|------|------|------|
| `opus` | claude-opus-4-7 | 가장 강력 (복잡한 추론) |
| `sonnet` | claude-sonnet-4-6 | 일반 코딩 작업 (권장) |
| `haiku` | claude-haiku-4-5 | 빠르고 간단한 작업 |
| `opusplan` | Plan: Opus / 실행: Sonnet | 자동 전환 (권장) |

**노력 수준 조정:**

```bash
/effort low     # 간단한 작업 (빠르고 저렴)
/effort medium  # 일반 코딩
/effort high    # 복잡한 디버깅, 아키텍처 설계
/effort xhigh   # Opus 4.7 권장 기본값 (대부분의 코딩 작업)
/effort max     # 최고 깊이 (현재 세션에만 적용)
```

> 모델별 지원 레벨: Opus 4.7 = `low`/`medium`/`high`/`xhigh`/`max`, Opus 4.6·Sonnet 4.6 = `low`/`medium`/`high`/`max`. `low`~`xhigh`는 세션 간 유지되고 `max`는 현재 세션에만 적용됩니다.

**일회성 깊은 추론:** 프롬프트에 `ultrathink` 포함
```
"이 성능 문제의 근본 원인을 ultrathink로 분석해줘."
```

---

## 2. 프로젝트 지침과 규칙 관리 (CLAUDE.md · rules · 자동 메모리)

### CLAUDE.md 고급 작성법

**포함할 내용 vs 제외할 내용:**

| 포함 | 제외 |
|------|------|
| 빌드/실행 명령 | 코드를 읽으면 알 수 있는 내용 |
| 외부 연동 주의사항 | 자명한 관행 |
| 아키텍처 핵심 규칙 | 자주 변경되는 정보 |
| 커밋 메시지 규칙 | 표준 언어 규칙 |
| 코드 컨벤션 요약 | 상세한 외부 API 문서 |

**실무 예시:**

```markdown
## 빌드 및 실행
- 빌드: `./gradlew build`
- 서버 실행: `./gradlew bootRun`
- 테스트: `./gradlew test`

## 코딩 규칙
- 외부 API 호출 결과는 반드시 DTO로 받아 변환 후 사용
- DB 트랜잭션: 서비스 레이어에서만 @Transactional 선언
- 예외는 커스텀 예외 클래스로 래핑 (RuntimeException 직접 사용 금지)
- 커밋 메시지: `refs #이슈번호 [모듈명] - [변경 내용]`

## 주의사항
- .env.production 파일 절대 수정 금지
- 외부 API 응답 파싱 시 null 체크 필수
- 페이징 처리는 항상 PageRequest 사용
```

### `.claude/rules/` 규칙 파일 구성

대형 프로젝트에서 CLAUDE.md를 주제별로 분리:

```
project/
├── CLAUDE.md              # 주 프로젝트 지침 (간결하게, 200줄 이하)
└── .claude/
    └── rules/
        ├── frontend.md    # 프론트엔드 규칙
        ├── backend.md     # 백엔드 규칙
        └── security.md    # 보안 요구사항
```

**경로별 규칙** (특정 파일에만 적용):

```markdown
---
paths:
  - "src/main/java/com/example/**/*.java"
---

# 서비스 개발 규칙
- 서비스 클래스는 인터페이스 구현 필수
- 트랜잭션 처리는 @Transactional 사용
- 예외는 커스텀 예외 클래스로 래핑
```

### 자동 메모리 시스템

Claude Code 는 세션 중 학습한 내용을 사용자별 로컬 폴더(`~/.claude/projects/<project>/memory/`, Windows는 `C:\Users\<사용자명>\.claude\...`)에 자동 저장합니다. `/memory` 로 확인하고 자연어로 저장 요청할 수 있습니다 (예: `"페이징은 항상 PageRequest 사용한다는 걸 기억해줘"`).

> **팀 공유 안 됨 · 본인 세션 한정** — 실무 비중은 낮습니다. 팀 공유가 필요한 규칙은 `CLAUDE.md` 또는 `.claude/rules/*.md` 에 두고, 자동 메모리는 본인 작업 패턴을 누적하는 개인 노트로 생각하면 됩니다.

---

## 3. settings.json 완전 가이드

### 설정 파일 위치와 우선순위

설정 파일은 네 단계로 나뉩니다. 같은 키가 여러 단계에 정의되어 있으면 **위쪽(우선순위 높음)이 이깁니다.**

| 단계 | 정확한 위치 | 적용 범위 | Git |
|---|---|---|---|
| **Managed** | Win: `C:\ProgramData\ClaudeCode\managed-settings.json`<br>macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`<br>Linux: `/etc/claude-code/managed-settings.json` | 회사 IT 관리자가 MDM·GPO 등으로 일괄 배포하는 강제 정책. 일반 개발자는 신경 쓸 필요 없음 | — |
| **Local** | 프로젝트 루트의 `.claude/settings.local.json` | 본인 + 해당 프로젝트만 | gitignored |
| **Project** | 프로젝트 루트의 `.claude/settings.json` | 팀 공유 | 커밋 권장 |
| **User** | Win: `C:\Users\<사용자명>\.claude\settings.json`<br>macOS·Linux: `~/.claude/settings.json` | 본인의 모든 프로젝트 | 개인 |

> 예시: `Project` 에 `model: opus` 가 있어도 `Local` 에 `model: sonnet` 이 있으면 Sonnet 이 적용됩니다. 본인 환경에서만 다르게 쓰고 싶을 때 `Local` 을 활용하면 팀 설정을 안 깨고 재정의할 수 있습니다.

### 기본 구조

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "opusplan",
  "effortLevel": "medium",
  "permissions": {
    "allow": [],
    "deny": []
  },
  "hooks": {},
  "env": {}
}
```

> VS Code에서 `$schema`를 추가하면 자동완성 및 인라인 검증이 활성화됩니다.

### 권한 관리

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",             // Git 작업 허용
      "Bash(./gradlew:*)",       // Gradle 빌드 허용
      "Bash(npm:*)"              // npm 명령 허용
    ],
    "deny": [
      "Bash(rm -rf:*)",          // 위험한 삭제 차단
      "Read(./.env.production)"  // 운영 환경 파일 접근 차단
    ]
  }
}
```

**Auto Mode** (승인 프롬프트 최소화):
```json
{
  "permissions": {
    "defaultMode": "auto"
  }
}
```

### Hooks 설정

Hooks는 Claude의 작업 특정 시점에 셸 명령을 자동 실행합니다. 작업 완료 알림이 가장 흔한 사용 예시입니다.

**Windows (PowerShell 비프음)**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"[console]::beep(800,200)\""
          }
        ]
      }
    ]
  }
}
```

**macOS (알림 센터)**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"작업 완료\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

**주요 Hook 이벤트:**

| 이벤트 | 발생 시점 |
|--------|-----------|
| `UserPromptSubmit` | 사용자가 프롬프트를 제출할 때 |
| `Stop` | Claude 응답이 완료될 때 |
| `PostToolUse` | 도구 사용 후 |
| `PreToolUse` | 도구 사용 전 |
| `Notification` | Claude가 입력 대기할 때 |
| `InstructionsLoaded` | 지침 파일 로드 시 |

> 전체 이벤트 목록·입력 스키마·종료 코드 규칙은 공식 문서를 참고하세요.
> - 가이드: <https://docs.claude.com/en/docs/claude-code/hooks-guide>
> - 레퍼런스: <https://docs.claude.com/en/docs/claude-code/hooks>

```bash
/hooks    # 설정된 hooks 확인
```

### 환경 변수 관리

```json
{
  "env": {
    "NODE_ENV": "development",
    "JAVA_OPTS": "-Xmx2g"
  }
}
```

### `.claude/settings.json` 실무 예시

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "opusplan",
  "effortLevel": "medium",
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(./gradlew:*)",
      "Bash(npm:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Read(./.env.production)",
      "Read(./config/prod.*)"
    ]
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"[console]::beep(800,200)\""
          }
        ]
      }
    ]
  },
  "env": {
    "JAVA_OPTS": "-Xmx2g"
  }
}
```

> macOS 환경에서는 `command` 부분을 `osascript -e 'display notification "작업 완료" with title "Claude Code"'` 로 교체합니다.

### Claude Code 가 인식하는 `.claude/` 구조

`.claude/` 폴더 안에 특정 이름·구조의 파일이 있으면 Claude Code 가 **자동으로 인식**해 동작합니다. 이 구조에서 벗어난 파일은 그냥 일반 파일로 취급됩니다.

| 위치 | 인식 결과 |
|---|---|
| `.claude/settings.json` / `settings.local.json` | 권한·모델·훅·환경변수 등 설정 |
| `.claude/skills/<이름>/SKILL.md` | `/<이름>` 슬래시 커맨드로 등록 |
| `.claude/agents/<이름>.md` | Subagent 로 등록 (병렬 작업 위임 가능) |
| `.claude/output-styles/<이름>.md` | 응답 출력 스타일 |

**사용자 전역 버전**도 같은 구조입니다. `~/.claude/skills/...`, `~/.claude/agents/...` 처럼 본인 홈 폴더에 두면 모든 프로젝트에서 사용 가능합니다 (Windows: `C:\Users\<사용자명>\.claude\...`).

> 위 표 외에 `.claude/` 안에 있는 다른 폴더(예: `rules/`, `guides/`, `state/`)는 Claude Code 자체가 자동 인식하지 않습니다. 팀이나 템플릿이 자체 관습으로 사용하는 것이며, 자동 로드가 필요하면 `CLAUDE.md` 에서 명시 참조하거나 훅으로 등록해야 합니다.

---

## 4. Skills 완전 가이드

### Skills란?

Skills는 Claude의 **재사용 가능한 워크플로우**입니다. 반복되는 작업을 Skill로 만들어두면 `/skill-name`으로 호출하거나, 관련 대화 시 자동으로 로드됩니다.

```
Skills = 팀 전용 작업 레시피 + 자동화 워크플로우
```

### Skill 등록 구조

모든 Skill은 `.claude/skills/` 하위에 **폴더명 = 커맨드명** 으로 등록합니다.

```
.claude/skills/
└── <스킬명>/           ← 폴더명이 슬래시 커맨드명 (/스킬명)
    ├── SKILL.md        ← 필수: 스킬 실행 지침
    ├── template.md     ← 선택: Claude가 채울 템플릿
    ├── examples/       ← 선택: 예시 파일
    └── scripts/        ← 선택: 실행 스크립트
```

> `SKILL.md` 파일 하나만 있으면 `/스킬명`으로 즉시 호출 가능합니다.

### SKILL.md 작성법

SKILL.md는 **본문만으로도 동작**합니다. frontmatter는 선택 사항입니다.

**기본형 (frontmatter 없음):**

```markdown
수행할 작업 지침을 자유롭게 작성합니다.
$ARGUMENTS 로 인수를 받을 수 있습니다.
```

**확장형 (frontmatter 있음):**

```markdown
---
name: 스킬명
description: 스킬 설명. "관련 키워드" 언급 시 자동 활성화.
allowed-tools: Read Grep Glob Bash
---

$ARGUMENTS 를 받아서 수행할 작업 지침...
```

**frontmatter 항목:**

| 항목 | 설명 | 생략 시 |
|------|------|---------|
| `name` | 슬래시 커맨드명 (폴더명과 일치) | 폴더명으로 인식 |
| `description` | 자동 트리거 조건 — 관련 대화 시 Claude가 자동으로 로드 | 자동 트리거 없음 |
| `allowed-tools` | 이 Skill이 사용할 수 있는 도구 목록 | 모든 도구 허용 |
| `$ARGUMENTS` | `/스킬명 <인수>` 로 전달된 값 | — |

**frontmatter가 필요한 경우:**

| 상황 | 필요한 항목 |
|------|------------|
| 특정 키워드 언급 시 자동으로 로드되길 원할 때 | `description` |
| 읽기 전용 Skill에서 실수로 파일이 수정되는 것을 방지할 때 | `allowed-tools` |

> `/init-claude-md`, `/session-log` 처럼 명시적으로 호출하는 Skill은 frontmatter 없이도 완전히 정상 동작합니다.

**`allowed-tools` 선택 기준:**

| 도구 | 언제 포함하나 |
|------|-------------|
| `Read` | 파일 내용을 읽어야 할 때 |
| `Grep` | 코드베이스에서 패턴 검색이 필요할 때 |
| `Glob` | 파일 목록을 탐색해야 할 때 |
| `Bash` | 빌드·테스트 실행 등 셸 명령이 필요할 때 |
| `Edit` / `Write` | 파일을 생성하거나 수정해야 할 때 |

### 직접 작성 예시

```markdown
---
name: api-review
description: REST API 컨트롤러 코드 리뷰. "API 리뷰", "컨트롤러 리뷰" 언급 시 활성화.
allowed-tools: Read Grep Glob
---

$ARGUMENTS 파일(또는 최근 수정된 컨트롤러 파일)을 리뷰하세요.

1. HTTP 메서드 및 URL 패턴 적절성 확인
2. 요청/응답 DTO 사용 여부 확인
3. 입력값 검증(@Valid 등) 여부 확인
4. 에러 처리 누락 여부 확인
5. 문제 발견 시 파일명:라인번호 포함하여 리포트
```

**호출:**
```
/api-review src/main/java/com/example/controller/OrderController.java
```

### skill-creator로 Skills 만들기

직접 작성 대신 `/skill-creator` 플러그인으로 대화형 자동 생성도 가능합니다.

```
/skill-creator

서비스 레이어 코드를 리뷰하는 Skill.
체크 항목:
- 인터페이스 구현 여부
- 트랜잭션 처리 적절성
- 예외 처리 누락 여부
- 입력값 검증 여부
```

> 요구사항을 텍스트로 설명하면 SKILL.md 파일을 자동으로 생성해 줍니다.

### Plugin이 제공하는 Skills

`/loop`, `/simplify`, `/review`, `/batch` 등은 Plugin 설치 시 추가되는 Skills입니다.  
기본 설치 상태에서는 제공되지 않으며, Plugin 설치 후 사용 가능합니다. (→ [5. Plugin 활용](#5-plugin-활용) 참고)

---

## 5. Plugin 활용

### Plugin이란?

Plugin은 Skills · Agents · Hooks · MCP 서버 등을 하나의 단위로 묶어서 설치·공유할 수 있는 패키지입니다.

```
Plugin = Skills + Agents + Hooks + MCP 서버 → 한 번에 설치
```

설치된 Plugin의 Skill은 `/<plugin이름>:<skill이름>` 형태로 namespace가 붙어 호출됩니다.

### Plugin 설치

Anthropic 공식 마켓플레이스(`claude-plugins-official`)는 Claude Code 시작 시 **자동으로 등록**되어 있습니다.

```bash
/plugin                                    # Discover 탭에서 마켓플레이스 탐색
/plugin install <이름>@claude-plugins-official   # 공식 마켓플레이스 플러그인 설치
/reload-plugins                            # 설치 후 적용
```

> 외부(파트너·커뮤니티) 플러그인은 별도 마켓플레이스를 추가해야 합니다. 설치 전 출처를 반드시 확인하세요 — Anthropic은 외부 플러그인의 동작을 검증하지 않습니다.

### 공식 마켓플레이스 주요 플러그인

`claude-plugins-official` 에서 제공하는 일반 개발자용 플러그인 일부:

| Plugin | 제공 기능 |
|---|---|
| `claude-code-setup` | 코드베이스를 분석해 적합한 hooks·skills·MCP·subagent 추천 |
| `code-review` | 여러 전문 agent로 PR 자동 코드 리뷰 (false positive 필터링 포함) |
| `code-simplifier` | 동작 보존하며 가독성·일관성 개선 |
| `claude-md-management` | CLAUDE.md 품질 감사·세션 학습 반영·최신 상태 유지 |
| `commit-commands` | 커밋·푸시·PR 생성 워크플로우 |
| `feature-dev` | 탐색 → 설계 → 품질 검토까지 기능 개발 워크플로우 |
| `hookify` | 자주 발생하는 패턴을 hook 으로 자동 변환 |

### LSP 플러그인 (코드 인텔리전스)

언어별 LSP(Language Server Protocol) 플러그인을 설치하면 Claude가 **정의로 이동·참조 찾기·편집 후 즉시 타입 오류 감지** 능력을 갖습니다.

공식 마켓플레이스 제공: `gopls-lsp`(Go) · `clangd-lsp`(C/C++) · `csharp-lsp`(C#) · `jdtls-lsp`(Java)

```bash
/plugin install jdtls-lsp@claude-plugins-official
```

> 사용자 머신에 해당 언어 서버 바이너리가 설치되어 있어야 합니다.

---

## 6. 병렬 작업 패턴 (Subagent · Worktree)

여러 작업을 동시에 진행하는 두 가지 패턴이 있습니다. 같은 "병렬"이지만 운영 방식이 완전히 다르므로 작업 성격에 따라 골라 씁니다.

### 한눈에 비교

| 구분 | 사람이 운전 | 결과 확인 | 적합한 작업 |
|---|---|---|---|
| **Subagent** | 메인 세션이 자동 분배 | 메인의 요약·종합 보고만 본다 | 결과만 받으면 되는 read-only 위임 |
| **Worktree** | 사람이 각 세션 직접 | 각 세션의 출력·diff를 직접 본다 | 실제 코드 변경·커밋이 필요한 병렬 작업 |

판단 한 줄 요약: **"직접 검토·커밋할 거면 worktree, 결과만 받으면 되는 위임이면 Subagent"**.

---

### Subagent

Subagent는 **메인 세션이 내부에서 띄우는 임시 워커**입니다. 사용자는 메인 세션 하나하고만 대화하고, Claude가 알아서 워커를 분기시켜 결과만 가져옵니다. 각 워커는 격리된 컨텍스트를 갖고, 워커끼리 직접 대화하지는 못합니다.

**직접 호출이 의미 있는 케이스**

사용자가 의식적으로 Subagent를 부를 일은 많지 않습니다 — 보통 Claude가 광범위 탐색에 알아서 사용합니다. 명시적으로 부를 가치가 있는 건 아래처럼 **읽어야 할 게 많고 결과 요약만 필요한** 경우입니다.

```
"subagent로 OrderService 가 호출되는 모든 위치를 찾아줘."
"subagent로 전체 서비스 클래스 목록과 각 역할을 조사해줘."
```

**주의사항**

- **즉각적인 개입 불가**: 진행 중에 방향 전환·추가 지시 어려움
- **결과 검증 필요**: 보고는 "의도"일 뿐 — 실제 변경은 별도로 확인
- **소규모 작업엔 비효율**: 위임 자체에도 토큰이 들어가므로 단순 작업은 직접이 더 빠름

---

### Worktree

`git worktree` 는 **같은 리포의 다른 브랜치를 별도 디렉토리에 동시 체크아웃**하는 git 표준 기능입니다. 각 worktree 에 별도 Claude Code 세션을 띄우면 서로 다른 기능을 동시에 진행할 수 있습니다.

**기본 사용법**

```bash
# 메인 리포에서 새 worktree + 브랜치 생성
git worktree add ../myproject-feat-a feat-a

# 새 폴더로 이동해 Claude Code 실행
cd ../myproject-feat-a
claude

# 작업 끝나면 PR 머지 후 worktree 정리
cd ../myproject
git worktree remove ../myproject-feat-a
```

**언제 유리한가**

- 두 PR을 동시에 진행해야 할 때 (메인 클론을 매번 stash·checkout 하는 비용 절약)
- 빌드·테스트가 오래 걸려 그 사이 다른 작업을 동시 진행하고 싶을 때
- 위험한 리팩토링을 별도 세션·디렉토리에 격리하고 싶을 때

**Claude Code 측면 동작**

- `.claude/settings.json` 등 git 추적 파일은 브랜치별로 자동 동기화
- `.claude/settings.local.json` · `reports/` 등 gitignore 대상은 worktree마다 별개 → 시크릿·로컬 캐시 격리
- 동일 프로젝트 CLAUDE.md 가 자동 로드되므로 규칙은 일관되게 적용

**주의사항**

- `node_modules` · `venv` 등 의존성은 worktree마다 따로 — 디스크 사용 큼
- IDE 인덱스도 worktree마다 따로 (JetBrains/VS Code 별도 창 필요)
- 같은 브랜치를 두 worktree 에 동시에 둘 수 없음
- 정리할 때 디렉토리만 삭제하지 말고 `git worktree remove` 로 메타데이터까지 정리

> 더 큰 규모(5~30개 단위)로 자동 분해·병렬 PR 까지 필요하면 번들 스킬 `/batch` 를 사용합니다.

---

## 7. 비용 & 토큰 관리

### 비용 구조 이해

Claude Code의 비용은 주로 **입력 토큰(컨텍스트)**에서 발생합니다.

```
비용 = (입력 토큰 + 출력 토큰) × 모델 단가
입력 토큰이 누적될수록 단위 작업당 비용이 증가
```

### 모델별 비용/성능 트레이드오프

| 모델 | 비용 | 적합한 작업 |
|------|------|-----------|
| `haiku` | 가장 낮음 | 간단한 탐색, 요약, 문서화 |
| `sonnet` | 중간 | 일반 코딩, 버그 수정 (기본값 권장) |
| `opus` | 가장 높음 | 복잡한 아키텍처, 난해한 버그 |
| `opusplan` | 중간~높음 | 계획은 Opus, 구현은 Sonnet 자동 전환 |

### 비용 최적화 전략

**1. 컨텍스트를 자주 정리하여 누적 비용 절감**
```bash
/compact        # 대화 압축 (중요 내용 유지)
/clear          # 새 작업 시작 시 초기화
```

**2. 광범위한 탐색은 Subagent에 위임**

Subagent는 독립적인 컨텍스트로 실행되므로 주 세션 토큰을 소모하지 않습니다:
```
"subagent로 전체 서비스 클래스 목록과 역할을 조사해줘."
```

**3. `@파일` 로 범위 명시**

모호한 요청보다 파일을 명시하면 불필요한 탐색을 줄입니다:
```
# 비효율 (Claude가 여러 파일을 탐색)
"주문 서비스 수정해줘."

# 효율 (범위 명확)
"@src/main/java/com/example/service/OrderService.java 이 파일의 placeOrder 메서드만 수정해줘."
```

> 노력 수준 조정(`/effort`)은 §1 [모델 별칭 및 노력 수준](#모델-별칭-및-노력-수준) 참고.

### 세션 전략

| 상황 | 권장 전략 |
|------|---------|
| 새로운 버그 | 새 세션 시작 |
| 같은 기능 연속 작업 | 세션 유지 |
| 관련 없는 다른 작업 | `/clear` 후 진행 |
| 컨텍스트가 길어짐 | `/compact` 후 계속 |
| 2번 연속 실패 | `/clear` + 더 나은 프롬프트 |

---

## 8. MCP 서버 연결

### MCP란?

MCP(Model Context Protocol)는 Claude를 **외부 도구·시스템과 표준 방식으로 연결하는 프로토콜**입니다. GitHub, Jira, Slack, DB 등 코드베이스 밖의 정보를 Claude가 직접 조회·조작할 수 있게 됩니다.

```
MCP 서버 = Claude가 사용할 수 있는 외부 도구 어댑터
```

### 언제 써야 하나

| 상황 | 권장 |
|------|------|
| 코드만 수정 | MCP 불필요 |
| **이슈 번호로 작업 컨텍스트가 필요** | Jira / Linear / Redmine MCP |
| **PR/이슈 상태를 조회·갱신** | GitHub MCP |
| **DB 스키마·실제 데이터 확인이 필요** | PostgreSQL / MySQL MCP |
| **브라우저 자동화·E2E 테스트** | Playwright MCP |
| **배포 후 팀 알림 자동화** | Slack MCP |

판단 한 줄 요약: **"코드 밖 시스템의 정보를 매번 사람이 옮기고 있다면"** → MCP로 연결.

### 장점

- **코드 외부 컨텍스트 활용**: 이슈·PR·DB 스키마를 보고 작업 가능 → 더 정확한 결과
- **반복 작업 자동화**: 이슈 상태 변경, 댓글 작성, 알림 등을 Claude가 직접 수행
- **표준 인터페이스**: 한 번 연결하면 어떤 작업에서도 동일하게 사용 가능

### 단점 / 주의사항

- **권한 관리 필수**: Slack 메시지 발송, 이슈 상태 변경, DB 쿼리 등은 영향 범위가 크므로 권한을 신중히 부여 (특히 운영 시스템)
- **민감 정보 노출 위험**: DB MCP 는 운영 DB에 직접 연결될 수 있음 → **read-only 계정** 사용 권장
- **컨텍스트 비용**: 활성화된 MCP 도구 정의는 매 요청마다 토큰을 소모 → 사용하지 않는 서버는 비활성화
- **외부 의존성**: 외부 서버 장애 시 MCP 호출이 실패 → 빌드/배포 같은 핵심 경로에는 의존하지 말 것
- **출처 검증**: 비공식 MCP 서버는 코드를 직접 확인하고 사용 (실행 권한이 곧 시스템 권한)

### 주요 MCP 서버

| 서버 | 활용 예시 |
|------|---------|
| **GitHub** | PR/이슈 조회, 코드 리뷰 자동화 |
| **Slack** | 배포 알림, 팀 공유 |
| **Jira / Linear** | 이슈 기반 컨텍스트 조회, 티켓 업데이트 |
| **Playwright** | 브라우저 자동화, E2E 테스트 |
| **PostgreSQL / MySQL** | DB 스키마 탐색, 쿼리 분석 |

### 설치

```bash
claude mcp add        # MCP 서버 추가 마법사
claude mcp list       # 등록된 서버 목록
claude mcp remove <이름>  # 서버 제거
```

### 활용 예시

**1) 이슈 기반 작업**
```
"PROJ-1234 이슈를 확인하고 관련 코드를 수정한 뒤
이슈를 In Progress 로 변경해줘."
```

**2) PR 우선순위 정리**
```
"현재 열린 PR 목록을 보여주고
리뷰 필요한 것을 우선순위로 정리해줘."
```

**3) DB 스키마 기반 쿼리 작성**
```
"orders 테이블 스키마를 확인하고
지난달 환불 비율을 구하는 쿼리를 작성해줘."
```

**4) 배포 알림 자동화**
```
"배포 완료되면 #deploy 채널에
변경 PR 목록과 함께 알림 보내줘."
```

---

## 9. 치트시트 (단축키·문법·실패 패턴)

### 컨텍스트 문법

| 문법 | 용도 | 예시 |
|------|------|------|
| `@파일경로` | 파일을 컨텍스트에 포함 | `@src/OrderService.java` |
| `@폴더경로` | 폴더 전체 포함 | `@src/main/java/com/example/` |
| `Ctrl+V` | 이미지/스크린샷 붙여넣기 | UI 레이아웃 참조 |

### 유용한 고급 슬래시 명령어

```bash
/config          # 설정 UI 열기
/permissions     # 권한 설정 확인
/agents          # Subagent 관리
/btw             # 사이드 질문 (히스토리에 포함 안 됨)
/plugin          # 플러그인 관리
/hooks           # Hooks 설정 확인
/memory          # CLAUDE.md / 자동 메모리 관리
/rename          # 현재 세션 이름 지정
```

### 일반적인 실패 패턴과 해결책

| 패턴 | 문제 | 해결책 |
|------|------|--------|
| 주방 싱크 세션 | 관련 없는 작업으로 컨텍스트 오염 | 작업 간 `/clear` 실행 |
| 반복적 수정 | 실패한 접근 방식 누적 | 2번 실패 후 `/clear` + 더 나은 초기 프롬프트 |
| 과도한 CLAUDE.md | 중요한 규칙이 노이즈에 묻힘 | 무자비하게 정리, 200줄 이하 유지 |
| 무한 탐색 | 수백 개 파일 읽어 컨텍스트 낭비 | 탐색은 범위 지정 또는 Subagent 위임 |

### 키보드 단축키 전체

| 단축키 | 동작 |
|--------|------|
| `Shift+Tab` | 권한 모드 순환 (default → acceptEdits → plan …) |
| `Ctrl+C` | 현재 입력/생성 취소 |
| `Esc+Esc` | Rewind / 요약 메뉴 열기 |
| `Ctrl+G` | 프롬프트/응답을 외부 편집기로 열기 |
| `Ctrl+O` | Transcript 뷰어 토글 (도구 호출 상세 보기) |
| `Alt+T` (Windows/Linux) · `Option+T` (macOS) | 확장 사고(extended thinking) 켜기/끄기 |
| `Alt+P` (Windows/Linux) · `Option+P` (macOS) | 모델 전환 |
| `↑` / `↓` | 명령 히스토리 |
| `Tab` | 명령 자동완성 |
| `?` | 사용 가능한 단축키 목록 |

---

## 10. 실습: 35분 심화 실습

기초 가이드의 `todo-practice` 폴더를 이어서 사용합니다 (없으면 어떤 작은 프로젝트든 무방합니다). 본인의 실제 프로젝트는 건드리지 않습니다.

> **실습 과제**: 규칙을 모듈화하고 → 위험 명령을 차단하고 → 첫 커스텀 Skill을 만들어 리뷰를 자동화하고 → 작업 완료 시 알림이 오게 합니다. 시나리오는 독립적이라 시간이 부족하면 1·2번만 해도 됩니다.

### 0. 준비 (1분)

```bash
cd todo-practice    # 기초 실습 폴더, 없으면 새로 만듭니다
claude              # 세션 시작
```

`.claude/` 폴더와 `.claude/settings.json` 이 없으면 이 실습 과정에서 생성됩니다.

---

### 시나리오 1. 규칙 분리 + 권한 차단 (10분, §2·§3)

**(1) `CLAUDE.md` → `.claude/rules/` 로 규칙 모듈화 (5분)**

기초에서 추가한 `## 프로젝트 규칙` 섹션을 별도 파일로 옮겨 분리해 봅니다.

```
@CLAUDE.md
이 파일에서 "프로젝트 규칙" 섹션을 .claude/rules/coding.md 로 옮겨줘.
CLAUDE.md 에는 옮겼다는 한 줄 안내만 남기고.
```

결과 확인:
- `.claude/rules/coding.md` 가 새로 생성됐는지
- `CLAUDE.md` 에는 본문이 빠지고 참조만 남았는지

> 큰 프로젝트일수록 CLAUDE.md 는 200줄을 넘지 않게 유지하고, 관심사별 규칙은 `.claude/rules/*.md` 로 분리하는 것이 일반적입니다.

**(2) `settings.json` 으로 위험 명령 차단 (5분)**

`.claude/settings.json` 을 직접 만들거나 Claude에게 만들게 합니다.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Bash(rm -rf:*)"
    ]
  }
}
```

차단 동작 확인 — Claude에게 시켜봅니다.

```
.claude/temp 폴더를 rm -rf 로 지워줘.
```

`deny` 룰에 의해 거부되거나 사용자 승인을 요구해야 합니다. 동작이 확인되면 즉시 요청을 취소합니다.

> 운영 중인 프로젝트라면 `Bash(git push --force:*)`, `Read(./.env*)` 등 자주 다치는 패턴을 추가합니다.

---

### 시나리오 2. 첫 커스텀 Skill 만들기 (15분, §4)

자주 하는 코드 리뷰를 `/todo-review` 슬래시 커맨드로 만듭니다.

**(1) Skill 폴더·파일 생성 (3분)**

```bash
mkdir -p .claude/skills/todo-review
```

`.claude/skills/todo-review/SKILL.md` 를 다음 내용으로 작성:

```markdown
---
name: todo-review
description: TODO 앱 코드를 리뷰. "리뷰", "todo-review" 언급 시 활성화.
allowed-tools: Read Grep
---

$ARGUMENTS 파일을 다음 관점으로 리뷰하세요.

1. localStorage 키가 하드코딩으로 흩어져 있는지 — 한 곳에 상수로 모이는 것이 좋음
2. 이벤트 리스너가 중복 등록될 여지가 있는지
3. `innerHTML` 사용으로 XSS 위험이 있는 부분
4. 한 함수가 두 가지 이상 일을 하는지

각 문제는 `파일명:라인번호 — 설명` 형식으로 보고하세요.
문제가 없으면 "통과" 한 줄만 출력하세요.
```

**(2) Skill 호출 (2분)**

세션 입력에 직접 입력합니다.

```
/todo-review app.js
```

Claude가 `app.js` 를 읽고 위 4개 항목으로 보고합니다.

**(3) 자동 트리거 확인 (5분)**

`description` 에 트리거 키워드를 넣었기 때문에, 슬래시 명령 없이도 활성화되는지 시험합니다.

```
app.js 좀 리뷰해줘.
```

Claude가 자동으로 todo-review 스킬을 사용해 보고하면 OK.

**(4) Skill 보강 (5분)**

리뷰 결과를 보고 본인이 빠뜨리고 싶지 않은 항목 한 가지를 직접 추가합니다 (예: "함수 30줄 초과 여부", "매직 넘버 사용 여부"). 다시 호출해 추가한 항목이 보고에 반영됐는지 확인합니다.

> 추가하지 못해도 됩니다 — 핵심은 **본인이 SKILL.md 를 한 번이라도 직접 손봤다**는 흔적입니다.

---

### 시나리오 3. Stop Hook 으로 작업 완료 알림 (10분, §3 hooks)

긴 작업이 끝났을 때 알림을 받게 만듭니다.

`.claude/settings.json` 에 `hooks.Stop` 항목을 추가합니다.

**Windows (PowerShell 비프음):**

```json
{
  "permissions": {
    "deny": ["Bash(rm -rf:*)"]
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"[console]::beep(800,200)\""
          }
        ]
      }
    ]
  }
}
```

**macOS (알림 센터):**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"작업 완료\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

**동작 확인:**

세션을 한 번 재시작합니다 (`/exit` → `claude` 다시 실행 — 설정 파일 변경은 새 세션부터 안전하게 적용).

```
README.md 한 줄 요약해줘.
```

응답이 끝나면 비프음(Win) 또는 알림(macOS)이 와야 합니다. 확인 후 등록된 훅을 점검합니다.

```
/hooks
```

> 알림이 거슬리면 일부 이벤트에만 적용되도록 `matcher` 를 좁히거나 훅을 잠시 제거합니다. 훅 종료 코드·차단 동작 등 자세한 규칙은 §3에서 링크한 [공식 가이드](https://docs.claude.com/en/docs/claude-code/hooks-guide)를 참고합니다.

---

### 실습 후 점검표

```
□ CLAUDE.md 의 일부 규칙을 .claude/rules/coding.md 로 분리해봤다
□ .claude/settings.json 으로 위험 명령(rm -rf 등) 차단을 확인했다
□ .claude/skills/<이름>/SKILL.md 를 직접 작성하고 슬래시 커맨드로 호출했다
□ description 트리거로 자동 활성화도 시험했다
□ Stop Hook 으로 알림이 울리는 것을 확인했다
```

다섯 개 중 세 개 이상 체크되면 심화 단계 입문은 충분합니다. Plugin 설치(§5)·MCP 서버 연결(§8)은 본인 프로젝트 컨텍스트에서 필요해질 때 적용합니다.

---

*이 문서는 [Claude Code 공식 문서](https://code.claude.com/docs)를 기반으로 작성되었습니다.*
