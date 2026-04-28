---
name: issue-update
description: 직전 커밋의 일감번호와 변경 내용을 분석하여 Redmine 일감 제목을 "[분류] 요약"으로 업데이트하고, 진척도(100%)·소요시간을 함께 반영합니다. 상태는 `REDMINE_STATUS_ID_DONE` 환경변수가 설정된 경우에만 변경됩니다. "이슈 업데이트", "일감 수정", "/issue-update" 등의 요청에 사용하세요. issue-new로 임시 생성한 일감을 정식 제목으로 반영하는 용도입니다.
---

# Redmine 일감 자동 업데이트 (커밋 기반)

직전 커밋 정보를 분석해 아래 항목을 한 번에 업데이트한다.

- **제목** — 정식 형태(`[분류] 요약`)
- **진척도** — 100%
- **상태** — `REDMINE_STATUS_ID_DONE` 설정 시에만 해당 ID로 변경 (미설정 시 변경 안 함)
- **소요시간** — 일감 생성 시각 ~ 직전 커밋 시각으로 계산해 작업시간 등록 (활동 분류: `개발` / `Development` 고정)

---

## 1단계: 설정 확인

| 환경변수 | 설명 | 필수 |
|----------|------|------|
| `REDMINE_URL` | Redmine 서버 URL | 필수 |
| `REDMINE_API_KEY` | Redmine API 키 | 필수 |
| `REDMINE_STATUS_ID_DONE` | "실적" 등 완료 처리용 status ID. 미설정 시 상태 변경 건너뜀 | 선택 |

필수값이 없으면 `.claude/settings.local.json`의 `env` 섹션에 추가해 달라고 안내하고 중단합니다.

---

## 2단계: 직전 커밋 정보 수집

```bash
git log -1 --format="%H%n%s%n%b"
git show -1 --stat --format=""
```

수집 항목:
- 커밋 메시지 (제목 + 본문)
- 변경 파일 목록 + 변경 라인 수

### 일감번호 추출

커밋 메시지에서 `#숫자` 패턴을 찾아 일감번호로 사용합니다.
- 메시지 안에 `#번호`가 없으면 사용자에게 일감번호를 입력받습니다.
- 여러 개가 있으면 첫 번째를 사용합니다.

---

## 3단계: 분류·요약 자동 생성

### 분류 (`[xxx]`)

커밋 메시지의 prefix `[xxx]`가 아래 셋 중 하나면 그대로 사용합니다.
다른 prefix이거나 prefix가 없으면 변경 내용을 분석해 셋 중 하나로 매핑합니다.

| 분류 | 기준 |
|------|------|
| `[개편]` | 구조·아키텍처·UI 큰 폭 변경, 리팩터링, 대규모 정리 |
| `[신규]` | 새 기능·새 화면·새 파일 추가 |
| `[수정]` | 기존 기능의 오류·로직 수정, 작은 변경 |

### 요약

커밋 메시지의 제목에서 일감번호와 분류 prefix를 제거한 본문을 그대로 사용합니다.
prefix가 없거나 메시지가 부족하면 변경 파일과 diff를 보고 한 문장(20자 내외)으로 요약합니다.

### 새 제목 조립

```
[{분류}] {요약}
```

예: `[수정] 사용자 로그인 버그 수정`

> 커밋 메시지에는 `#일감번호`를 포함하지만 Redmine 제목에서는 제외합니다 (Redmine UI에 일감번호가 별도 표시되므로 중복 표기 방지).

---

## 4단계: 추가 업데이트 항목 산출

### 일감 현재 정보 조회

```bash
curl -s -H "X-Redmine-API-Key: {api_key}" "{redmine_url}/issues/{issue_id}.json"
```

응답에서 `created_on`(ISO8601, UTC), `subject`, `status`, `done_ratio`를 보관합니다.

### 진척도

`done_ratio: 100`으로 고정.

### 상태

- `REDMINE_STATUS_ID_DONE` 환경변수가 설정된 경우 → `status_id: <env값>`을 PUT 페이로드에 포함
- 미설정 → `status_id` 필드 자체를 페이로드에서 **제외** (상태 변경 안 함)

### 소요시간 계산

```
시작: 일감 created_on (Redmine API 응답)
종료: 직전 커밋 시각 → git log -1 --format=%cI
hours = (종료 - 시작) / 3600  (소수점 둘째 자리 반올림)
```

- 음수가 나오면(시계 오차 등) `0.1`로 보정
- 24시간 초과 시 그대로 두되 미리보기에서 강조 표시

### 시간 활동 분류 ID 조회 (개발 / Development 고정)

```bash
curl -s -H "X-Redmine-API-Key: {api_key}" \
  "{redmine_url}/enumerations/time_entry_activities.json"
```

응답의 `time_entry_activities[]`에서 `name`이 정확히 `"개발"` 또는 `"Development"`인 항목의 `id`를 사용합니다 (한국어 이름 우선).

- 둘 다 없으면 시간 등록을 **건너뛰고** 사용자에게 경고: `"개발/Development 활동이 Redmine에 없어 소요시간 등록을 건너뜁니다. 관리자에게 활동 추가를 요청하세요."`

---

## 5단계: 미리보기 출력

```
## Redmine 일감 업데이트 미리보기 (#1234)

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 제목 | 임시 - 2026-04-28 14:30:25 | [수정] 사용자 로그인 버그 수정 |
| 진척도 | 0% | 100% |
| 상태 | 진행중 | 실적 (status_id=5) — env 설정 시 |
| 소요시간 | — | 2.5h (2026-04-28 14:30 ~ 17:00, 활동: 개발) |

업데이트하시겠습니까? (확인 / 분류·요약·소요시간 수정 가능)
```

- `REDMINE_STATUS_ID_DONE` 미설정 시 "상태" 행에 `(env 미설정 — 변경 안 함)` 표시
- 사용자가 분류·요약·시간 수정을 요청하면 해당 부분만 갱신 후 미리보기를 다시 출력합니다.

---

## 6단계: API 호출

사용자가 확인하면 아래 두 요청을 순서대로 보냅니다.

### 6-1. 일감 업데이트 (제목 + 진척도 + 선택적 상태)

```bash
curl -s -X PUT \
  -H "X-Redmine-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "subject": "{new_subject}",
      "done_ratio": 100
      /* status_id은 REDMINE_STATUS_ID_DONE 설정 시에만 포함 */
    }
  }' \
  "{redmine_url}/issues/{issue_id}.json"
```

- **한글 등 멀티바이트 문자는 반드시 유니코드 이스케이프(`\uXXXX`)로 변환 후 전송합니다.** 서버 WAF가 멀티바이트 문자를 직접 차단합니다.
- 성공 시 HTTP 200 반환 (응답 본문 없음).

### 6-2. 작업시간 등록

```bash
curl -s -X POST \
  -H "X-Redmine-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "time_entry": {
      "issue_id": {issue_id},
      "hours": {계산된 시간},
      "activity_id": {개발 활동 ID},
      "spent_on": "{커밋 날짜 YYYY-MM-DD}",
      "comments": "{새 제목}"
    }
  }' \
  "{redmine_url}/time_entries.json"
```

- 활동 ID 조회 실패 시(개발/Development 미존재) 이 요청은 건너뜁니다.
- 6-1이 실패하면 6-2는 실행하지 않습니다.

---

## 7단계: 결과 출력

### 성공

```
✅ 일감이 업데이트되었습니다.
- 일감 번호: #1234
- 제목: [수정] 사용자 로그인 버그 수정
- 진척도: 100%
- 상태: 실적 (또는 "변경 안 함" — env 미설정 시)
- 소요시간: 2.5h 등록 (활동: 개발)
- URL: {redmine_url}/issues/1234
```

### 실패

HTTP 상태 코드와 응답 본문을 그대로 보여주고, 가능한 원인을 한 줄로 설명합니다. 일감 업데이트와 시간 등록 중 하나만 실패한 경우 어느 쪽이 성공/실패했는지 명시합니다.
