# 변경 이력

모든 커밋을 날짜별로 누적 기록합니다.
예외: 오타·서식 등 사소한 수정, 같은 흐름의 후속 커밋은 기존 항목에 병합.

---

## 2026-04-29 (3)

- [수정] `.claude/state/`를 git 추적 대상으로 전환 — SYNC_HASH가 프로젝트 단위로 공유되어야 팀원 간 템플릿 버전이 일치함
  - `.gitignore`: `.claude/state/` 항목 제거
  - `init.bat`: `$RequiredEntries`에서 `.claude/state/` 제거
  - `README.md`·`CLAUDE.md`: state/ 설명을 "git 제외" → "git 추적, 프로젝트 단위로 공유"로 갱신
  - 흐름: A가 `/sync-template` → SYNC_HASH가 변경됨 → A가 `.claude/`와 함께 커밋·푸시 → B는 `git pull`만 하면 파일·해시가 자동 일치 → B가 별도 `/sync-template` 실행할 필요 없음. check-update 훅도 정확히 동작
  - **마이그레이션 안내** — 기존 프로젝트의 `.gitignore`에 `.claude/state/` 또는 `.claude/state/*` 항목이 남아 있으면 수동으로 제거하고, SYNC_HASH를 `git add` 해야 함

---

## 2026-04-29 (2)

- [수정] `init.bat` — 신규 프로젝트 `.gitignore`에 `.claude/hooks/.task_start` 항목 추가 (slack-notify 훅이 생성하는 작업 시작 시각 기록 파일, 머신 로컬 전용이므로 git 제외 필요)

---

## 2026-04-29 (1)

- [기능] `issue-new`·`issue-update` — 작업 브랜치 자동 채번 흐름 도입 + 임시 제목 형식 변경
  - 임시 제목 형식: `임시 - YYYY-MM-DD HH:MM:SS` → `[임시] YYYY-MM-DD HH:MM:SS` (분류 표기와 일관성)
  - `/issue-new`: API 호출 직전 작업트리 사전 점검 단계 신설(미커밋 변경 시 carry/stash/취소 선택, 동일 형태 브랜치 위 시 확인). API 성공 후 현재 HEAD에서 `ing__issue__NNNN` 분기·체크아웃. 결과 출력에 브랜치명·커밋 컨벤션(`#NNNN [분류] 요약`, 분류 3종 [개편]/[신규]/[수정]) 안내 추가
  - `/issue-update`: 일감번호 추출 폴백에 브랜치명(`ing__issue__NNNN`) 패턴 추가 — 커밋에 `#번호`가 누락돼도 작업 브랜치에서 자동 추출
  - 흐름의 핵심: 분류·요약을 커밋 시점에 1회만 결정하고 Redmine은 커밋을 그대로 따라감. 브랜치명이 일감번호를 보존해 세션이 바뀌어도 잃지 않음
  - 이 프로젝트(claude-code-template) 자체의 커밋 컨벤션은 변경 없음(6분류 유지). issue 흐름을 사용하는 각 프로젝트에 한해 3분류 + `#NNNN` 접두를 적용

---

## 2026-04-28 (16)

- [수정] `check-update` 훅 — 이벤트를 `UserPromptSubmit` → `SessionStart`로 이동 (매 프롬프트마다 체크 → 세션 시작 시 1회로 단순화)
  - `.claude/settings.json`: `SessionStart` 블록 신설, `UserPromptSubmit`에는 `task-start.sh`만 잔존
  - `.claude/guides/hooks.md`: 지원 이벤트 표에 `SessionStart` 추가, check-update 표기·등록 예시 갱신
  - `check-update.js`는 stdin 미사용이므로 스크립트 변경 없음

---

## 2026-04-28 (15)

- [수정] `issue-update` 스킬 — Redmine 제목에서 `#일감번호` 제거(`[분류] 요약`만 유지), 진척도 100%·작업시간 자동 등록 추가
  - 제목 형식 `#1234 [수정] …` → `[수정] …` (Redmine UI에 일감번호가 별도 표시되어 중복 표기 방지). 커밋 메시지에는 `#일감번호` 그대로 유지
  - 진척도 `done_ratio: 100`을 PUT 페이로드에 항상 포함
  - 상태는 `REDMINE_STATUS_ID_DONE` env 설정 시에만 해당 ID로 변경 (미설정 시 변경 안 함)
  - 소요시간: 일감 `created_on` ~ 직전 커밋 시각으로 계산해 `time_entries` API로 등록 (활동 분류 `개발`/`Development` 고정, 미존재 시 등록 건너뜀)
  - 미리보기 표에 진척도·상태·소요시간 행 추가, 사용자 확인 후 시간 수정 가능

---

## 2026-04-28 (14)

- [리팩터] `check-update` 훅 — PowerShell → Node.js 재작성, Slack DM 알림 추가, mojibake 해소
  - `.claude/hooks/lib/slack.js` 신규 — Slack DM 공용 모듈 (`lookupUserByEmail`/`sendDm`/`sendDmByEmail`)
  - `.claude/hooks/check-update/check-update.js` 신규, `check-update.ps1` 삭제
  - `slack-notify/notify.js` — 내부 Slack 함수 제거, `lib/slack.js` 사용
  - 콘솔 알림은 stderr+stdout 이중 출력으로 가시성 확보, Slack DM은 `SLACK_BOT_TOKEN`+`SLACK_USER_EMAIL` 설정 시 자동 전송
  - 세션 키는 `process.ppid` 우선, 실패 시 시간 단위 fallback

---

## 2026-04-28 (13)

- [리팩터] `issue-new`·`issue-update` 단순화 — `issue-new`는 `임시 - YYYY-MM-DD HH:MM:SS`로 즉시 채번, `issue-update`는 직전 커밋 분석으로 `#번호 [분류] 요약` 제목 자동 반영. 분류는 `[개편]`/`[신규]`/`[수정]` 3종. 자유 형식 입력·prefix 템플릿·진척도/상태 등 부가 기능 제거

---

## 2026-04-28 (12)

- [리팩터] 스킬명 변경 — `redmine-issue-creator` → `issue-new`, `redmine-issue-updater` → `issue-update` (호출 명령어 단순화)

---

## 2026-04-28 (11)

- [수정] `check-update` 훅 — `.bat` 제거, `settings.json`에서 PowerShell 직접 호출로 변경 (bash 환경에서 .bat 실행 불가 문제 해결)

---

## 2026-04-28 (10)

- [리팩터] `init.bat`·`sync-template` — 폴더 목록 하드코딩 제거, `.claude/` 하위 폴더 자동 포함 (`state/` 제외)

---

## 2026-04-28 (9)

- [수정] `init.bat`·`sync-template` — `.claude/lib/` 복사 누락 추가

---

## 2026-04-28 (8)

- [수정] `check-update` 훅 — lock을 날짜 단위에서 Claude Code 프로세스(세션) 단위로 변경, 세션 시작 시 1회 체크

---

## 2026-04-28 (7)

- [기능] `init.bat` — `template/` → `.claude/template/` 복사 추가 (init-claude-md 로컬 참조용)
- [수정] `init-claude-md` — `CLAUDE_CODE_TEMPLATE_PATH` 제거, `.claude/template/` 직접 참조로 변경
- [문서] `README.md` — `/init-claude-md` 실행 위치를 대상 프로젝트로 정정

---

## 2026-04-28 (6)

- [문서] `README.md` — `sync.bat` 섹션 제거, `/sync-template` 스킬 안내로 교체, `.claude/state/` 디렉토리 반영
- [문서] `CLAUDE.md` — `sync.bat` 잔존 참조 제거, `state/` 구조 반영, 커밋 전 README·CHANGES 확인 규칙 추가

---

## 2026-04-28 (5)

- [수정] `init.bat` — LF→CRLF 변환 및 `Get-Content -Encoding UTF8` 누락 수정 (한글 깨짐으로 실행 불가 버그)
- [기능] `.claude/state/` 폴더 신설 — 머신 생성 상태 파일 분리 (`SYNC_HASH` 이동)
- [기능] `init.bat` — 초기화 시 `.gitignore` 필수 항목 자동 추가

---

## 2026-04-28 (4)

- [기능] 자동 업데이트 알림 도입 — Claude 실행 시 공통 템플릿 업데이트 여부를 자동 체크 (`check-update` 훅)
- [기능] `/sync-template` 스킬 신설 — `sync.bat` 대체, Claude가 직접 저장소 clone·파일 복사·`SYNC_HASH` 갱신 수행
- [기능] `TEMPLATE_REPO_URL` 환경변수 도입 — 비어 있으면 업데이트 체크 비활성 (팀 opt-out 지원)
- [리팩터] `sync.bat` 제거 — `/sync-template` 스킬로 대체
- [설정] `.gitignore`에 `.claude/SYNC_HASH` 추가
- [설정] `init.bat` — `SYNC_HASH` 초기 기록 추가, `settings.local.json`에 `TEMPLATE_REPO_URL` 항목 추가

---

## 2026-04-28 (3)

- [리팩터] `reports/` 폴더 제거 — `analyze-report`는 각 프로젝트 루트에서 실행하는 구조이므로 claude-code-template에 불필요

## 2026-04-28 (2)

- [기능] `RULE_MODE` 도입 — 세션 중 발견한 규칙을 `CLAUDE.md`(direct)·`CLAUDE.local.md`(local) 중 어디에 기록할지 제어. `CLAUDE.md`가 팀 기본값, `CLAUDE.local.md`가 개인 오버라이드
- [기능] `.claude/rules/rule-writing-policy.md` 신설 — 모드별 동작·공유/비공유 판단 기준 정의
- [기능] `init.bat` — `CLAUDE.local.md` 기본 템플릿 자동 생성 (이미 존재하면 건너뜀)
- [문서] `README.md`·`CLAUDE.md`·`template/CLAUDE-TEMPLATE.md` — `RULE_MODE` 설정 방법 및 우선순위 안내 추가

## 2026-04-28

- [리팩터] `analyze-feedback` → `analyze-report` 로 rename — 각 프로젝트 루트에서 실행되는 모델로 재정의
- [기능] analyze-report — cwd의 `CLAUDE.md`/`CLAUDE.local.md` (하위 모듈 포함) 글로브 수집해 비교 분석. 보고서에 "적용 위치(추정)" 컬럼 추가
- [기능] analyze-report — 출력 경로 `reports/analyze-report/{YYYY-MM-DD}-analyze-report.md` 로 변경 (프로젝트별 섹션 분기 제거)
- [기능] 환경변수 `PROJECT_NAME` 도입 — `session-log`·`share-rules`·`analyze-report` 모두 디렉토리명 대신 설정값 사용 (디렉토리 변경에 영향 없음). `slack-notify` 훅도 `PROJECT_NAME` 우선 + basename 폴백으로 적용
- [문서] `guides/skills.md`·`guides/google-sheets-setup.md` 갱신 — 새 스킬명·환경변수 반영, 프로젝트별 시트 분리 안내 추가

## 2026-04-27

- [기능] Google Sheets 연동 통합 — Apps Script 제거하고 Sheets API 직접 호출로 단일화 (`session-log`·`share-rules`·`analyze-feedback`)
- [기능] 시트 식별 방식을 이름 → gid 로 변경 (한글 시트명 인코딩 문제 근본 해결)
- [기능] `lib/sheets.js` 공통 헬퍼 신설 — 인증·요청 로직 단일화
- [기능] `share-rules` 업로드 시트를 사전 생성 + gid 등록 방식으로 변경 (자동 생성 폐지)
- [설정] 환경변수 네이밍 통일
  - `SHEETS_FEEDBACK_ID` → `GOOGLE_SHEETS_FEEDBACK_ID`
  - `SHEETS_SESSION_LOG_GID` → `GOOGLE_SHEETS_SESSION_LOG_GID`
  - `SHEETS_PERSONAL_RULES_GID` → `GOOGLE_SHEETS_PERSONAL_RULES_GID` (구 `SHEETS_TEAM_RULES_GID`)
  - `SESSION_LOG_NAME` → `SESSION_USER_NAME`
  - `SESSION_LOG_SCRIPT_URL` 제거 (Apps Script 미사용)
- [수정] `lib/sheets.js` `appendValues`/`batchUpdateValues` 옵션을 `RAW` + `OVERWRITE` 로 변경 — 날짜 자동변환·헤더 서식 상속 차단
- [리팩터] "팀 규칙 후보" → "개인 규칙 후보" 용어 통일 (analyze-feedback·share-rules 관련 11개 파일)
- [리팩터] init·sync — PowerShell 스크립트(.ps1) 를 .bat 에 인라인 통합 (.ps1 제거)
- [수정] sync.bat — clone 시 CRLF 자동 변환, 종료 시 입력 대기 추가
- [기능] `CHANGES.md` 신설 — 모든 커밋을 날짜별로 누적 기록하는 정책 도입 (`CLAUDE.md` 갱신)

## 2026-04-26

- [보안] slack-notify — Bot Token 을 환경변수(`SLACK_BOT_TOKEN`) 로 이전
- [문서] CLAUDE.md — 커밋 컨벤션을 실제 사용 형식으로 업데이트

## 2026-04-24

- [수정] init·sync — GitLab 직접 clone 방식으로 전환, `CLAUDE_CODE_TEMPLATE_PATH` 환경변수 제거
- [수정] init·sync — `.claude/guides/` 폴더를 복사 대상에 추가
- [수정] init·sync — UTF-8 BOM 복원 (한글 깨짐 수정)

## 2026-04-23

- [기능] init-claude-md — CONTEXT 파일 기반 코드 분석 통합 방식으로 전면 개편 (분석 순서 독립 섹션화)
- [수정] init-claude-md — `@import` 제거, `additionalDirectories` 연동 방식으로 전환

## 2026-04-22

- [기능] init-claude-md — pom.xml 기반 하위 모듈 CLAUDE.md 자동 생성 (멀티 모듈 지원)
- [기능] init-claude-md — 6번 템플릿 추가 (프로젝트 직접 분석)
- [기능] init.bat / sync.bat 추가 — Windows 스크립트로 전환
- [이동] `guides/` → `.claude/guides/` 재구성

## 2026-04-21

- [기능] `/analyze-feedback` 스킬 추가 — 피드백 데이터 기반 규칙 개선안 도출
- [기능] `/redmine-issue-updater` 스킬 추가
- [기능] `/redmine-issue-creator` 환경변수 기반으로 재설계
- [기능] `sync.sh` 추가 — 팀 `.claude/` 동기화

## 2026-04-20

- [기능] `/redmine-issue-creator` 스킬 추가
- [기능] `template/CLAUDE-TEMPLATE.md` 공통 베이스 추가 (프로젝트별 템플릿의 공통 규칙 분리)
- [기능] `basics/` 교육자료 폴더 신설
- [수정] Java·JS 주석 규칙 — 사용자 명시적 요청 시에만 작성하도록 변경
- [수정] 가이드 단일 출처화, 스킬·훅 수정 체크리스트 추가

## 2026-04-16

- [기능] 프로젝트별 `CLAUDE-TEMPLATE-*.md` 6종 추가 (uniflow 등)

## 2026-04-14

- [기능] 훅·스킬 알림 제어 기능 추가, 가이드 표 형식 개선
- 초기 설정
