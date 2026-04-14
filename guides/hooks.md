# 훅 (Hooks) 가이드

Claude Code에서 훅은 특정 이벤트 발생 시 자동으로 실행되는 스크립트입니다.  
`settings.json`의 `hooks` 항목에서 설정하며, 실제 스크립트는 `.claude/hooks/` 에 위치합니다.

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

**용도**: 세션 시작 및 종료 시 Slack 채널에 자동 알림 전송

**동작**
- `UserPromptSubmit` → 사용자가 첫 메시지를 보낼 때 작업 시작 알림
- `Stop` → Claude 응답 완료 시 작업 종료 알림

**파일 구성**

```
.claude/hooks/slack-notify/
├── notify.config.json          ← Slack Bot Token (git 제외)
├── notify.config.example.json  ← 설정 예시 파일
├── task-start.sh               ← UserPromptSubmit 훅 실행 스크립트
├── notify.js                   ← Stop 훅 실행 스크립트 (Node.js)
└── notify.sh                   ← Slack 메시지 전송 공통 함수
```

**설정 방법**

1. `notify.config.example.json`을 복사해 `notify.config.json` 생성
   ```bash
   cp .claude/hooks/slack-notify/notify.config.example.json \
      .claude/hooks/slack-notify/notify.config.json
   ```

2. `notify.config.json`에 Slack Bot Token 입력
   ```json
   {
     "slackBotToken": "xoxb-YOUR_SLACK_BOT_TOKEN"
   }
   ```

3. `settings.json`에 훅 등록 확인 (기본 포함)
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

**개인 Slack 계정으로 DM 수신 설정**

봇 알림을 본인 Slack 계정으로 받으려면 `settings.local.json`에 이메일을 등록합니다.

```json
{
  "env": {
    "SLACK_USER_EMAIL": "your@email.com"
  }
}
```

> `settings.json`은 팀 공유 파일이므로 개인 이메일은 반드시 `settings.local.json`에 작성합니다.

**Slack Bot 권한 요구사항**
- `chat:write` — 메시지 전송
- `channels:read` — 채널 목록 조회
- `users:read.email` — 이메일로 사용자 조회 (DM 전송 시 필요)
