#!/usr/bin/env python3
"""
Claude Code PostToolUse Hook - claude-viewer
도구 호출 완료 후 현재까지의 응답을 response.md 에 점진적으로 갱신한다.
stop_hook 이 최종 확정하기 전까지 실시간 진행 상황을 표시하는 역할.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import get_session_id, read_hook_data, extract_turn_blocks, is_viewer_enabled, VIEWER_DIR


def main():
    if not is_viewer_enabled():
        sys.exit(0)

    data = read_hook_data()

    if not data.get("transcript_path"):
        sys.exit(0)

    session_id = get_session_id(data)
    turn_text = extract_turn_blocks(data)

    if not turn_text.strip():
        sys.exit(0)

    VIEWER_DIR.mkdir(parents=True, exist_ok=True)
    (VIEWER_DIR / f"response-{session_id}.md").write_text(turn_text, encoding="utf-8", errors="replace")
    sys.exit(0)


if __name__ == "__main__":
    main()
