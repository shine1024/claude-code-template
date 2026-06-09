# claude-code-template

UniWorks·UniFlow 프로젝트에 Claude Code를 빠르게 적용하기 위한 **CLAUDE.md 템플릿 및 팀 공용 설정** 저장소입니다.

- **CLAUDE.md 템플릿**: 프로젝트별 특성이 반영된 완성된 템플릿을 제공하여 초기 설정 부담을 줄입니다.
- **팀 공용 설정 (hooks·rules·skills)**: 검증된 공통 설정을 단일 출처에서 관리하여 모든 프로젝트가 같은 환경 위에서 작업하도록 합니다.

---

## 시작하기

처음 접하는 분은 아래 순서로 읽으면 됩니다.

| 단계 | 문서 | 대상 |
|------|------|------|
| 1 | [Claude Code 기초 가이드](./basics/01_claude-code_기초.md) | Claude Code를 처음 쓰거나 한두 번 써본 사람 |
| 2 | [Claude Code 심화 가이드](./basics/02_claude-code_심화.md) | 기초 워크플로우가 익숙한 사람 |
| 3 | [claude-code-template 사용법](./basics/03_claude-code-template_사용법.md) | 이 템플릿을 팀 프로젝트에 도입하는 사람 |

> 이 리포의 적용 절차·일감 워크플로우·동기화·회고 사이클은 모두 **③ 사용법** 문서에 정리되어 있습니다.

---

## 빠른 색인

### 신규 프로젝트 적용

```cmd
init.bat <대상프로젝트경로>     # .claude/ 폴더 복사 + settings.local.json 생성
```

대상 프로젝트에서 `claude` 실행 후 `/init-claude-md` 로 `CLAUDE.md` 자동 생성.

> 상세: [③ 사용법 §3](./basics/03_claude-code-template_사용법.md#3-신규-프로젝트-적용)

### 일감·커밋 워크플로우

| 스킬 | 시점 |
|------|------|
| `/issue-new` | 작업 시작 — 임시 일감 + 작업 브랜치 |
| `/commit-push` | 작업 완료 — 커밋·푸시·일감 갱신 |
| `/issue-update` | 일감만 정식 제목으로 갱신 |

> 상세: [③ 사용법 §5](./basics/03_claude-code-template_사용법.md#5-부가-기능)

### 템플릿 동기화

```
/sync-template      # 최신 .claude/ 설정을 현재 프로젝트로 끌어오기
```

> 상세: [③ 사용법 §5](./basics/03_claude-code-template_사용법.md#5-부가-기능)

### 회고·개선 사이클

```
/session-log     →  /share-rules  →  /analyze-report  →  /apply-report
세션 회고          개인 규칙 공유      패턴 분석             규칙 반영
```

> 상세: [③ 사용법 §4](./basics/03_claude-code-template_사용법.md#4-반복-사이클)

### 응답 뷰어 (claude-viewer)

Claude 응답을 콘솔 대신 브라우저에서 책 페이지 UI로 봅니다. 포트는 프로젝트 경로 해시로 고정 산출되어(20000–29999) 프로젝트 간 충돌하지 않으며, 정확한 주소(`http://127.0.0.1:<포트>/response.html`)는 응답 직후 콘솔에 출력됩니다. 기본은 비활성(opt-in)이며, `.claude/settings.local.json` 의 `env` 에 `"CLAUDE_VIEWER_ENABLED": "true"` 를 추가하면 `UserPromptSubmit`·`PostToolUse`·`Stop` 훅이 동작합니다. 여러 Claude Code 세션을 동시에 띄워도 탭 UI 로 세션별 응답이 분리됩니다.

> 상세: [③ 사용법 §5](./basics/03_claude-code-template_사용법.md#5-부가-기능)

---

## 디렉토리

```
claude-code-template/
├── basics/                  ← 교육 자료 (① 기초, ② 심화, ③ 사용법)
├── template/                ← 프로젝트별 CLAUDE.md 템플릿 (CLAUDE-TEMPLATE-*.md)
├── init.bat                 ← 신규 프로젝트 초기화 스크립트 (Windows)
├── CLAUDE.md                ← 이 리포 자체의 프로젝트 지침
├── CHANGES.md               ← 변경 이력
├── tests/                   ← 통합 테스트 (사전 검증용)
└── .claude/
    ├── guides/              ← 기능별 상세 가이드 (hooks·skills·google-sheets-setup)
    ├── rules/               ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/              ← 슬래시 커맨드 정의
    ├── hooks/               ← 이벤트 훅 스크립트
    ├── viewer/              ← claude-viewer 정적 페이지 (브라우저 응답 뷰어)
    └── state/               ← 동기화 상태 (SYNC_HASH 등)
```

---

## 참고 문서

| 주제 | 위치 |
|------|------|
| 훅 설정·환경변수 | [`.claude/guides/hooks.md`](.claude/guides/hooks.md) |
| 스킬 상세 동작·컬럼 매핑 | [`.claude/guides/skills.md`](.claude/guides/skills.md) |
| Google Sheets 연동 | [`.claude/guides/google-sheets-setup.md`](.claude/guides/google-sheets-setup.md) |
| RULE_MODE 동작 기준 | [`.claude/rules/rule-writing-policy.md`](.claude/rules/rule-writing-policy.md) |
