#!/bin/bash

# init.sh
# claude-code-template의 .claude/ 폴더를 신규 프로젝트에 초기화

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 1. 대상 경로 확인 ──────────────────────────────────────────────────────────
if [ -n "$1" ]; then
  TARGET_PATH="$1"
else
  echo "초기화할 프로젝트 경로를 입력하세요:"
  printf "예) C:/intellij-workspace/uniflow\n> "
  read -r TARGET_PATH
fi

if [ ! -d "$TARGET_PATH" ]; then
  echo "❌ 경로를 찾을 수 없습니다: $TARGET_PATH"
  exit 1
fi

TARGET_CLAUDE="$TARGET_PATH/.claude"

# ── 2. 진행 확인 ───────────────────────────────────────────────────────────────
echo ""
echo "📁 대상 경로: $TARGET_PATH"
if [ -d "$TARGET_CLAUDE" ]; then
  echo "⚠️  기존 .claude 폴더가 존재합니다. 삭제 후 새로 생성됩니다."
fi
echo ""
printf "진행하시겠습니까? (y/n) > "
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "취소되었습니다."
  exit 0
fi

# ── 3. .claude 폴더 복사 ───────────────────────────────────────────────────────
echo ""
echo "📋 .claude 폴더 복사 중..."

rm -rf "$TARGET_CLAUDE"
mkdir -p "$TARGET_CLAUDE"

cp -rf "$SCRIPT_DIR/.claude/hooks"         "$TARGET_CLAUDE/hooks"
cp -rf "$SCRIPT_DIR/.claude/rules"         "$TARGET_CLAUDE/rules"
cp -rf "$SCRIPT_DIR/.claude/skills"        "$TARGET_CLAUDE/skills"
cp -f  "$SCRIPT_DIR/.claude/settings.json" "$TARGET_CLAUDE/settings.json"
cp -f  "$SCRIPT_DIR/.claude/sync.sh"       "$TARGET_CLAUDE/sync.sh"
chmod +x "$TARGET_CLAUDE/sync.sh"

echo "✅ 복사 완료"

# ── 4. 환경변수 입력 ───────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " settings.local.json 환경변수 설정"
echo " (입력하지 않으면 해당 항목은 생략됩니다)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

prompt_env() {
  local desc="$1"
  printf "\n%s\n> " "$desc"
  read -r value
  echo "$value"
}

VAL_TEMPLATE_PATH=$(prompt_env  "init-claude-md / analyze-feedback 스킬  =>  claude-code-template 프로젝트 경로  (예: C:/projects/claude-code-template)\nCLAUDE_CODE_TEMPLATE_PATH:")
VAL_SLACK_EMAIL=$(prompt_env    "Slack 알림 훅                            =>  슬랙 개인 계정 메일주소\nSLACK_USER_EMAIL:")
VAL_LOG_NAME=$(prompt_env       "session-log 스킬                         =>  회고 제출 시 기록될 이름\nSESSION_LOG_NAME:")
VAL_LOG_URL=$(prompt_env        "session-log 스킬                         =>  Google Apps Script 배포 URL\nSESSION_LOG_SCRIPT_URL:")
VAL_SA_KEY=$(prompt_env         "analyze-feedback 스킬                    =>  Google 서비스 계정 JSON 키 파일 경로  (예: C:/Users/{username}/.claude/google-sa-key.json)\nGOOGLE_SERVICE_ACCOUNT_KEY_PATH:")
VAL_SHEETS_ID=$(prompt_env      "analyze-feedback 스킬                    =>  피드백 Google Spreadsheet ID\nSHEETS_FEEDBACK_ID:")

# ── 5. settings.local.json 생성 ────────────────────────────────────────────────
echo ""
echo "📝 settings.local.json 생성 중..."

ENV_JSON=""
add_env() {
  local key="$1"
  local val="$2"
  if [ -n "$val" ]; then
    [ -n "$ENV_JSON" ] && ENV_JSON="$ENV_JSON,"$'\n'
    ENV_JSON="${ENV_JSON}    \"${key}\": \"${val}\""
  fi
}

add_env "CLAUDE_CODE_TEMPLATE_PATH"      "$VAL_TEMPLATE_PATH"
add_env "SLACK_USER_EMAIL"               "$VAL_SLACK_EMAIL"
add_env "SESSION_LOG_NAME"               "$VAL_LOG_NAME"
add_env "SESSION_LOG_SCRIPT_URL"         "$VAL_LOG_URL"
add_env "GOOGLE_SERVICE_ACCOUNT_KEY_PATH" "$VAL_SA_KEY"
add_env "SHEETS_FEEDBACK_ID"             "$VAL_SHEETS_ID"

cat > "$TARGET_CLAUDE/settings.local.json" <<EOF
{
  "env": {
${ENV_JSON}
  }
}
EOF

echo "✅ settings.local.json 생성 완료"
echo ""
echo "🎉 초기화 완료!"
echo ""
echo "다음 단계:"
echo "1. CLAUDE.md 를 생성하세요: /init-claude-md"
echo "2. CLAUDE.local.md 를 작성하고 .gitignore 에 추가하세요."
echo "3. .gitignore 에 .claude/settings.local.json 을 추가하세요."
