#!/usr/bin/env bash
# UserPromptSubmit 훅 — 사용자 메시지 전송 시 시작 시간 기록
if [ "${SLACK_NOTIFY_ENABLED}" = "false" ]; then
  exit 0
fi
date "+%Y-%m-%d %H:%M:%S" > .claude/hooks/.task_start
