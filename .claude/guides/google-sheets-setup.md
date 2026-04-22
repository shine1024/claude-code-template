# Google Sheets 연동 가이드 — Service Account 방식

---

## 목적

구글 시트에 축적된 데이터를 **Claude Code가 직접 조회·분석**할 수 있도록 연동합니다.

예를 들어 아래와 같은 작업을 자동화할 수 있습니다.

- 프로젝트별 Claude Code 사용 피드백(잘된 점 / 잘안된 점)을 시트에서 읽어와 CLAUDE.md 개선안 도출
- 반복적으로 수집되는 데이터를 Claude가 주기적으로 분석하여 인사이트 제공
- 시트 데이터를 기반으로 일감 생성, 보고서 작성 등 후속 작업 자동화

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

## 3단계. Claude Code 환경변수 설정

JSON 키 파일을 안전한 경로에 저장하고, `.claude/settings.local.json`에 등록합니다.

```json
{
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_KEY_PATH": "C:/Users/{username}/.claude/google-sa-key.json",
    "SHEETS_FEEDBACK_ID": "{Spreadsheet ID}"
  }
}
```

### Spreadsheet ID 확인 방법

구글 시트 URL에서 `/d/` 와 `/edit` 사이의 값입니다.

```
https://docs.google.com/spreadsheets/d/{Spreadsheet ID}/edit?gid=...
```

---

## 참고

- JSON 키 파일은 `.gitignore`에 추가하여 절대 커밋하지 않습니다.
- `.claude/settings.local.json`도 개인 설정 파일이므로 커밋 대상에서 제외합니다.
