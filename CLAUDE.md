# claude-code-template — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: claude-code-template
- **목적**: 사내 프로젝트에서 Claude Code를 빠르게 적용하기 위한 템플릿 및 가이드 모음
- **기술 스택**: Markdown (문서 전용 — 빌드·런타임 없음)
- **주요 파일 역할**:

| 파일 | 역할 |
|------|------|
| `CLAUDE.md` | Claude Code 프로젝트 지침 (git 커밋) |
| `CLAUDE.local.md` | 개인 환경 설정 (.gitignore 추가) |
| `template/CLAUDE-TEMPLATE-*.md` | 프로젝트별 CLAUDE.md 템플릿 |
| `basics/` | Claude Code 일반 교육자료 |
| `guides/` | 이 템플릿 프로젝트 기능 가이드 문서 |
| `.claude/rules/*.md` | 관심사별 규칙 — 세션 시작 시 자동 로드 |
| `.claude/skills/` | 커스텀 슬래시 커맨드 |
| `.claude/hooks/` | 이벤트 훅 스크립트 |

---

## 2. 프로젝트 구조

```
claude-code-template/
├── CLAUDE.md                        ← Claude Code 프로젝트 지침 (이 파일)
├── CLAUDE.local.md                  ← 개인 설정 (git 제외)
├── template/                        ← 프로젝트별 CLAUDE.md 템플릿
├── basics/                          ← Claude Code 일반 교육자료
├── guides/                          ← 이 템플릿 프로젝트 기능 가이드 문서
└── .claude/
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    └── hooks/                       ← 이벤트 훅
```

