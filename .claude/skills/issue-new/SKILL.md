---
name: issue-new
description: Redmine에 임시 제목으로 일감을 즉시 생성하고 작업 브랜치(`ing__issue__NNNN`)까지 자동으로 만들어 체크아웃합니다. "이슈 만들어줘", "일감 생성", "/issue-new" 등의 요청에 사용하세요. 작업 시작 전 번호 채번이 목적이며, 제목은 자동으로 "[임시] YYYY-MM-DD HH:MM:SS" 형식으로 생성됩니다. 정식 제목은 커밋 후 /issue-update로 반영됩니다.
---

# Redmine 일감 즉시 생성 + 작업 브랜치 채번

작업 시작 시 일감 번호와 작업 브랜치를 한 번에 확보하는 스킬. 제목은 임시값으로 자동 생성되며, 작업 완료·커밋 후 `/issue-update`로 정식 제목·분류가 반영된다.

전체 흐름:

```
/issue-new
   └─ Redmine에 임시 일감 #NNNN 생성
   └─ ing__issue__NNNN 브랜치 자동 생성·체크아웃 (현재 HEAD에서 분기)

[작업]

[커밋]
   └─ 현재 브랜치명에서 NNNN 추출
   └─ 커밋 메시지: "#NNNN [분류] 요약" (분류: [개편] / [신규] / [수정])

git push

/issue-update
   └─ 직전 커밋에서 #NNNN, [분류], 요약 추출
   └─ Redmine 제목 = "[분류] 요약" (커밋과 100% 일치)
   └─ 진척도 100% + 소요시간 등록
```

브랜치명이 일감번호를 들고 있어 세션이 바뀌어도 번호를 잃어버리지 않는다.

---

## 1단계: 필수 설정 확인

| 환경변수 | 설명 | 필수 |
|----------|------|------|
| `REDMINE_URL` | Redmine 서버 URL | 필수 |
| `REDMINE_API_KEY` | Redmine API 키 | 필수 |
| `REDMINE_DEFAULT_PROJECT` | 기본 프로젝트 identifier | 필수 |

위 세 변수 중 하나라도 없으면 아래 형식으로 `.claude/settings.local.json`에 추가해 달라고 안내하고 작업을 중단합니다.

```json
{
  "env": {
    "REDMINE_URL": "https://your-redmine.example.com",
    "REDMINE_API_KEY": "your_api_key_here",
    "REDMINE_DEFAULT_PROJECT": "project-identifier"
  }
}
```

---

## 2단계: 기본값 초기화 (미설정 시)

아래 환경변수 중 하나라도 없으면 초기화를 진행합니다.

| 환경변수 | 설명 |
|----------|------|
| `REDMINE_DEFAULT_ASSIGNED_TO_ID` | 기본 담당자 ID |
| `REDMINE_DEFAULT_VERSION_ID` | 기본 목표버전 ID |
| `REDMINE_DEFAULT_PRIORITY_ID` | 기본 우선순위 ID |

### 초기화 절차

아래 API를 **병렬**로 호출하여 선택지를 수집합니다.

```bash
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/users/current.json"
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/projects/{project}/versions.json"
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/enumerations/issue_priorities.json"
```

수집 후 사용자에게 담당자·목표버전·우선순위를 선택받아 `.claude/settings.local.json`의 `env` 섹션에 저장합니다.

```json
{
  "env": {
    "REDMINE_DEFAULT_ASSIGNED_TO_ID": "26",
    "REDMINE_DEFAULT_VERSION_ID": "10",
    "REDMINE_DEFAULT_PRIORITY_ID": "2"
  }
}
```

저장 후 일감 생성을 이어서 진행합니다.

---

## 3단계: 작업트리 사전 점검

API 호출(=일감 채번) 전에 작업트리 상태를 확인해 고아 일감이 생기지 않도록 한다.

```bash
git status --porcelain
git rev-parse --abbrev-ref HEAD
```

### 미커밋 변경이 있는 경우

사용자에게 옵션을 제시하고 선택받기 전에는 **API 호출하지 않는다**.

```
작업트리에 커밋되지 않은 변경이 있습니다:
{git status --porcelain 결과 요약}

어떻게 처리할까요?
  (1) 새 브랜치로 변경분을 가지고 이동 (그대로 checkout -b)
  (2) 변경분을 stash 후 새 브랜치 생성 (`git stash push -u -m "issue-new auto"`)
  (3) 취소 (일감 생성하지 않음)
```

선택에 따라:
- (1) → 그대로 진행 (브랜치 생성 시 변경분이 따라감)
- (2) → 6단계 직전에 `git stash push -u -m "issue-new auto"` 실행, 응답에 stash 사실 안내
- (3) → 즉시 종료, 아무것도 변경하지 않음

### 이미 `ing__issue__NNNN` 형태 브랜치에 있는 경우

경고만 출력하고 사용자 확인 후 진행합니다 (다른 일감을 의도적으로 새로 만드는 경우가 있으므로 차단하지 않음).

```
현재 브랜치 '{branch}'가 이미 일감 작업 브랜치 형태입니다.
새 일감을 만들고 새 브랜치로 이동하시겠습니까? (y/N)
```

---

## 4단계: 임시 제목 생성

현재 시각을 한국 시간(KST) 기준으로 가져와 아래 형식으로 제목을 만듭니다.

```
[임시] YYYY-MM-DD HH:MM:SS
```

예: `[임시] 2026-04-28 14:30:25`

---

## 5단계: API 호출

미리보기·확인 단계 없이 바로 호출합니다.

```bash
curl -s -X POST \
  -H "X-Redmine-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "project_id": "{project_id}",
      "tracker_id": 10,
      "subject": "{subject}",
      "priority_id": {priority_id},
      "assigned_to_id": {assigned_to_id},
      "fixed_version_id": {fixed_version_id}
    }
  }' \
  "{redmine_url}/issues.json"
```

- 빈값 필드는 JSON 페이로드에서 제외합니다 (null 전송 금지).
- `project_id`는 프로젝트 identifier(문자열) 또는 숫자 ID 모두 사용 가능.
- **한글 등 멀티바이트 문자는 반드시 유니코드 이스케이프(`\uXXXX`)로 변환 후 전송합니다.** 서버 WAF가 멀티바이트 문자를 직접 차단합니다.

응답에서 `issue.id`를 추출해 `NNNN`으로 사용합니다.

---

## 6단계: 브랜치 자동 생성

API 성공 직후 현재 HEAD에서 분기하여 작업 브랜치를 만들고 체크아웃합니다.

```bash
git checkout -b ing__issue__{NNNN}
```

- 분기 베이스: 현재 HEAD (사용자가 위치한 브랜치 그대로)
- 동일 이름 브랜치가 이미 있으면 `git checkout ing__issue__{NNNN}`으로 전환만 (생성 실패 시 fallback)
- 3단계에서 stash를 선택했다면 체크아웃 후 안내: `복원하려면 git stash pop 을 실행하세요.` (자동 pop은 하지 않음 — 충돌 위험)

체크아웃 실패 시: Redmine 일감은 이미 생성된 상태이므로 사용자에게 일감 번호와 함께 수동 체크아웃을 안내합니다.

---

## 7단계: 결과 출력

### 성공

```
✅ 임시 일감이 생성되었습니다.
- 일감 번호: #1234
- 제목: [임시] 2026-04-28 14:30:25
- URL: {redmine_url}/issues/1234
- 작업 브랜치: ing__issue__1234 (현재 체크아웃됨)

다음 작업 가이드:
- 이 브랜치의 커밋은 다음 형식을 따릅니다 → "#1234 [분류] 요약"
  - 분류: [개편] (구조·아키텍처·UI 큰 변경) / [신규] (새 기능·새 파일) / [수정] (오류·로직 수정)
- 작업 완료 후 커밋·푸시한 뒤 /issue-update 로 정식 제목·진척도·소요시간을 일괄 반영하세요.
```

stash를 진행한 경우 끝부분에 한 줄 추가:

```
- 이전 작업트리 변경분은 stash 되었습니다 → 복원: git stash pop
```

### 실패

HTTP 상태 코드와 응답 본문을 그대로 보여주고, 가능한 원인을 한 줄로 설명합니다.
브랜치 생성 단계에서 실패한 경우 일감 번호·URL은 정상 출력하고 브랜치 부분만 실패 사유를 명시합니다.
