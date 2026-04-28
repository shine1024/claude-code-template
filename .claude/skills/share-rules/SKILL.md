---
name: share-rules
description: CLAUDE.local.md 의 "공유 가능" 섹션 규칙을 추출하여 Google Sheets 의 "3) 개인 규칙 후보" 시트에 업로드합니다. "규칙 공유", "팀 규칙 올려줘", "/share-rules" 등의 요청에 사용하세요. 미리보기로 사용자 확인을 받은 후에만 업로드합니다.
---

## 목적

각자의 `CLAUDE.local.md` 에 쌓인 개인 규칙 중 **공유 가능 섹션**만 안전하게 추출하여
Google Sheets 의 개인 규칙 후보 풀에 적재합니다. 이후 `/analyze-report` 가 session-log 와 함께 분석해 전역 `CLAUDE.md` 승격 후보를 도출합니다.

---

## CLAUDE.local.md 섹션 컨벤션

`CLAUDE.local.md` 는 두 섹션으로 나누어 관리합니다.

```markdown
## 공유 가능

규칙 1: 팀에 공유해도 좋은 일반화 가능한 패턴

규칙 2: 한 규칙 = 한 블록 (빈 줄로 구분). 여러 줄로 풀어 쓸 수 있음.

- 짧은 규칙은 불릿 한 줄로 작성
- 단, 빈 줄 없이 이어진 불릿들은 한 블록(한 규칙)으로 합쳐 업로드됨

## 비공유
개인 환경 경로, 사번, 사내 URL 등 외부 공유 부적절한 항목.
이 섹션은 절대 업로드되지 않습니다.
```

추출 규칙
- `## 공유 가능` 헤딩 ~ 다음 `##` 헤딩 또는 EOF 까지가 대상
- 빈 줄로 구분된 각 블록이 한 규칙
- 위 두 섹션 외 본문(헤딩 없는 영역)은 안전을 위해 업로드 안 됨

---

## 1단계: 환경변수 확인

| 환경변수 | 용도 |
|----------|------|
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Google 서비스 계정 키 경로 |
| `GOOGLE_SHEETS_FEEDBACK_ID` | 대상 Spreadsheet ID |
| `GOOGLE_SHEETS_PERSONAL_RULES_GID` | 개인 규칙 후보 시트의 gid (시트 URL `?gid=...` 값) |
| `PROJECT_NAME` | 프로젝트명 (시트의 `project` 컬럼에 기록) |
| `SESSION_USER_NAME` | 작성자 이름 |

미설정 시 `.claude/guides/google-sheets-setup.md` 안내 후 중단합니다.

---

## 2단계: 공유 가능 섹션 추출

```bash
node "{SKILL_DIR}/scripts/extract-shareable.js"
```

출력은 JSON 배열입니다. 각 요소는 한 개 규칙(빈 줄 단위로 구분된 블록)입니다.

추출된 규칙이 0건이면 아래 메시지를 출력하고 종료합니다.

```
공유 가능 섹션이 비어 있습니다. CLAUDE.local.md 에 "## 공유 가능" 섹션을 작성한 뒤 다시 시도하세요.
```

---

## 3단계: 미리보기

추출된 규칙을 사용자에게 표 형식으로 보여주고 업로드 여부를 확인합니다.

```
다음 N건의 규칙을 "3) 개인 규칙 후보" 시트에 업로드합니다.

| # | 규칙 |
|---|------|
| 1 | ... |
| 2 | ... |

업로드할까요? (예/아니오)
```

사용자가 "아니오" 또는 수정 요청 시 업로드하지 않고 종료합니다.

---

## 4단계: 업로드

사용자가 확인하면 아래 스크립트로 적재합니다.

```bash
node "{SKILL_DIR}/scripts/upload-rules.js"
```

스크립트는 stdin 으로 JSON 배열을 받습니다. 각 규칙은 별도 행으로 append 됩니다.

성공 시 다음 메시지를 출력합니다.

```
N건의 규칙을 "3) 개인 규칙 후보" 시트에 업로드했습니다.
```

---

## Sheets 컬럼 구성 — 개인 규칙 후보 시트 (5열)

| 컬럼 | 내용 |
|------|------|
| A `date` | 업로드 날짜 (YYYY-MM-DD) |
| B `name` | 작성자 (`$SESSION_USER_NAME`) |
| C `project` | 프로젝트명 (`$PROJECT_NAME`) |
| D `rule` | 규칙 본문 (한 블록) |
| E `클로드 분석여부` | analyze-report 처리 후 날짜 기입 (비어 있을 때만 분석 대상) |

> 시트는 사전에 만들어 두고 `GOOGLE_SHEETS_PERSONAL_RULES_GID` 에 gid 를 등록해야 합니다.
> 1행: 자유 설명, 2행: 헤더(`date`, `name`, `project`, `rule`, `클로드 분석여부`), 3행~: 데이터.
