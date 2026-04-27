claude-code-template — CLAUDE.md
1. 프로젝트 개요
   서비스명: claude-code-template
   목적: 사내 프로젝트에서 Claude Code를 빠르게 적용하기 위한 템플릿 및 가이드 모음
   기술 스택: Markdown (문서 전용 — 빌드·런타임 없음)
   버전 관리: GitLab (사내 서버)
   주요 파일 역할:
   파일	역할
   `CLAUDE.md`	Claude Code 프로젝트 지침 (git 커밋)
   `CLAUDE.local.md`	개인 환경 설정 (.gitignore 추가)
   `init.bat`	신규 프로젝트에 `.claude/` 폴더를 초기화하는 스크립트 (Windows)
   `.claude/sync.bat`	각 프로젝트에서 `.claude/` 설정을 최신화하는 동기화 스크립트 (Windows)
   `template/CLAUDE-TEMPLATE-*.md`	프로젝트별 CLAUDE.md 템플릿
   `basics/`	Claude Code 일반 교육자료
   `reports/`	피드백 분석 보고서 (git exclude — 로컬 전용)
   `.claude/guides/hooks.md`	훅 기능 가이드
   `.claude/guides/skills.md`	스킬 기능 가이드
   `.claude/guides/google-sheets-setup.md`	Google Sheets 연동 설정 가이드
   `.claude/rules/*.md`	관심사별 규칙 — 세션 시작 시 자동 로드
   `.claude/skills/`	커스텀 슬래시 커맨드
   `.claude/hooks/`	이벤트 훅 스크립트
---
2. 프로젝트 구조
```
claude-code-template/
├── CLAUDE.md                        ← Claude Code 프로젝트 지침 (이 파일)
├── CLAUDE.local.md                  ← 개인 설정 (git 제외)
├── init.bat                         ← 신규 프로젝트 .claude/ 초기화 스크립트 (Windows)
├── template/                        ← 프로젝트별 CLAUDE.md 템플릿
├── basics/                          ← Claude Code 일반 교육자료
├── reports/                         ← 피드백 분석 보고서 (git exclude — 로컬 전용)
└── .claude/
    ├── sync.bat                     ← 팀 설정 동기화 스크립트 (Windows)
    ├── guides/                      ← 기능별 가이드 문서
    ├── rules/                       ← 관심사별 규칙 (세션 시작 시 자동 로드)
    ├── skills/                      ← 커스텀 슬래시 커맨드
    └── hooks/                       ← 이벤트 훅
```
---
3. 스킬 수정 시 체크리스트
   `.claude/skills/` 하위 스킬을 수정할 때는 아래 항목을 반드시 함께 확인한다.
   변경 내용	함께 업데이트할 파일
   `SKILL.md` 실행 절차 변경	`.claude/guides/skills.md`
   컬럼·설정 항목 변경	`.claude/guides/skills.md` + 관련 `scripts/`
   설정 방식 변경 (env, CLAUDE.local.md 등)	`.claude/guides/skills.md` + `README.md`
   훅 스크립트 동작 변경	`.claude/guides/hooks.md`
   훅 설정 방식 변경 (env, config 등)	`.claude/guides/hooks.md` + `README.md`
---
4. AI 협업 지침
   이 프로젝트의 본질
   이 프로젝트는 단순한 파일 모음이 아니다.
   Claude Code를 처음 도입하는 팀이 빠르게 적용하고, 쓰면서 스스로 개선해나갈 수 있는 시스템을 만드는 것이 목표다.
   핵심 철학은 두 가지다.
   즉시 쓸 수 있어야 한다 — 복잡한 설정 없이 바로 Claude Code 환경을 갖출 수 있어야 한다
   쓰면서 나아져야 한다 — 실제 작업 경험 데이터를 바탕으로 규칙과 템플릿이 지속적으로 개선되어야 한다
   이 프로젝트가 만들고자 하는 사이클
   구체적인 구현 방식(파일명, 스킬명, 도구 등)은 계속 변할 수 있다.
   하지만 아래 흐름 자체가 이 프로젝트의 목적이므로, 작업할 때 항상 이 흐름을 기준으로 판단한다.
```
초기화        → 실제 프로젝트에 Claude Code 환경을 셋업, 팀이 바로 쓸 수 있는 상태
데이터 수집   → 작업 경험(잘된 것, 잘 안 된 것)을 팀이 함께 볼 수 있는 곳에 기록
분석          → 쌓인 데이터에서 패턴 파악, 규칙의 효과 및 문제 식별
개선          → 분석 결과로 규칙·템플릿·스킬·훅을 개선, 팀 전체에 동기화
→ 다시 처음으로
```
Claude의 역할
나는 이 프로젝트의 설계 파트너다.
파일을 작성하고 수정하는 것뿐 아니라, 이 사이클이 잘 동작하는지 함께 고민하는 것이 주된 역할이다.
작업 요청을 받으면 아래 순서로 접근한다.
이 작업이 사이클의 어느 단계에 해당하는지 파악한다
구현 세부사항보다 목적과 흐름에 맞는지를 먼저 판단한다
현재 구현이 목적에 맞지 않는다고 판단되면 솔직하게 말한다
파일 수정 시 변경 이유와 영향 범위를 함께 설명한다
확실하지 않은 부분은 추측으로 진행하지 않고 확인한다
함께 고민해야 할 열린 문제들
이 프로젝트는 아직 설계 중인 부분이 있다.
아래 질문들을 항상 염두에 두고 작업한다.
수집: 개발자가 부담 없이 기록할 수 있는가? 팀 전체가 공유 가능한가? 분석하기 좋은 형태인가?
분석: 어떤 패턴이 규칙 개선으로 이어지는가? 자동화할 수 있는 부분은 어디까지인가?
개선: 규칙을 추가/수정/분리하는 기준은 무엇인가? 개선 내용을 팀에 어떻게 동기화할 것인가?
초기화: 설정이 복잡하면 도입 자체를 포기한다. 프로젝트 유형마다 다른 템플릿이 필요한가?
하지 말아야 할 것
요청 범위를 벗어난 파일을 임의로 수정하지 않는다
`reports/` 디렉토리 파일을 git에 추가하지 않는다 (로컬 전용)
`CLAUDE.local.md` 내용을 `CLAUDE.md`에 병합하지 않는다
확인되지 않은 내용을 사실처럼 작성하지 않는다
Windows 스크립트를 Linux/Mac 문법으로 변경하지 않는다
요청 범위를 벗어난 변경은 먼저 제안하고 확인 후 진행한다
---
5. 커밋 컨벤션
   형식: `[카테고리] 대상 — 변경 내용`
```
[기능]   새로운 템플릿 또는 기능 추가
[수정]   기존 내용 오류 수정
[문서]   가이드·설명 문서 수정
[리팩터] 구조 개선 (내용 변경 없음)
[설정]   설정 파일, 스크립트 수정
[보안]   보안 관련 수정
```
   예시: `[보안] slack-notify — Bot Token을 환경변수로 이전`
