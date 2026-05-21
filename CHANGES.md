# 변경 이력

모든 커밋을 날짜별로 누적 기록합니다.
예외: 오타·서식 등 사소한 수정, 같은 흐름의 후속 커밋은 기존 항목에 병합.

---

## 2026-05-21

- [문서] `basics/03_claude-code-template_사용법.md` — 전면 재구성 (533줄 → 235줄)
  - §1 **개요**: 차터 형식(과제·목표·시범운영 대상·산출물·운영기간) + "출발 전제" 한 단락 ("정답 없음, 가정에서 출발해 반복")
  - §2 **무엇을 만들고 있나**: 4단계 사이클 그림·표 + 디렉토리 구조 + git 분류 표 통합 (기존 §8 디렉토리 흡수)
  - §3 **신규 프로젝트 적용**: init→claude→/init-claude-md→다듬기 3단계로 압축
  - §4 **반복 사이클**: 4개 스킬(`/session-log`·`/share-rules`·`/analyze-report`·`/apply-report`)을 표 1개로 통합 + 환원 절차
  - §5 **부가 기능**: Redmine 일감 워크플로우·`/sync-template`·RULE_MODE 를 각 3~5줄로 압축, 상세는 가이드 링크
  - §6 **팀에 맞게 변형**: 변형 케이스 표 + "깨면 안 되는 것" 4가지
- [문서] `CLAUDE.md` — 마크다운 문법 복구 (헤더 `#`/`##`/`###`, 표 `|---|` 구분자, 불릿 `-` 마커, 번호 리스트). 내용 변경 없음
- [문서] `README.md` — 03 사용법 재구성에 따른 앵커 링크 보정 (`#3-신규-프로젝트-적용-절차`→`#3-신규-프로젝트-적용`, `#4-일감커밋-워크플로우`·`#5-템플릿-동기화-sync-template`→`#5-부가-기능`, `#7-회고개선-사이클`→`#4-반복-사이클`)

---

## 2026-05-14

- [기능] `sync-template` — 원격 HEAD 해시 사전 비교 + CHANGES.md 신규 항목 Slack DM
  - 1단계 후 `git ls-remote $TEMPLATE_REPO_URL HEAD` 로 원격 해시만 먼저 조회 → 로컬 `.claude/state/SYNC_HASH` 와 같으면 clone·복사를 모두 건너뛰고 즉시 종료
  - 다를 때만 full clone (기존 `--depth 1` 제거 — `oldHash..HEAD` diff 조회를 위해 필요)
  - 복사·해시 갱신 후 `git diff $oldHash..HEAD -- CHANGES.md` 의 `+` 라인만 추출(헤더 `+++` 제외) 하여 본인 Slack DM 전송 (`SLACK_BOT_TOKEN`·`SLACK_USER_EMAIL` 설정 시, `SLACK_NOTIFY_ENABLED=false` 면 비활성)
  - 신규: `.claude/skills/sync-template/scripts/notify.js` — 기존 `.claude/hooks/lib/slack.js` 의 `sendDmByEmail` 재사용. stdin 으로 `{projectName, oldHash, newHash, changes}` JSON 수신, 빈 줄·`---` 구분선 필터 + 최대 60줄 표시 + 초과 시 "외 N줄 생략". `## YYYY-MM-DD` → `*YYYY-MM-DD*` (Slack mrkdwn 굵게) + 날짜 그룹 사이 빈 줄, `**굵게**` → `*굵게*`, `- ` → `• ` 변환. 초기 동기화·CHANGES.md 무변경 케이스 분기
  - 문서: `basics/03_사용법.md` §5 동작 표에 "변경 없으면 skip" 및 Slack DM 행 추가
- [수정] `java-style.md`·`js-style.md` — 코드 스타일 룰 보강
  - `## 포맷` 최대 줄 길이: 100자 → **150자**
  - `## 메서드/함수 시그니처·호출 개행` 섹션 신규 — 매개변수 한도(최대 4개), 개행 트리거 3종(파라미터 4개 이상 / Builder·fluent chain / 다필드 선언), 개행 시 leading comma + 닫는 `)` 새 줄(SQL 스타일과 일관), 단순 호출·선언은 150자 넘어도 한 줄 유지·길면 인자를 상수·변수로 추출
  - 예시: Java 단순 호출 한 줄(`xpath.evaluate(redirectXPath, ...)`) + 4개 이상 파라미터 개행(`excelDownload(...)`) / JS 단순 호출 한 줄(`fetch(orderDetailUrl, ...)`)

---

## 2026-05-11

- [문서] `CLAUDE.md` — 변경 체크리스트에 `basics/03_claude-code-template_사용법.md` 추가 (사용자 절차·워크플로우·디렉토리 구조 변경 시 함께 갱신 / 커밋·푸시 직전 필수 확인 대상)
- [문서] `CLAUDE.md` — 1.1 절 "워크플로우 특이사항" 신규: 이 저장소는 Redmine 일감 워크플로우 **미연동**. `/commit-push` 호출 시 일감번호 추출·일감 갱신·시간 등록 단계를 모두 건너뛰고, 커밋 subject 도 `#NNNN` 없이 `[분류] 요약` 형식으로 작성

---

## 2026-05-08

- [기능] `deploy-static` 훅 신규 — 세션 중 수정된 정적 리소스(`.hbs`·`.js`·`.css`)를 작업 종료 시 배포 경로로 자동 복사
  - `track.js` (`PostToolUse`, matcher `Edit|Write|MultiEdit`): `tool_input.file_path` 추출 → 확장자 화이트리스트 + `SRC_ROOT` 하위 검사 → `.claude/cache/modified_files.log` 에 누적 (출력 없음)
  - `deploy.js` (`Stop`): 로그를 dedup 후 `SRC_ROOT` 기준 상대경로로 `DEPLOY_ROOT` 에 복사 (디렉토리 자동 생성), 로그 삭제. 성공 시 stderr 한 줄 요약
  - 활성화는 각 프로젝트의 `.claude/settings.local.json`에서 `SRC_ROOT`·`DEPLOY_ROOT` 지정 + 훅 등록 (opt-in). 미설정 시 두 훅 모두 즉시 종료
  - 토큰 비용 최소화: stdout 출력 없음, stderr 만 사용 (LLM 컨텍스트 비차감)
- [문서] `.claude/guides/hooks.md` — `deploy-static` 섹션 + 환경변수 표(`SRC_ROOT`·`DEPLOY_ROOT`) 추가
- [기능] `tests/` 통합 테스트 인프라 신규 — `claude-code-sandbox` 자식 claude 세션으로 사전 검증
  - `tests/run.js`: 시나리오 디렉토리 자동 인식 → sandbox baseline(`git rev-parse HEAD`) 기록 → setup(reset+clean+DEPLOY_ROOT clear) → 자식 `claude -p --dangerously-skip-permissions` 호출 → `verify.js` 실행 → teardown(같은 reset). 자식 호출은 `bash -c` + 환경변수로 wrap (Windows + Node `spawnSync` 의 `.cmd` 호출 이슈 회피)
  - 첫 시나리오 `deploy-static`: 4개 파일 수정 → 화이트리스트·필터·DEPLOY_ROOT 복사·log 정리까지 8개 항목 PASS/FAIL 자동 판정. 검증 결과 8/8 PASS, 멱등성 확인
  - sandbox 보호: working tree clean 검사 → dirty 면 거부, 매 사이클 baseline 으로 reset → 자식이 commit/파일 변경 등 무엇을 해도 폐기. push 격리는 미포함(sandbox origin 더미 전제)
- [문서] `CLAUDE.md`·`README.md` — 프로젝트 구조에 `tests/` 추가

- [기능] `validate-rules`·`apply-validate-report` 스킬 신규 — 누적된 `.claude/rules/*.md` 의 유효성 재검증 라운드
  - `validate-rules`: `rules-index.json` 의 임계값(추가 후 60일 미검증 / 마지막 검증 후 180일 / 일반 모드 최대 10건)을 넘긴 후보를 추출해 LLM 으로 3기준(전제 성립·대상 코드 존재·다른 규칙과 모순 없음) 판정 → `reports/validate-rules/{날짜}-validate-report.md` 보고서 생성. `--force` 모드는 임계값 무시
  - `apply-validate-report`: 보고서의 체크박스(`[x]`) 항목만 반영 — 삭제(파일·섹션 제거) / 병합 / 충돌(자동 처리 안 함, 사용자 수동) / 유지(체크 무관 last_validated_at 갱신)
  - 인덱스 위치: `.claude/state/rules-index.json` — `/sync-template` 시 `state/` 가 제외 디렉토리이므로 검증 이력이 sync 로 휘발되지 않음
  - 시드 스크립트 `validate-rules/scripts/seed-index.js`: 최초 1회 git log 첫 커밋 날짜로 `added_at`·`last_validated_at` 시드
  - 보고서·인덱스 파싱은 LLM 가 아닌 Node.js 스크립트로 수행 (apply-report 패턴 재사용)
- [수정] `apply-report` 5.5단계 추가 — 적용한 `.claude/rules/*.md` 를 `update-index.js` 에 전달해 `rules-index.json` 자동 갱신 (신규 → entry 추가, 기존 → `last_validated_at` 갱신)
- [문서] `.claude/guides/skills.md` — 신규 2개 스킬 섹션 + apply-report 5.5단계 행 추가
- [문서] `CLAUDE.md` — `.claude/state/` 설명에 `rules-index.json` 추가

---

## 2026-05-07 (3)

- [문서] `basics/` — 교육자료 3종 신설 및 정비 (기초·심화·사용법)
  - 파일명 정리: `클로드코드_사용가이드_입문.md` → `01_claude-code_기초.md`, `심화` → `02_claude-code_심화.md`
  - `01_claude-code_기초.md` — 전반 개정 (워크플로우·30분 첫 작업 실습·트러블슈팅·성장 사다리 등)
  - `02_claude-code_심화.md` — Plan Mode·Skills·Plugin·MCP 전 영역 재정비
    - IDE 연동·헤드리스 모드 섹션 제거
    - Subagent 축약 후 Worktree 섹션 신설 (§6 "병렬 작업 패턴: Subagent · Worktree")
    - Hooks 예시 Windows 우선 + macOS 보조 + 공식 가이드 링크
    - 자동 메모리 섹션 축소 (개인 누적 도구로 위치 명시)
    - §10 35분 심화 실습 추가 (rules 분리·권한 차단·첫 Skill·Stop Hook)
  - `03_claude-code-template_사용법.md` — 신규 작성
    - 도입 배경, 초기화 + 4단계 사이클(사용·수집·분석·개선)
    - 신규 적용 절차, 일감·커밋 워크플로우
    - `/sync-template` 을 "공통 설정 단일 출처" 메커니즘으로 정립
    - 회고·개선 사이클에 "다른 프로젝트로 전파(템플릿 환원)" 절차 포함
- [문서] `README.md` — basics 3종 안내·빠른 색인 정비, "시범운영" 표현 제거하여 §5 새 프레이밍과 동기화

---

## 2026-05-07 (2)

- [기능] `slack-notify` 훅 — 권한 허가 요청(Notification·`permission_prompt`) 알림 추가
  - `settings.json`에 `Notification` 훅 등록 (matcher: `permission_prompt`) — Stop 훅과 동일한 `notify.js` 재사용
  - `notify.js`: Notification 분기 메시지를 `[Claude Code] 권한 허가 요청 🔐 / 프로젝트 / 요청: <message> / 시작·현재·소요`로 변경
  - `lib/slack.js`: `sendDmByEmail`에 User ID 캐시 도입 (`.claude/cache/.slack_user_id.json`) — lookup 왕복 1회 생략, 이메일 변경·`user_not_found`/`channel_not_found` 시 자동 무효화
  - `.gitignore`: `.claude/cache/` 항목 주석 일반화 (일감번호 외에 슬랙 유저 ID 캐시도 포함됨)

---

## 2026-05-07 (1)

- [기능] `issue-new`·`commit-push` — 일감 생성 시 제목·설명 입력 흐름 추가 (사용자 편의성 우선)
  - `/issue-new <제목>` 인자 전달 시: 추가 질문 없이 즉시 정식 제목으로 생성 (가장 빠른 경로)
  - `/issue-new` 인자 없이 호출 시: 제목 프롬프트 → 빈 답변이면 임시 제목 자동 생성, "취소"면 종료, 입력 시 설명 프롬프트로 진행 (멀티라인 가능)
  - Redmine API 페이로드에 `description` 필드 조건부 포함 (빈값이면 필드 자체 제외)
  - 결과 출력: 임시/정식 제목에 따라 헤더 메시지 분기, 정식 제목인 경우 "/commit-push 미리보기에서 제목 보존하려면 알려달라" 안내 추가
  - `/commit-push` 미리보기: 현재 제목이 `[임시]` 형식이 아니면 새 제목 자동 산출이 사용자 의도를 덮어쓸 수 있음을 안내하는 한 줄 추가

---

## 2026-05-06 (3)

- [설정] `.gitignore` · `.claude/hooks/` — 폐기된 `.local_md_hash` 잔재 제거 (예전 `UserPromptSubmit` 훅에서 `CLAUDE.local.md` 해시를 기록하던 기능의 흔적 — 더 이상 만들지 않으므로 ignore 항목·잔존 파일 함께 정리)

---

## 2026-05-06 (2)

- [설정] `.gitignore` — `reports` 항목 추가 (분석 데이터 로컬 전용 — `reports/analyze-report/` 등)

---

## 2026-05-06 (1)

- [수정] `.claude/skills/*/SKILL.md` — `documentation.md` 규칙 준수로 9개 스킬 정비
  - frontmatter 보완: `session-log`·`init-claude-md` 에 `name`·`description`·트리거 키워드 추가
  - 이모지 → 텍스트 표식: `✅`/`⚠️`/`❌`/`⏭️`/`📌` → `[성공]`/`[주의]`/`[실패]`/`[건너뜀]`/`[안내]` (issue-new·issue-update·commit-push·init-claude-md)
  - 어미 통일: 본문 instruction 어미를 `~한다` 로 정렬 (코드블록 내 사용자 대면 출력 메시지는 정중체 유지)
  - `사용 시점` 섹션 추가: `session-log`·`init-claude-md`

---

## 2026-05-04 (1)

- [기능] `.claude/rules/coding-behavior.md` 신규 — Andrej Karpathy 의 LLM 코딩 관찰에서 도출한 4원칙(Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution) 을 행동 규범으로 명문화. 모든 프로젝트에 무조건 적용
  - `init-claude-md/SKILL.md`: 3-1 적용 rules 표에 "공통 — 모든 프로젝트" 행 추가 → 생성되는 CLAUDE.md 의 "적용 rules" 항목에 항상 포함
  - `template/CLAUDE-TEMPLATE.md`: 공통 rules/ 파일 표 최상단에 `coding-behavior.md` (모든 프로젝트 필수) 추가

---

## 2026-04-30 (5)

- [기능] `issue-new`·`commit-push`·`issue-update` — 작업 워크플로우 통합 정비
  - `/issue-new`: `BRANCH_STRATEGY` (`always` 기본 / `never`), `BASE_BRANCH` 환경변수 도입
    - `always` + `BASE_BRANCH` 설정 시: 해당 브랜치 체크아웃 → `git pull --ff-only` → `ing__issue__NNNN` 분기 (운영 프로젝트의 dev 베이스 흐름)
    - `never` 모드: 브랜치 생성을 스킵하고 `.claude/cache/current_issue` 에 일감번호 저장 (1인 구축 프로젝트 — main 직접 작업)
  - `/commit-push` 신규 — 변경 분석 → 커밋 메시지(`#NNNN [분류] 요약` subject + 선택 body) + Redmine 변경분(제목·진척도·상태·소요시간) 통합 미리보기 → 사용자 확인 1회 → `git add` → `git commit` → `git push` → Redmine PUT → 시간 등록 일괄 처리
    - 커밋 subject 만 Redmine 제목에 반영 (body 는 커밋 전용 — 추가 코멘트 영역)
    - 단계별 부분 실패 시 어디까지 성공했는지 명시하고 후속 조치 안내
  - `init.bat`: `.claude/cache/` 디렉터리 생성 + `.gitignore` 필수 항목에 추가 — 일감번호 캐시 등 개인 작업 컨텍스트 격리
  - `.gitignore` (이 프로젝트): `.claude/cache/` 항목 추가
  - `CLAUDE.md`: 파일 역할표·프로젝트 구조에 워크플로우 스킬 묶음과 `cache/` 디렉터리 반영

---

## 2026-04-30 (4)

- [기능] `.claude/rules/` — 외부 4개 레포 분석 결과 반영, 영역별 규칙 보강
  - 신규: `security.md` (시크릿·입력 검증·SQL 인젝션·XSS·에러 응답·인시던트 대응)
  - 신규: `performance.md` (DB 접근·반복·캐싱·외부 호출·측정 우선)
  - 신규: `documentation.md` (SKILL.md frontmatter·본문 섹션 표준)
  - 보완: `java-style.md` — `## 코드 작성`(함수·파일 크기, 매직넘버, 외부 입력 검증), `## 예외 처리` 섹션 추가
  - 보완: `js-style.md` — boolean 변수·함수 prefix(`is`/`has`/`can`) 추가, `## 코드 작성`·`## 예외 처리` 섹션 추가
  - SQL 인젝션 항목은 `security.md`로 일원화 → `sql-style.md`는 변경 없음

---

## 2026-04-30 (3)

- [기능] `apply-report` 스킬 추가 — `/analyze-report` 보고서의 규칙 후보를 선택적으로 CLAUDE.md / `.claude/rules/` 에 반영
  - 흐름: 보고서 자동 선택(또는 날짜 인자) → `parse-report.js` 로 표 파싱(LLM 재해석 없음) → 적용 후보 미리보기 → 사용자 번호 선택 → 멱등성 체크 → `Edit` 로 적용 → CLAUDE.local.md 공유 가능 섹션 매칭 블록 정리 → CHANGES.md 갱신
  - `parse-report.js`: `## 신규 발견`, `## 개인 규칙 후보 승격 검토`, `## 사용자 가이드 제안`, `## 정보 보완 필요 항목` 4개 섹션의 첫 표를 JSON 으로 출력
  - `find-local-matches.js`: 적용 규칙과 CLAUDE.local.md `## 공유 가능` 블록을 토큰 교집합 유사도(0.4 이상)로 매칭
  - `clean-local-rules.js`: 사용자가 확인한 블록ID 만 `## 공유 가능` 섹션에서 제거 — `## 비공유` 섹션은 절대 건드리지 않음, 인접 빈 줄 3+ 은 1줄로 축약
  - 적용 대상 아님: `[사용자-가이드]` 태그·`정보 보완 필요 항목` 은 미리보기에 참고용으로만 표시
  - 약 강도(`약`) 후보는 기본 제외 — 사용자 명시 요청 시에만 노출
  - 자동 커밋·푸시 없음 — 변경 후 `git diff` 안내만

---

## 2026-04-30 (2)

- [수정] `analyze-report` — 규칙 후보에 `규칙 타입` 분류 도입 (워크플로우/코딩/탐색/지식/사용자-가이드)
  - 보고서 표(`신규 발견`, `개인 규칙 후보 승격 검토`)에 `규칙 타입` 컬럼 추가
  - 4단계 분석 기준에 5종 타입 정의·기본 적용 위치 매핑 추가 — 모호 시 `[코딩규칙]`/`[지식]`로 보수 분류
  - 워크플로우 규칙(커밋·푸시 승인 등)이 코딩 규칙과 한 칸에 섞이지 않도록 분리 → 후속 "규칙 적용" 스킬의 라우팅 기반 마련

---

## 2026-04-30

- [수정] `share-rules` — 공유 규칙 포맷(`### 헤딩` 필수) 정의 및 `extract-shareable.js` 개선
  - `extract-shareable.js`: 부제목과 내용이 별개 행으로 업로드되던 버그 수정 — `###` 헤딩 블록에 이어지는 내용을 하나로 병합
  - `extract-shareable.js`: HTML 주석(`<!--`), `---` 구분자 필터링 추가; 섹션 종료 시 `break`로 즉시 탈출
  - `rule-writing-policy.md`: `## 공유 가능` 작성 포맷 섹션 추가 — `###` 헤딩 필수 명시, Claude 자동 기록 시 형식 준수 유도
  - `init.bat`: 신규 프로젝트의 `CLAUDE.local.md` 템플릿에 형식 예시 HTML 주석 삽입

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
