# claude-code-template

UniWorks·UniFlow 프로젝트에 Claude Code를 빠르게 적용하기 위한 **CLAUDE.md 템플릿 및 팀 공용 설정** 저장소입니다.

- **CLAUDE.md 템플릿**: 프로젝트별 특성이 반영된 완성된 템플릿을 제공하여 초기 설정 부담을 줄입니다.
- **팀 공용 설정 (hooks·rules·skills)**: 시범운영 기간 동안 안정화된 기능을 지속적으로 검증·개선하여 각 프로젝트에 배포합니다.

---

## 1. 프로젝트 CLAUDE.md 생성 가이드

Claude Code가 프로젝트에 맞는 코드를 생성하려면 **프로젝트 컨텍스트를 사전에 정의**해야 합니다.  
이를 위해 프로젝트 루트에 `CLAUDE.md` 파일을 작성합니다.

### 적용 절차

1. `claude-code-template` 프로젝트에서 `init.bat <프로젝트경로>` 를 실행한다 — `.claude/` 폴더 복사 및 `settings.local.json` 생성
2. 대상 프로젝트에서 `/init-claude-md` 를 실행한다 — `CLAUDE.md` 생성 (`.claude/template/` 자동 참조)
3. 생성된 `CLAUDE.md`를 프로젝트 실제 구조에 맞게 수정한다
4. `CLAUDE.local.md`를 개인 환경에 맞게 작성한다
   - `init.bat` 실행 시 기본 템플릿과 `.gitignore` 필수 항목이 자동 추가됨
   - `## 공유 가능` / `## 비공유` 섹션으로 나누어 작성하면 `/share-rules` 로 공유 가능 섹션만 팀 시트에 업로드 가능
   - `## 규칙 작성 모드` 섹션에서 `RULE_MODE`를 설정하여 규칙이 기록되는 위치를 제어할 수 있다 — 자세한 내용은 아래 **규칙 작성 모드** 참고
5. Claude가 틀린 결과를 낼 때마다 관련 내용을 `CLAUDE.md` 또는 `rules/`에 추가·수정한다

### 프로젝트별 템플릿 목록

| 파일 | 대상 프로젝트 |
|------|--------------|
| `template/CLAUDE-TEMPLATE-uniflow.md` | uniflow (전자결재) |
| `template/CLAUDE-TEMPLATE-uniworks-pce.md` | unidocu6 (UniWorks PCE) |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile.md` | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| `template/CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md` | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| `template/CLAUDE-TEMPLATE-uniworks-public.md` | unidocu6-public-sap (UniWorks Public) |

> core 템플릿(`pce-core`, `public-core`)은 `/init-claude-md` 실행 시 core 경로를 입력하면 자동으로 적용됩니다.

### 디렉토리 구조

```
프로젝트루트/
├── CLAUDE.md                        ← Claude Code 프로젝트 지침
├── CLAUDE.local.md                  ← 개인 설정 (.gitignore 자동 추가)
└── .claude/
    ├── hooks/                       ← 이벤트 훅
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    ├── state/                       ← 머신 생성 상태 파일 (.gitignore 자동 추가)
    ├── settings.json                ← 권한·모델 등 기술 설정 (/sync-template으로 덮어씌워짐)
    └── settings.local.json          ← 개인 환경 설정 (.gitignore 자동 추가)
```

---

## 2. 팀 설정 동기화 (/sync-template)

> **시범운영 기간 전용 기능입니다.**
> Claude Code가 팀 내에 안정적으로 정착되면, 각 프로젝트 인원이 자체적으로 설정을 관리하는 방식으로 전환합니다.
> 그 전까지는 `claude-code-template`에서 검증된 최신 설정을 sync로 배포합니다.

Claude Code 세션에서 `/sync-template`을 실행하면 `claude-code-template`의 최신 `.claude/` 설정(hooks, rules, skills, settings.json)을 현재 프로젝트에 자동으로 복사합니다.

### 사전 조건

`.claude/settings.local.json`의 `TEMPLATE_REPO_URL`에 저장소 URL을 입력합니다.

```json
{
  "env": {
    "TEMPLATE_REPO_URL": "https://your-gitlab/claude-code-template.git"
  }
}
```

### 업데이트 알림

`TEMPLATE_REPO_URL`이 설정되어 있으면 Claude Code 실행 시 자동으로 업데이트 여부를 체크합니다.
새 변경사항이 있을 경우 `/sync-template` 실행을 안내하는 메시지가 표시됩니다.

| 항목 | 내용 |
|------|------|
| `CLAUDE.md` | sync 대상 아님 — 프로젝트별로 별도 관리 |
| `settings.local.json` | 개인 환경 설정 — sync 시 덮어쓰지 않음 |
| `settings.json` | template에서 복사됨 — 직접 수정 시 다음 sync에 덮어씌워짐 |
| `.claude/state/` | 로컬 상태 파일 — sync 시 보존됨 |

---

## 3. 훅 (Hooks) 설정

특정 이벤트 발생 시 자동으로 실행되는 스크립트입니다.

> 구성된 훅 목록 및 설정 방법: [`.claude/guides/hooks.md`](.claude/guides/hooks.md)

---

## 4. 스킬 (Skills) 설정

`/스킬명`으로 호출하는 커스텀 커맨드입니다.

> 구성된 스킬 목록 및 설정 방법: [`.claude/guides/skills.md`](.claude/guides/skills.md)

---

## 5. 규칙 작성 모드 (RULE_MODE)

세션 중 Claude가 발견한 규칙을 어디에 기록할지 제어하는 설정입니다.

| 모드 | 동작 | 적합한 경우 |
|------|------|------------|
| `local` | `CLAUDE.local.md`에 공유/비공유 구분하여 자동 추가 | 개인이 규칙을 먼저 발견하고 선별적으로 팀에 공유 |
| `direct` | `CLAUDE.md` 변경안을 제안 → 확인 후 작성 | 규칙을 팀 전체에 즉시 반영 |

### 우선순위

```
CLAUDE.local.md  ← 개인 오버라이드 (우선)
    ↑ 없으면
CLAUDE.md        ← 팀 기본값
    ↑ 없으면
기본값: local
```

### 설정 방법

**팀 기본값** — 프로젝트 `CLAUDE.md`에 추가:
```
## 규칙 작성 모드
RULE_MODE: local
```

**개인 오버라이드** — `CLAUDE.local.md`에서 주석 해제:
```
## 규칙 작성 모드
RULE_MODE: direct
```

> 상세 동작 기준: [`.claude/rules/rule-writing-policy.md`](.claude/rules/rule-writing-policy.md)

---

## 참고

- 코드 스타일 규칙: `.claude/rules/`
- 예시 rules: `java-style.md`, `js-style.md`, `sql-style.md`
- Google Sheets 연동 설정: [`.claude/guides/google-sheets-setup.md`](.claude/guides/google-sheets-setup.md)
