---
name: redmine-issue-creator
description: 개발자가 자유 형식으로 설명한 내용을 바탕으로 Redmine 일감을 자동 생성합니다. "레드마인에 일감 만들어줘", "이슈 등록해줘", "작업 추가해줘", "버그 등록해줘" 등의 요청에 반드시 이 스킬을 사용하세요. Redmine REST API를 통해 필드를 추출하고 일감을 생성합니다.
---

# Redmine 일감 자동 생성 스킬

개발자의 자유 형식 텍스트에서 일감 필드를 추출하고 Redmine REST API로 일감을 생성합니다.

---

## 1단계: 필수 설정 확인

아래 환경변수가 설정되어 있는지 확인합니다.

| 환경변수 | 설명 | 필수 |
|----------|------|------|
| `REDMINE_URL` | Redmine 서버 URL | 필수 |
| `REDMINE_API_KEY` | Redmine API 키 | 필수 |
| `REDMINE_DEFAULT_PROJECT` | 기본 프로젝트 identifier | 필수 |

`REDMINE_URL` 또는 `REDMINE_API_KEY`가 없으면 아래 형식으로 `.claude/settings.local.json`에 추가해 달라고 안내하고 작업을 중단합니다.

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

## 2단계: 초기화 (기본값 미설정 시)

아래 환경변수 중 하나라도 없으면 초기화를 진행합니다.

| 환경변수 | 설명 |
|----------|------|
| `REDMINE_DEFAULT_ASSIGNED_TO_ID` | 기본 담당자 ID |
| `REDMINE_DEFAULT_VERSION_ID` | 기본 목표버전 ID |
| `REDMINE_DEFAULT_PRIORITY_ID` | 기본 우선순위 ID |

### 초기화 절차

아래 API를 **병렬**로 호출하여 선택지를 수집합니다.

```bash
# 내 사용자 정보
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/users/current.json"

# 목표버전 목록
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/projects/{project}/versions.json"

# 우선순위 목록
curl -s -H "X-Redmine-API-Key: {api_key}" "{url}/enumerations/issue_priorities.json"
```

수집 후 아래 형식으로 사용자에게 선택을 요청합니다.

```
## Redmine 기본값 초기 설정

**담당자** (기본 담당자를 선택하세요)
- 현재 사용자: 신봉수 (id: 26) — 엔터로 선택

**목표버전** (기본 목표버전을 선택하세요, 없으면 엔터)
1. 01. 완료 (id: 10)
2. 개선사항 (id: 36)
...

**우선순위** (기본 우선순위를 선택하세요)
1. 낮음 (id: 1)
2. 보통 (id: 2)
3. 높음 (id: 3)
...
```

사용자가 선택을 완료하면 `.claude/settings.local.json`의 `env` 섹션에 선택값을 저장합니다.

```json
{
  "env": {
    "REDMINE_DEFAULT_ASSIGNED_TO_ID": "26",
    "REDMINE_DEFAULT_VERSION_ID": "10",
    "REDMINE_DEFAULT_PRIORITY_ID": "2"
  }
}
```

저장 후 일감 등록을 이어서 진행합니다.

---

## 3단계: 필드 추출

사용자의 자유 텍스트에서 아래 필드를 추출합니다. 환경변수에 저장된 기본값을 우선 적용합니다.

- **트래커**: 항상 "일감" (tracker_id: 10) 고정
- **제목 prefix `[값]`**: 작업 성격을 나타내는 명명 규칙. 트래커와 무관하며 설명 템플릿 선택에 사용됩니다.

| 필드 | Redmine 파라미터 | 기본값 |
|------|-----------------|--------|
| 제목 | `subject` | (필수 — 없으면 사용자에게 확인) |
| 설명 | `description` | prefix 기반 템플릿 자동 적용 |
| 트래커 | `tracker_id` | 10 (고정) |
| 우선순위 | `priority_id` | `REDMINE_DEFAULT_PRIORITY_ID` |
| 담당자 | `assigned_to_id` | `REDMINE_DEFAULT_ASSIGNED_TO_ID` |
| 목표버전 | `fixed_version_id` | `REDMINE_DEFAULT_VERSION_ID` |
| 시작일 | `start_date` | 빈값 (YYYY-MM-DD) |
| 완료기한 | `due_date` | 빈값 (YYYY-MM-DD) |
| 추정시간 | `estimated_hours` | 빈값 |
| 진척도 | `done_ratio` | 빈값 (0–100) |

### 추출 규칙

- **제목**: 작업 내용을 한 문장으로 요약. 파악 불가 시 사용자에게 확인.
- **날짜**: "이번 주 금요일", "다음 달 말" 같은 상대 표현은 오늘 날짜 기준으로 변환.
- **우선순위**: "긴급", "급함" → 긴급 / "낮음", "여유" → 낮음 / 나머지 → 기본값.
- **누락 필드**: 언급이 없으면 기본값 또는 빈값으로 처리. 사용자에게 묻지 않음.

---

## 4단계: 미리보기 출력

API 호출 전 반드시 아래 형식으로 미리보기를 보여주고 확인을 받습니다.

```
## Redmine 일감 미리보기

| 항목 | 값 |
|------|----|
| 프로젝트 | etc |
| 제목 | [회의] Claude Code 기본 사용자 교육 |
| 설명 | ### 회의 목적 ... (앞 100자) |
| 우선순위 | 보통 |
| 담당자 | 신봉수 |
| 목표버전 | 01. 완료 |
| 시작일 | (미지정) |
| 완료기한 | (미지정) |
| 추정시간 | (미지정) |
| 진척도 | (미지정) |

생성하시겠습니까? (확인 / 수정할 항목 말씀해 주세요)
```

사용자가 수정을 요청하면 해당 항목만 업데이트 후 미리보기를 다시 출력합니다.

---

## 5단계: API 호출

사용자가 확인하면 curl로 Redmine REST API를 호출합니다.

```bash
curl -s -X POST \
  -H "X-Redmine-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "project_id": "{project_id}",
      "tracker_id": 10,
      "subject": "{subject}",
      "description": "{description}",
      "priority_id": {priority_id},
      "assigned_to_id": {assigned_to_id},
      "fixed_version_id": {fixed_version_id},
      "start_date": "{start_date}",
      "due_date": "{due_date}",
      "estimated_hours": {estimated_hours},
      "done_ratio": {done_ratio}
    }
  }' \
  "{redmine_url}/issues.json"
```

- 빈값 필드는 JSON 페이로드에서 제외합니다 (null 전송 금지).
- `project_id`는 프로젝트 identifier(문자열) 또는 숫자 ID 모두 사용 가능.
- **한글 등 멀티바이트 문자는 반드시 유니코드 이스케이프(`\uXXXX`)로 변환 후 전송합니다.** 서버 WAF가 멀티바이트 문자를 직접 차단합니다.

### 성공 응답 처리

```
✅ 일감이 생성되었습니다.
- 일감 번호: #1234
- URL: {redmine_url}/issues/1234
```

### 실패 응답 처리

HTTP 상태 코드와 응답 본문을 사용자에게 그대로 보여주고, 가능한 원인을 한 줄로 설명합니다.

---

## 제목 prefix별 기본 설명 템플릿

사용자가 설명을 별도로 입력하지 않으면, 제목의 `[값]` prefix에 맞는 템플릿을 `description`에 자동 적용합니다.

### [회의]
```
### 회의 목적

---
### 참석자

---
### 안건

---
### 결정사항 / 액션아이템
```

### [신규] / [일감] / prefix 없음 (기본)
```
### 작업 내용

---
### 목적 / 배경

---
### 완료 조건
```

### [수정]
```
### 수정 내용

---
### 수정 이유
```

### [오류]
```
### 오류 내용

---
### 재현 방법

---
### 예상 동작

---
### 실제 동작
```

### [개선]
```
### 개선 내용

---
### 개선 이유 / 기대 효과
```

### 그 외 prefix

템플릿 없음 — 설명 빈값으로 처리.
