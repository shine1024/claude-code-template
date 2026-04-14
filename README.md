# claude-code-template

사내 프로젝트에서 Claude Code를 빠르게 적용하기 위한 템플릿 및 가이드 모음입니다.

---

## 이 프로젝트의 두 가지 목적

| 목적 | 내용 |
|------|------|
| **템플릿 제공** | 새 프로젝트에 `CLAUDE.md`를 빠르게 작성할 수 있도록 표준 템플릿 제공 |
| **기능 가이드** | Claude Code의 유용한 기능과 설정 방법을 팀 내 공유 |

---

## 1. CLAUDE.md 템플릿 사용법

Claude Code가 프로젝트에 맞는 코드를 생성하려면 **프로젝트 컨텍스트를 사전에 정의**해야 합니다.  
이를 위해 프로젝트 루트에 `CLAUDE.md` 파일을 작성합니다.

### 적용 절차

1. 이 레포를 참고하거나 `.claude` 폴더를 프로젝트 루트에 복사
2. `template/CLAUDE-TEMPLATE.md`를 참고해 프로젝트 루트에 `CLAUDE.md` 작성
3. `.claude/rules/` 하위에 프로젝트 규칙 파일 작성
4. `CLAUDE.local.md`를 개인 환경에 맞게 작성 후 `.gitignore`에 추가

### 디렉토리 구조

```
프로젝트루트/
├── CLAUDE.md                        ← 팀 공유 핵심 지침 (git 커밋)
├── CLAUDE.local.md                  ← 개인 설정 (.gitignore에 추가)
├── template/
│   └── CLAUDE-TEMPLATE.md          ← CLAUDE.md 작성 템플릿
└── .claude/
    ├── settings.json                ← 권한·모델 등 기술 설정
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    └── hooks/                       ← 이벤트 훅
```

### CLAUDE.md 유지보수 흐름

```
CLAUDE-TEMPLATE.md 참조
  ↓
프로젝트별 CLAUDE.md 초안 작성
  ↓
실사용 (Claude Code로 작업 진행)
  ↓
피드백 기록 (feedback-log.md)
  ↓
주간 리뷰 → CLAUDE.md 업데이트
  ↓
공통 룰은 CLAUDE-TEMPLATE.md에 역반영
```

---

## 2. 기능 가이드

Claude Code의 유용한 기능들을 정리합니다.

> `guides/` 폴더에 기능별 가이드 문서가 추가될 예정입니다.

| 가이드 | 내용 |
|--------|------|
| rules globs 설정 | 특정 파일에서만 규칙을 로드하는 방법 |

---

## 참고

- 템플릿: `template/CLAUDE-TEMPLATE.md`
- 예시 rules: `.claude/rules/`
