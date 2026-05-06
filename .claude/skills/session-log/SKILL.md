---
name: session-log
description: 세션 회고를 작성하고 Google Sheets에 제출한다. "회고 작성해줘", "세션 로그", "/session-log" 등의 요청에 사용한다.
---

## 개요

현재 세션의 대화 흐름·잘된 점·잘못된 점을 정리해 Google Sheets 회고 시트에 한 행으로 기록한다.

## 사용 시점
- 작업 세션 종료 시점에 사용자가 회고를 요청할 때
- 트리거 표현: `회고 작성해줘`, `세션 로그 남겨줘`, `/session-log`

## 실행 절차

### 1단계: 사전 정보 수집
아래 값을 확인한다:
- **이름**: 환경변수 `$SESSION_USER_NAME`
- **프로젝트명**: 환경변수 `$PROJECT_NAME`
- **환경변수**: `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, `GOOGLE_SHEETS_FEEDBACK_ID`, `GOOGLE_SHEETS_SESSION_LOG_GID`, `PROJECT_NAME`, `SESSION_USER_NAME` 가 모두 설정되어야 한다. 미설정 시 `.claude/guides/google-sheets-setup.md` 안내 후 중단한다.

### 2단계: 회고 초안 작성
현재 세션 대화 전체를 분석하여 아래 항목의 초안을 작성한다:

| 항목 | 작성 기준 |
|------|-----------|
| 날짜 | 오늘 날짜 (YYYY-MM-DD) |
| 이름 | `$SESSION_USER_NAME` 값 |
| 프로젝트명 | `$PROJECT_NAME` 값 |
| 요구사항 | 이번 세션에서 사용자가 요청한 작업 요약 |
| 대화흐름 | 대화 전개 흐름 요약 (요청→오해→재설명→해결 등의 흐름을 간결하게) |
| 잘된점 | 원활하게 처리된 부분, 좋았던 상호작용 |
| 잘못된점 | 문제가 발생한 부분 (없으면 "없음") |
| 원인분석 | 왜 잘못됐는지 — 사람의 요청 문제 / AI 해석 문제 / 규칙 누락 등 (없으면 "없음") |
| 개선내용 | CLAUDE.md 규칙 / 프롬프트 방식 / 스킬·훅 중 무엇을 어떻게 개선할지 (없으면 "없음") |
| 기타 | 그 외 특이사항 (없으면 "없음") |

여러 항목이 있는 경우 줄바꿈(`\n`)으로 구분한다.

### 3단계: 초안 확인
작성된 회고 전체를 아래 형식으로 보여주고 수정 또는 제출 확인을 요청한다.

```
| 항목       | 내용 |
|------------|------|
| 날짜       | ...  |
| 이름       | ...  |
| 프로젝트명 | ...  |
| 요구사항   | ...  |
| 대화흐름   | ...  |
| 잘된점     | ...  |
| 잘못된점   | ...  |
| 원인분석   | ...  |
| 개선내용   | ...  |
| 기타       | ...  |
```

사용자가 수정을 요청하면 해당 항목만 수정 후 다시 확인을 요청한다.

### 4단계: 제출
사용자가 확인하면 회고 항목을 JSON 으로 만들어 `append-session.js` 의 stdin 으로 전달한다.

```bash
node -e "
const data = {
  date: '${날짜}',
  name: process.env.SESSION_USER_NAME,
  project: process.env.PROJECT_NAME,
  requirements: '${요구사항}',
  conversationFlow: '${대화흐름}',
  wentWell: '${잘된점}',
  wentWrong: '${잘못된점}',
  rootCause: '${원인분석}',
  improvement: '${개선내용}',
  other: '${기타}'
};
process.stdout.write(JSON.stringify(data));
" | node "{SKILL_DIR}/scripts/append-session.js"
```

값 내 줄바꿈은 `\n`으로 구분한다. 큰따옴표는 사용하지 않는다.

제출이 완료되면 "Google Sheets에 회고가 기록되었습니다." 메시지를 출력한다.
