---
name: issue-new
description: Redmine에 임시 제목으로 일감을 즉시 생성하고 번호를 반환합니다. "이슈 만들어줘", "일감 생성", "/issue-new" 등의 요청에 사용하세요. 작업 시작 전 번호 채번이 목적이며, 제목은 자동으로 "임시 - YYYY-MM-DD HH:MM:SS" 형식으로 생성됩니다. 정식 제목은 커밋 후 /issue-update로 반영됩니다.
---

# Redmine 일감 즉시 생성 (번호 채번용)

작업 시작 시 일감 번호만 빠르게 확보하기 위한 스킬. 제목은 임시값으로 자동 생성되며, 작업 완료·커밋 후 `/issue-update`로 정식 제목·분류가 반영된다.

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

## 3단계: 임시 제목 생성

현재 시각을 한국 시간(KST) 기준으로 가져와 아래 형식으로 제목을 만듭니다.

```
임시 - YYYY-MM-DD HH:MM:SS
```

예: `임시 - 2026-04-28 14:30:25`

---

## 4단계: API 호출

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

---

## 5단계: 결과 출력

### 성공

```
✅ 임시 일감이 생성되었습니다.
- 일감 번호: #1234
- 제목: 임시 - 2026-04-28 14:30:25
- URL: {redmine_url}/issues/1234

작업 완료 후 /issue-update 로 정식 제목을 반영하세요.
```

### 실패

HTTP 상태 코드와 응답 본문을 그대로 보여주고, 가능한 원인을 한 줄로 설명합니다.
