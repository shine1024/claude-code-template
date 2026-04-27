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
2. `claude-code-template` 프로젝트에서 `/init-claude-md <프로젝트경로>` 를 실행한다 — `CLAUDE.md` 생성
3. 생성된 `CLAUDE.md`를 프로젝트 실제 구조에 맞게 수정한다
4. `CLAUDE.local.md`를 개인 환경에 맞게 작성 후 `.gitignore`에 추가한다
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
├── CLAUDE.local.md                  ← 개인 설정 (.gitignore에 추가)
└── .claude/
    ├── sync.bat                     ← 팀 설정 동기화 스크립트 (Windows)
    ├── hooks/                       ← 이벤트 훅
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    ├── settings.json                ← 권한·모델 등 기술 설정 (sync로 덮어씌워짐)
    └── settings.local.json          ← 개인 경로 설정 (.gitignore에 추가)
```

---

## 2. 팀 설정 동기화 (sync.bat)

> **시범운영 기간 전용 기능입니다.**
> Claude Code가 팀 내에 안정적으로 정착되면, 각 프로젝트 인원이 자체적으로 설정을 관리하는 방식으로 전환합니다.
> 그 전까지는 `claude-code-template`에서 검증된 최신 설정을 sync로 배포합니다.

`sync.bat`를 실행하면 `claude-code-template`의 최신 `.claude/` 설정(hooks, rules, skills, settings.json)을 현재 프로젝트에 자동으로 복사합니다.
`settings.local.json`이 없는 경우 자동으로 초안을 생성하므로, 신규 투입 인력은 `sync.bat` 실행 후 값만 채우면 됩니다.

### 최초 1회 세팅

**1. `.claude/settings.local.json` 값 입력**

`sync.bat` 실행 시 자동 생성됩니다. 생성된 파일을 열어 각 항목에 실제 값을 입력합니다.

**2. `.gitignore` 확인**

```
.claude/settings.local.json
CLAUDE.local.md
```

### 업데이트 시 사용법

```
.claude\sync.bat
```

완료 후 변경된 파일을 확인하고 commit/push 합니다.

```bash
git add .claude/
git commit -m "chore: claude-code-template 동기화"
git push
```

| 항목 | 내용 |
|------|------|
| `CLAUDE.md` | sync 대상 아님 — 프로젝트별로 별도 관리 |
| `settings.local.json` | 개인 경로 설정 — `.gitignore` 필수 |
| `settings.json` | template에서 복사됨 — 직접 수정 시 다음 sync에 덮어씌워짐 |
| Windows 경로 | Git Bash 사용 시 `C:/projects/...` 형식으로 입력 |

---

## 3. 훅 (Hooks) 설정

특정 이벤트 발생 시 자동으로 실행되는 스크립트입니다.

> 구성된 훅 목록 및 설정 방법: [`.claude/guides/hooks.md`](.claude/guides/hooks.md)

---

## 4. 스킬 (Skills) 설정

`/스킬명`으로 호출하는 커스텀 커맨드입니다.

> 구성된 스킬 목록 및 설정 방법: [`.claude/guides/skills.md`](.claude/guides/skills.md)

---

## 참고

- 코드 스타일 규칙: `.claude/rules/`
- 예시 rules: `java-style.md`, `js-style.md`, `sql-style.md`
- Google Sheets 연동 설정: [`.claude/guides/google-sheets-setup.md`](.claude/guides/google-sheets-setup.md)
