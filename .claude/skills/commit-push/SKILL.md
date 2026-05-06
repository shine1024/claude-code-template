---
name: commit-push
description: 작업 완료 후 변경분을 분석해 커밋 메시지(`#NNNN [분류] 요약`)를 자동 생성하고, 사용자 한 번의 확인으로 커밋·푸시·Redmine 일감 갱신(제목·진척도·소요시간)까지 일괄 처리한다. "커밋해줘", "푸시해줘", "/commit-push" 등의 요청에 사용한다. 일감번호는 브랜치명(`ing__issue__NNNN`) 또는 `.claude/cache/current_issue` 캐시에서 자동 추출한다.
---

# 작업 종료 통합 스킬 — 커밋 + 푸시 + Redmine 갱신

`/issue-new` 로 시작한 작업의 마무리 단계. 변경 내용을 분석해 커밋 메시지와 Redmine 일감 변경분을 한 화면에 보여주고, 사용자 확인 한 번으로 모든 후속 동작을 일괄 실행한다.

전체 흐름:

```
/commit-push
   └─ 일감번호 추출: 브랜치명 → .claude/cache/current_issue → 사용자 입력
   └─ 변경 분석: git status / git diff
   └─ 커밋 메시지 초안: subject = "#NNNN [분류] 요약" / body = (선택)
   └─ Redmine 변경분 산출: 제목·진척도·소요시간
   └─ 통합 미리보기 1회 출력 → 사용자 확인 (수정 요청 시 반영 후 다시 출력)
   └─ 확인 시: git add → git commit → git push → Redmine PUT → 시간 등록
   └─ 단계별 결과 보고
```

> 외부에서 푸시를 이미 한 후 일감만 갱신하려면 `/issue-update` 를 단독 호출한다.

---

## 1단계: 설정 확인

| 환경변수 | 설명 | 필수 |
|----------|------|------|
| `REDMINE_URL` | Redmine 서버 URL | 필수 |
| `REDMINE_API_KEY` | Redmine API 키 | 필수 |
| `REDMINE_STATUS_ID_DONE` | 완료 처리용 status ID — 미설정 시 상태 변경 건너뜀 | 선택 |

필수값이 없으면 `.claude/settings.local.json`의 `env` 섹션에 추가해 달라고 안내하고 중단한다.

---

## 2단계: 일감번호 추출

아래 순서로 시도하고 먼저 발견된 값을 사용한다.

1. 현재 브랜치명에서 `ing__issue__NNNN` 패턴 — `git rev-parse --abbrev-ref HEAD`
2. `.claude/cache/current_issue` 파일의 첫 줄 (`/issue-new` 가 `BRANCH_STRATEGY=never` 모드에서 기록)
3. 둘 다 없으면 사용자에게 일감번호를 입력받는다 (`#` 없이 숫자만)

`NNNN` 자릿수는 고정이 아니며 시스템마다 다르다 — 정규식은 `ing__issue__(\d+)` 와 같이 1자리 이상의 연속된 숫자를 매칭한다.

---

## 3단계: 변경 분석

```bash
git status --porcelain
git diff --stat
git diff --cached --stat
git diff
```

수집 항목:
- 변경된 파일 목록 (스테이징·언스테이징 모두)
- 변경 라인 수
- 실제 diff 내용 (분류·요약 추정용)

### 커밋 대상 결정

기본은 **모든 변경분을 자동 스테이징**(`git add -A`)한다. 단, 미리보기 단계에서 사용자가 다음을 지시하면 그에 따른다.

- "추적 안 된 파일은 빼" → `git add -u`
- "특정 파일만" → 사용자가 지정한 파일만 `git add <files>`
- ".gitignore 안 된 .env 같은 게 보이면 경고만 하고 멈춤"

미리보기 출력 시 **`?? 접두` 신규 파일 중 민감 패턴**(`.env`, `*credentials*`, `*secret*`, `*.key`, `*.pem`)이 보이면 사용자에게 경고 후 명시적 확인을 받는다.

---

## 4단계: 커밋 메시지 초안 생성

### 분류 (`[xxx]`)

변경 내용을 분석해 셋 중 하나로 매핑한다.

| 분류 | 기준 |
|------|------|
| `[개편]` | 구조·아키텍처·UI 큰 폭 변경, 리팩터링, 대규모 정리 |
| `[신규]` | 새 기능·새 화면·새 파일 추가 |
| `[수정]` | 기존 기능의 오류·로직 수정, 작은 변경 |

> 프로젝트별로 분류 셋이 다르면 해당 프로젝트의 `CLAUDE.md` 규칙을 우선한다.

### 요약 (subject)

변경 파일과 diff를 보고 한 문장(공백 포함 30자 내외)으로 요약한다. 너무 일반적인 표현(`개선`, `수정` 단독)은 피하고 가능한 한 구체적인 대상을 명시한다.

### subject 조립

```
#{NNNN} [{분류}] {요약}
```

예: `#1234 [수정] 사용자 로그인 토큰 만료 처리`

### body (선택)

기본은 비워둔다. 사용자가 미리보기 단계에서 코멘트를 요청하면 subject 다음에 빈 줄을 두고 본문을 추가한다.

```
#1234 [수정] 사용자 로그인 토큰 만료 처리

auth 모듈 토큰 재발급 경로 보강.
세션 만료 시 401 반환 대신 redirect 처리.
```

> body는 커밋에만 들어가고 Redmine 제목엔 반영되지 않는다.

---

## 5단계: Redmine 변경분 산출

### 일감 현재 정보 조회

```bash
curl -s -H "X-Redmine-API-Key: {api_key}" "{redmine_url}/issues/{issue_id}.json"
```

응답에서 `created_on`, `subject`, `status`, `done_ratio`를 보관한다.

### 새 제목

subject 라인에서 `#NNNN ` 부분을 제거한 나머지를 그대로 사용한다.

```
#1234 [수정] 사용자 로그인 토큰 만료 처리   ← 커밋 subject
       [수정] 사용자 로그인 토큰 만료 처리   ← Redmine 제목
```

### 진척도

`done_ratio: 100` 으로 고정.

### 상태

- `REDMINE_STATUS_ID_DONE` 설정 시 → `status_id: <env값>` 포함
- 미설정 → `status_id` 필드 자체를 페이로드에서 **제외**

### 소요시간

```
시작: 일감 created_on (Redmine API)
종료: 현재 시각 (KST) — 아직 커밋 전이므로 git 커밋 시각이 아닌 "지금"
hours = (종료 - 시작) / 3600  (소수점 둘째 자리 반올림)
```

- 음수가 나오면 `0.1` 로 보정
- 24시간 초과 시 미리보기에서 `(주의: 24h 초과)` 표시

### 활동 분류 ID 조회 (개발 / Development 고정)

```bash
curl -s -H "X-Redmine-API-Key: {api_key}" \
  "{redmine_url}/enumerations/time_entry_activities.json"
```

`name` 이 정확히 `"개발"` 또는 `"Development"` 인 항목의 `id` 사용 (한국어 우선). 둘 다 없으면 시간 등록을 건너뛰고 미리보기에 경고 표기.

---

## 6단계: 통합 미리보기

확인 한 번으로 7단계 전체가 실행되므로, 모든 변경분을 한 화면에 정리한다.

```
## /commit-push 미리보기 (#1234)

### 변경 파일 (5개, +120 / -34)
  M  src/auth/token.js
  M  src/api/login.js
  ?? tests/auth/token.spec.js
  ...

### 커밋 메시지
제목: #1234 [수정] 사용자 로그인 토큰 만료 처리
본문: (없음)

### Redmine 일감 #1234
| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 제목 | [임시] 2026-04-28 14:30:25 | [수정] 사용자 로그인 토큰 만료 처리 |
| 진척도 | 0% | 100% |
| 상태 | 진행중 | 실적 (status_id=5) — env 설정 시 |
| 소요시간 | — | 2.5h (2026-04-28 14:30 ~ 17:00, 활동: 개발) |

### 푸시 대상
- 브랜치: ing__issue__1234 → origin/ing__issue__1234

이대로 진행할까요? (확인 / 수정사항 알려주시면 반영합니다)
```

### 사용자 수정 요청 처리

사용자가 다음과 같이 요청하면 해당 부분만 갱신해 다시 미리보기를 출력한다.

- "분류를 [개편] 으로" → 분류 변경 → 제목 재조립
- "요약을 'XXX' 로" → 요약 변경 → 제목 재조립
- "본문에 'YYY' 추가" → body 추가 (subject·Redmine 제목엔 영향 없음)
- "소요시간 1.5h 로" → 시간만 수정
- "푸시는 빼고 커밋만" → 푸시 단계 스킵 표시
- "지금 풀 안 받았으니 푸시는 멈춰" → 푸시 단계 스킵 표시

> 분류·요약·body 외에 사용자가 임의의 subject 전체를 직접 지정할 수도 있다. 그 경우 `[분류]` 와 `요약` 을 역추출해 Redmine 제목을 동기화한다.

미리보기 표시 항목 중 `REDMINE_STATUS_ID_DONE` 미설정 시 "상태" 행에 `(env 미설정 — 변경 안 함)` 표시.

---

## 7단계: 일괄 실행

사용자가 확인하면 아래 순서로 실행한다. 어느 단계에서 실패하면 즉시 중단하고 7단계 결과 출력에서 어느 지점까지 성공했는지 명시한다.

### 7-1. 스테이징 + 커밋

```bash
git add -A     # (또는 사용자가 지정한 파일·범위)
git commit -F <메시지 임시 파일>
```

- 커밋 메시지는 멀티라인 안전을 위해 임시 파일 또는 stdin (`git commit -F-`) 으로 전달
- 한글 등 멀티바이트가 들어가도 그대로 (git 자체는 UTF-8 OK)

### 7-2. 푸시

```bash
git push origin HEAD
```

- 미리보기에서 푸시를 스킵하기로 한 경우 이 단계를 건너뛰고 그대로 7-3 도 스킵 (Redmine 일감만 갱신은 의도와 어긋남)
- 원격 추적 브랜치가 없으면 `git push -u origin HEAD` 로 폴백

### 7-3. Redmine 일감 PUT

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

- **한글 등 멀티바이트 문자는 반드시 유니코드 이스케이프(`\uXXXX`)로 변환 후 전송한다.** 서버 WAF가 멀티바이트 문자를 직접 차단한다.

### 7-4. 작업시간 등록

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

- 활동 ID 조회 실패 시(개발/Development 미존재) 이 요청은 건너뛴다.
- 7-3 이 실패하면 7-4 는 실행하지 않는다.

---

## 8단계: 결과 출력

### 모두 성공

```
[성공] /commit-push 완료
- 커밋: abc1234 "#1234 [수정] 사용자 로그인 토큰 만료 처리"
- 푸시: ing__issue__1234 → origin/ing__issue__1234
- 일감 #1234:
  - 제목: [수정] 사용자 로그인 토큰 만료 처리
  - 진척도: 100%
  - 상태: 실적 (또는 "변경 안 함" — env 미설정 시)
  - 소요시간: 2.5h 등록 (활동: 개발)
  - URL: {redmine_url}/issues/1234
```

### 부분 실패

어느 단계까지 성공했는지 명확히 표시한다.

```
[주의] /commit-push 부분 완료
- [성공] 커밋: abc1234 ...
- [실패] 푸시 실패: {원인 — 예: rejected, non-fast-forward}
- [건너뜀] Redmine 갱신 스킵 (푸시 실패로 보류)

다음 조치:
- git pull --rebase 후 다시 git push
- 푸시 성공 후 /issue-update 로 일감만 갱신
```

```
[주의] /commit-push 부분 완료
- [성공] 커밋: abc1234 ...
- [성공] 푸시: ...
- [실패] Redmine 갱신 실패: HTTP {코드} — {원인 한 줄}

다음 조치:
- /issue-update 로 일감만 다시 시도
```

### 빈 변경

`git status --porcelain` 결과가 비어 있으면 즉시 종료:

```
변경된 파일이 없어 커밋할 내용이 없습니다.
```
