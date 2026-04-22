#!/bin/bash

# sync.sh
# claude-code-template 최신 내용을 현재 프로젝트 .claude/ 폴더에 동기화

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_FILE="$SCRIPT_DIR/settings.local.json"

# ── 1. settings.local.json 로드 ──────────────────────────────────────────────
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "❌ .claude/settings.local.json 파일이 없습니다. 아래 내용으로 생성해주세요."
  echo ""
  echo '{ "CLAUDE_CODE_TEMPLATE_PATH": "C:/your-path/claude-code-template" }'
  exit 1
fi

TEMPLATE_PATH=$(grep -o '"CLAUDE_CODE_TEMPLATE_PATH"[[:space:]]*:[[:space:]]*"[^"]*"' "$SETTINGS_FILE" | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$TEMPLATE_PATH" ]; then
  echo "❌ settings.local.json 에 CLAUDE_CODE_TEMPLATE_PATH 가 없습니다."
  exit 1
fi

if [ ! -d "$TEMPLATE_PATH" ]; then
  echo "❌ claude-code-template 경로를 찾을 수 없습니다: $TEMPLATE_PATH"
  exit 1
fi

echo "📁 Template 경로: $TEMPLATE_PATH"

# ── 2. claude-code-template git pull ─────────────────────────────────────────
echo ""
echo "🔄 claude-code-template 최신화 중..."
cd "$TEMPLATE_PATH" && git pull
cd "$SCRIPT_DIR"
echo "✅ 최신화 완료"

# ── 3. 현재 프로젝트 .claude/ 로 복사 ────────────────────────────────────────
echo ""
echo "📋 .claude 폴더 동기화 중..."

TARGET_DIR="$SCRIPT_DIR"

rm -rf "$TARGET_DIR/hooks" "$TARGET_DIR/rules" "$TARGET_DIR/skills"
cp -rf "$TEMPLATE_PATH/.claude/hooks"  "$TARGET_DIR/hooks"
cp -rf "$TEMPLATE_PATH/.claude/rules"  "$TARGET_DIR/rules"
cp -rf "$TEMPLATE_PATH/.claude/skills" "$TARGET_DIR/skills"
cp -f  "$TEMPLATE_PATH/.claude/settings.json" "$TARGET_DIR/settings.json"

echo "✅ 동기화 완료"
echo ""
echo "🎉 Sync 완료! 변경된 파일을 확인 후 git commit 해주세요."
