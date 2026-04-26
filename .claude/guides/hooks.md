# 훅 (Hooks) 가이드

Claude Code에서 훅은 특정 이벤트 발생 시 자동으로 실행되는 스크립트입니다.  
`settings.json`의 `hooks` 항목에서 이벤트와 실행 명령을 등록하며, 실제 스크립트는 `.claude/hooks/`에 위치합니다.

---

## 지원 이벤트

| 이벤트 | 발생 시점 |
|--------|-----------|
| `UserPromptSubmit` | 사용자가 메시지를 전송할 때 |
| `Stop` | Claude가 응답을 완료할 때 |
| `PreToolUse` | 도구 실행 전 |
| `PostToolUse` | 도구 실행 후 |

---

## 현재 구성된 훅

### slack-notify — Slack 알림

**용도**: 세션 시작 및 종료 시 Slack DM으로 자동 알림 전송

| 이벤트 | 동작 |
|--------|------|
| `UserPromptSubmit` | 작업 시작 시간 기록 |
| `Stop` | 작업 완료 알림 전송 (시작 시간·소요 시간 포함) |

**파일 구성**

| 파일 | 역할 |
|------|------|
| `task-start.sh` | `UserPromptSubmit` 훅 — 시작 시간 기록 |
| `notify.js` | `Stop` 훅 — Slack DM 전송 |
| `notify.sh` | Slack 메시지 전송 공통 함수 |

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
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/slack-notify/task-start.sh" }]
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
