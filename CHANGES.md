# 변경 이력

모든 커밋을 날짜별로 누적 기록합니다.
예외: 오타·서식 등 사소한 수정, 같은 흐름의 후속 커밋은 기존 항목에 병합.

---

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
