# Google Sheets 연동 가이드 — Service Account 방식

---

## 목적

구글 시트에 축적된 데이터를 **Claude Code가 직접 조회·기록·분석**할 수 있도록 연동합니다.

예를 들어 아래와 같은 작업을 자동화할 수 있습니다.

- `/session-log` 으로 세션 회고를 시트에 자동 기록
- `/share-rules` 로 개인 규칙 후보를 개인 규칙 시트에 적재
- `/analyze-feedback` 으로 두 시트를 함께 분석하여 CLAUDE.md 개선안 도출

시트를 외부에 공개하지 않고, Google Cloud 서비스 계정을 통해 안전하게 인증합니다.

---

## 1단계. Google Cloud 서비스 계정 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 → 라이브러리** → `Google Sheets API` 검색 후 활성화
4. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → 서비스 계정** 선택
5. 서비스 계정 생성 완료 후 → **키 탭 → 키 추가 → JSON** 다운로드

---

## 2단계. 구글 시트에 서비스 계정 공유

다운로드한 JSON 파일 안의 `client_email` 값을 확인합니다.

```json
{
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com"
}
```

해당 이메일을 대상 구글 시트에 **편집자**로 공유합니다.
- 시트 우상단 **공유 버튼 → 이메일 입력 → 편집자 권한 부여**

---

## 3단계. 시트 준비

스프레드시트 안에 아래 두 탭을 미리 만들어 둡니다. 탭 이름은 자유롭게 지어도 됩니다 — 코드는 gid 로 참조합니다.

### 회고 데이터 시트 (`GOOGLE_SHEETS_SESSION_LOG_GID`)

11개 열. 1행은 자유 설명, 2행은 헤더로 채우고 데이터는 3행부터 입력됩니다.

| 열 | 헤더 |
|----|------|
| A | `date` |
| B | `name` |
| C | `project` |
| D | `requirements` |
| E | `conversationFlow` |
| F | `wentWell` |
| G | `wentWrong` |
| H | `rootCause` |
| I | `improvement` |
| J | `other` |
| K | `클로드 분석여부` |

### 개인 규칙 후보 시트 (`GOOGLE_SHEETS_PERSONAL_RULES_GID`)

5개 열. 동일하게 1행 설명, 2행 헤더, 3행~ 데이터.

| 열 | 헤더 |
|----|------|
| A | `date` |
| B | `name` |
| C | `project` |
| D | `rule` |
| E | `클로드 분석여부` |

---

## 4단계. 환경변수 설정

JSON 키 파일을 안전한 경로에 저장하고, `.claude/settings.local.json`에 등록합니다.

```json
{
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "C:/Users/{username}/.claude/google-sa-key.json",
    "GOOGLE_SHEETS_FEEDBACK_ID": "{Spreadsheet ID}",
    "GOOGLE_SHEETS_SESSION_LOG_GID": "{회고 시트의 gid}",
    "GOOGLE_SHEETS_PERSONAL_RULES_GID": "{개인 규칙 시트의 gid}"
  }
}
```

### Spreadsheet ID 확인 방법

구글 시트 URL에서 `/d/` 와 `/edit` 사이의 값입니다.

```
https://docs.google.com/spreadsheets/d/{Spreadsheet ID}/edit?gid=...
```

### gid 확인 방법

각 탭을 클릭한 상태에서 주소창의 `?gid=` 또는 `#gid=` 뒤에 붙은 숫자가 해당 탭의 gid 입니다.

```
https://docs.google.com/spreadsheets/d/{Spreadsheet ID}/edit?gid=2106728685
                                                                 └─ 이 값
```

> gid 는 시트가 삭제될 때까지 변하지 않습니다. 탭 이름을 바꿔도 gid 는 그대로이므로, 코드는 gid 만으로 시트를 식별합니다.

---

## 참고

- JSON 키 파일은 절대 커밋하지 않습니다 (`.gitignore` 처리).
- `.claude/settings.local.json` 도 개인 설정 파일이므로 커밋 대상에서 제외합니다.
- 서비스 계정 키는 팀 내부에서만 안전하게 공유합니다 (사내 비밀 저장소·1Password 등). 갱신·회수 정책을 함께 정해두면 좋습니다.
