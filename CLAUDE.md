# claude-code-template — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: claude-code-template
- **목적**: 사내 프로젝트에서 Claude Code를 빠르게 적용하기 위한 템플릿 및 가이드 모음
- **기술 스택**: Markdown (문서 전용 — 빌드·런타임 없음)
- **주요 파일 역할**:

| 파일 | 역할 |
|------|------|
| `CLAUDE.md` | 팀 공유 핵심 지침 (git 커밋) |
| `CLAUDE.local.md` | 개인 환경 설정 (.gitignore 추가) |
| `template/CLAUDE-TEMPLATE.md` | CLAUDE.md 작성 템플릿 |
| `.claude/rules/*.md` | 관심사별 규칙 — 세션 시작 시 자동 로드 |
| `.claude/skills/` | 커스텀 슬래시 커맨드 |
| `.claude/hooks/` | 이벤트 훅 스크립트 |

---

## 2. 프로젝트 구조

```
claude-code-template/
├── CLAUDE.md                        ← 팀 공유 핵심 지침 (이 파일)
├── CLAUDE.local.md                  ← 개인 설정 (git 제외)
├── template/
│   └── CLAUDE-TEMPLATE.md          ← CLAUDE.md 작성 템플릿
├── guides/                          ← 기능 가이드 문서
└── .claude/
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    └── hooks/                       ← 이벤트 훅
```

---

## 3. 이 템플릿 사용 방법

1. 이 레포를 참고하거나 `.claude` 폴더를 프로젝트 루트에 복사
2. `template/CLAUDE-TEMPLATE.md`를 참고해 프로젝트 루트에 `CLAUDE.md` 작성
3. `.claude/rules/` 하위 파일을 프로젝트 컨벤션에 맞게 수정
4. `CLAUDE.local.md`를 개인 환경에 맞게 작성 후 `.gitignore`에 추가
5. Claude가 틀린 결과를 낼 때마다 관련 내용을 rules/ 파일 또는 CLAUDE.md에 추가·수정

