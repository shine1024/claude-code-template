# 훅 (Hooks) 가이드

Claude Code에서 훅은 특정 이벤트 발생 시 자동으로 실행되는 스크립트입니다.  
`settings.json`의 `hooks` 항목에서 이벤트와 실행 명령을 등록하며, 실제 스크립트는 `.claude/hooks/`에 위치합니다.

---

## 지원 이벤트

| 이벤트 | 발생 시점 |
|--------|-----------|
| `SessionStart` | 세션 시작 시 (startup / resume / clear / compact) |
| `UserPromptSubmit` | 사용자가 메시지를 전송할 때 |
| `Notification` | 권한 프롬프트 등 알림 발생 시 (matcher: `permission_prompt` 등) |
| `Stop` | Claude가 응답을 완료할 때 |
| `PreToolUse` | 도구 실행 전 |
| `PostToolUse` | 도구 실행 후 |

---

## 현재 구성된 훅

### slack-notify — Slack 알림

**용도**: 작업 완료 및 권한 허가 요청 시 Slack DM으로 자동 알림 전송

| 이벤트 | 매처 | 동작 |
|--------|------|------|
| `UserPromptSubmit` | (없음) | 작업 시작 시간 기록 |
| `Notification` | `permission_prompt` | 권한 허가 요청 알림 전송 (요청 메시지·시작/현재/소요 시간 포함) |
| `Stop` | (없음) | 작업 완료 알림 전송 (시작 시간·소요 시간 포함) |

**파일 구성**

| 파일 | 역할 |
|------|------|
| `task-start.sh` | `UserPromptSubmit` 훅 — 시작 시간 기록 |
| `notify.js` | `Notification`·`Stop` 훅 — stdin의 `message` 유무로 분기, Slack DM 전송 (`lib/slack.js` 사용) |

---

### check-update — 템플릿 업데이트 알림

**용도**: `claude-code-template` 저장소의 새 변경사항을 감지하여 콘솔 + Slack DM으로 알림

| 이벤트 | 동작 |
|--------|------|
| `SessionStart` | 세션 1회, 로컬 `SYNC_HASH` ↔ 원격 `git HEAD` 비교 후 다르면 알림 |

**파일 구성**

| 파일 | 역할 |
|------|------|
| `check-update.js` | 업데이트 체크 + 콘솔(stderr/stdout) + Slack DM (`lib/slack.js` 사용) |

**동작 조건**

- `TEMPLATE_REPO_URL` 미설정 시 즉시 종료
- 같은 세션(부모 PID 기준) 내 두 번째 호출부터는 락 파일로 무시
- `SLACK_BOT_TOKEN` + `SLACK_USER_EMAIL`이 모두 있을 때만 Slack DM 전송 (없으면 콘솔만)

---

### deploy-static — 정적 리소스 자동 배포

**용도**: 세션 중 수정된 정적 리소스(`.hbs`, `.js`, `.css`)를 작업 종료 시 실제 배포 경로로 자동 복사

| 이벤트 | 매처 | 동작 |
|--------|------|------|
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `SRC_ROOT` 하위의 화이트리스트 확장자 파일만 `.claude/cache/modified_files.log`에 누적 (출력 없음) |
| `Stop` | (없음) | 로그를 읽어 `SRC_ROOT` 기준 상대경로로 `DEPLOY_ROOT`에 복사 후 로그 삭제. 성공 시 stderr 한 줄 요약 |

**파일 구성**

| 파일 | 역할 |
|------|------|
| `track.js` | `PostToolUse` 훅 — stdin JSON에서 `tool_input.file_path` 추출, 확장자·경로 필터링 후 로그 누적 |
| `deploy.js` | `Stop` 훅 — 누적된 파일을 `DEPLOY_ROOT`로 복사 (디렉토리 자동 생성) |

**동작 조건**

- `SRC_ROOT` 또는 `DEPLOY_ROOT` 미설정 시 두 훅 모두 즉시 종료 (opt-in)
- 화이트리스트 확장자: `.hbs`, `.js`, `.css` (필요 시 `track.js` 의 `WHITELIST` Set 수정)
- `SRC_ROOT` 외부 파일은 무시 (다른 프로젝트 파일 보호)
- 토큰 비용 최소화: 성공 시 stdout 출력 없음, 실패 시에만 stderr 출력

**활성화 방법**

각 프로젝트의 `.claude/settings.local.json`(개인 설정, git 제외)에 환경변수와 훅 등록을 추가한다.

```json
{
  "env": {
    "SRC_ROOT": "D:/myproject/src/main/webapp",
    "DEPLOY_ROOT": "C:/tomcat/webapps/myapp"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/deploy-static/track.js" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/deploy-static/deploy.js" }]
      }
    ]
  }
}
```

> `settings.local.json`의 `hooks` 항목은 `settings.json`의 같은 이벤트 항목과 **병합**된다. 기존 `Stop` 훅(예: `slack-notify`)은 그대로 유지되며 deploy-static이 추가로 실행된다.

---

### lib/ — 공용 모듈

| 파일 | 역할 |
|------|------|
| `slack.js` | Slack DM 전송 공용 모듈 — `lookupUserByEmail`, `sendDm`, `sendDmByEmail` 제공. `sendDmByEmail`은 User ID를 `.claude/cache/.slack_user_id.json`에 캐싱하여 매 호출의 lookup 왕복을 생략한다. 캐시는 이메일이 바뀌면 자동 무효화되며, `user_not_found`/`channel_not_found` 응답 시에도 자동 삭제된다. |

---

## 설정 방법

**1. Bot Token 및 수신 이메일 설정**

`.claude/settings.local.json`에 Slack Bot Token과 알림을 받을 이메일을 추가합니다.

```json
{
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-YOUR_SLACK_BOT_TOKEN",
    "SLACK_USER_EMAIL": "your@email.com"
  }
}
```

**2. 훅 등록 확인**

`settings.json`에 아래 내용이 포함되어 있는지 확인합니다. (기본 포함)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/check-update/check-update.js" }]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/slack-notify/task-start.sh" }]
      }
    ],
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/slack-notify/notify.js" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/slack-notify/notify.js" }]
      }
    ]
  }
}
```

---

## 환경변수 설정

| 환경변수 | 설정 위치 | 범위 | 설명 |
|----------|-----------|------|------|
| `SLACK_BOT_TOKEN` | `.claude/settings.local.json` | 프로젝트별 | Slack Bot Token (git 제외) |
| `SLACK_USER_EMAIL` | `.claude/settings.local.json` | 프로젝트별 | 알림을 수신할 본인 Slack 이메일 |
| `SLACK_NOTIFY_ENABLED` | `.claude/settings.local.json` | 프로젝트별 | `false` 설정 시 해당 프로젝트 알림 비활성화 |
| `SRC_ROOT` | `.claude/settings.local.json` | 프로젝트별 | deploy-static 원본 루트 (예: `D:/myproject/src/main/webapp`) |
| `DEPLOY_ROOT` | `.claude/settings.local.json` | 프로젝트별 | deploy-static 배포 대상 루트 (예: `C:/tomcat/webapps/myapp`) |

**설정 예시** (`.claude/settings.local.json`)
```json
{
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-YOUR_SLACK_BOT_TOKEN",
    "SLACK_USER_EMAIL": "your@email.com"
  }
}
```

**프로젝트별 비활성화 예시** (`.claude/settings.local.json`)
```json
{
  "env": {
    "SLACK_NOTIFY_ENABLED": "false"
  }
}
```

---

## Slack Bot 권한 요구사항

| 권한 | 용도 |
|------|------|
| `chat:write` | 메시지 전송 |
| `channels:read` | 채널 목록 조회 |
| `users:read.email` | 이메일로 사용자 조회 (DM 전송 시 필요) |
