---
name: redmine-issue-creator
description: 개발자가 자유 형식으로 설명한 내용을 바탕으로 Redmine 일감을 자동 생성합니다. "레드마인에 일감 만들어줘", "이슈 등록해줘", "작업 추가해줘", "버그 등록해줘" 등의 요청에 반드시 이 스킬을 사용하세요. Redmine REST API를 통해 필드를 추출하고 일감을 생성합니다.
---

# Redmine 일감 자동 생성 스킬

개발자의 자유 형식 텍스트에서 일감 필드를 추출하고 Redmine REST API로 일감을 생성합니다.

---

## 설정 읽기

작업 전 아래 순서로 설정을 확인합니다.

1. **`CLAUDE.local.md`** 에서 Redmine 설정 섹션 확인
2. **`.claude/redmine.local.json`** 파일이 있으면 읽기
3. 설정이 없으면 사용자에게 설정 방법 안내 후 중단

### 설정 형식 (CLAUDE.local.md)

```markdown
## Redmine 설정

- REDMINE_URL: https://your-redmine.example.com
- REDMINE_API_KEY: your_api_key_here
- REDMINE_DEFAULT_PROJECT: project-identifier
```

### 설정 형식 (.claude/redmine.local.json)

```json
{
  "url": "https://your-redmine.example.com",
  "api_key": "your_api_key_here",
  "default_project": "project-identifier",
  "projects": {
    "project-identifier": {
      "tracker_id": 1,
      "default_assigned_to_id": null
    }
  }
}
```

설정 파일이 없으면 사용자에게 위 형식으로 설정을 추가해 달라고 안내하고 작업을 중단합니다.

---

## 필드 추출

사용자의 자유 텍스트에서 아래 필드를 추출합니다.

| 필드 | Redmine 파라미터 | 기본값 | 비고 |
|------|-----------------|--------|------|
| 제목 | `subject` | (필수) | 없으면 사용자에게 확인 |
| 설명 | `description` | 빈값 | |
| 상태 | `status_id` | 진행 중 | 프로젝트 설정 우선 |
| 우선순위 | `priority_id` | 보통 | |
| 담당자 | `assigned_to_id` | 빈값 | |
| 목표버전 | `fixed_version_id` | 빈값 | |
| 시작일 | `start_date` | 빈값 | YYYY-MM-DD |
| 완료기한 | `due_date` | 빈값 | YYYY-MM-DD |
| 추정시간 | `estimated_hours` | 빈값 | |
| 진척도 | `done_ratio` | 빈값 | 0–100 |

### 추출 규칙

- **제목**: 작업 내용을 한 문장으로 요약. 사용자 텍스트에서 명확히 파악 불가 시 사용자에게 확인.
- **날짜**: "이번 주 금요일", "다음 달 말" 같은 상대 표현은 오늘 날짜 기준으로 변환.
- **우선순위**: "긴급", "급함" → 긴급 / "낮음", "여유" → 낮음 / 나머지 → 보통.
- **누락 필드**: 언급이 없으면 기본값 또는 빈값으로 처리. 사용자에게 묻지 않음.

---

## 미리보기 출력

API 호출 전 반드시 아래 형식으로 미리보기를 보여주고 확인을 받습니다.

```
## Redmine 일감 미리보기

| 항목 | 값 |
|------|----|
| 프로젝트 | project-name |
| 제목 | 추출된 제목 |
| 설명 | 추출된 설명 (길면 앞 100자) |
| 상태 | 진행 중 |
| 우선순위 | 보통 |
| 담당자 | (미지정) |
| 목표버전 | (미지정) |
| 시작일 | (미지정) |
| 완료기한 | 2025-01-31 |
| 추정시간 | (미지정) |
| 진척도 | (미지정) |

생성하시겠습니까? (확인 / 수정할 항목 말씀해 주세요)
```

사용자가 수정을 요청하면 해당 항목만 업데이트 후 미리보기를 다시 출력합니다.

---

## API 호출

사용자가 확인하면 curl로 Redmine REST API를 호출합니다.

```bash
curl -s -X POST \
  -H "X-Redmine-API-Key: {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "project_id": "{project_id}",
      "subject": "{subject}",
      "description": "{description}",
      "status_id": {status_id},
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

### 성공 응답 처리

```
✅ 일감이 생성되었습니다.
- 일감 번호: #1234
- URL: https://your-redmine.example.com/issues/1234
```

### 실패 응답 처리

HTTP 상태 코드와 응답 본문을 사용자에게 그대로 보여주고, 가능한 원인을 한 줄로 설명합니다.

---

## Redmine 기본값 ID 참고

상태·우선순위는 Redmine 인스턴스마다 ID가 다를 수 있습니다. 설정 파일에 명시하거나, 아래 일반적인 기본값을 참고하세요.

| 우선순위 | 일반 ID |
|---------|---------|
| 낮음 | 1 |
| 보통 | 2 |
| 높음 | 3 |
| 긴급 | 4 |
| 즉시 | 5 |

정확한 ID는 `GET {redmine_url}/enumerations/issue_priorities.json` 으로 조회할 수 있습니다.
