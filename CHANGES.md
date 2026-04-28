# 변경 이력

모든 커밋을 날짜별로 누적 기록합니다.
예외: 오타·서식 등 사소한 수정, 같은 흐름의 후속 커밋은 기존 항목에 병합.

---

## 2026-04-28 (3)

- [리팩터] `issue-new`·`issue-update` 단순화 — `issue-new`는 `임시 - YYYY-MM-DD HH:MM:SS`로 즉시 채번, `issue-update`는 직전 커밋 분석으로 `#번호 [분류] 요약` 제목 자동 반영. 분류는 `[개편]`/`[신규]`/`[수정]` 3종. 자유 형식 입력·prefix 템플릿·진척도/상태 등 부가 기능 제거

---

## 2026-04-28 (2)

- [리팩터] 스킬명 변경 — `redmine-issue-creator` → `issue-new`, `redmine-issue-updater` → `issue-update` (호출 명령어 단순화)

---

## 2026-04-28

- [수정] `check-update` 훅 — `.bat` 제거, `settings.json`에서 PowerShell 직접 호출로 변경 (bash 환경에서 .bat 실행 불가 문제 해결)

---

## 2026-04-29 (7)

- [리팩터] `init.bat`·`sync-template` — 폴더 목록 하드코딩 제거, `.claude/` 하위 폴더 자동 포함 (`state/` 제외)

---

## 2026-04-29 (6)

- [수정] `init.bat`·`sync-template` — `.claude/lib/` 복사 누락 추가

---

## 2026-04-29 (5)

- [수정] `check-update` 훅 — lock을 날짜 단위에서 Claude Code 프로세스(세션) 단위로 변경, 세션 시작 시 1회 체크

---

## 2026-04-29 (4)

- [기능] `init.bat` — `template/` → `.claude/template/` 복사 추가 (init-claude-md 로컬 참조용)
- [수정] `init-claude-md` — `CLAUDE_CODE_TEMPLATE_PATH` 제거, `.claude/template/` 직접 참조로 변경
- [문서] `README.md` — `/init-claude-md` 실행 위치를 대상 프로젝트로 정정

---

## 2026-04-29 (3)

- [문서] `README.md` — `sync.bat` 섹션 제거, `/sync-template` 스킬 안내로 교체, `.claude/state/` 디렉토리 반영
- [문서] `CLAUDE.md` — `sync.bat` 잔존 참조 제거, `state/` 구조 반영, 커밋 전 README·CHANGES 확인 규칙 추가

---

## 2026-04-29 (2)

- [수정] `init.bat` — LF→CRLF 변환 및 `Get-Content -Encoding UTF8` 누락 수정 (한글 깨짐으로 실행 불가 버그)
- [기능] `.claude/state/` 폴더 신설 — 머신 생성 상태 파일 분리 (`SYNC_HASH` 이동)
- [기능] `init.bat` — 초기화 시 `.gitignore` 필수 항목 자동 추가

---

## 2026-04-29

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
