#!/usr/bin/env python3
"""
Claude Code UserPromptSubmit Hook - claude-viewer
세션별 .waiting-<sid> 마커 생성 + sessions.json 에 세션 등록 (첫 prompt 한 줄을 라벨로).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import get_session_id, update_session, read_hook_data, is_viewer_enabled, VIEWER_DIR


def main():
    if not is_viewer_enabled():
        sys.exit(0)

    data = read_hook_data()
    session_id = get_session_id(data)

    prompt = (data.get("prompt") or "").strip()
    label = ""
    if prompt:
        first_line = prompt.splitlines()[0].strip()
        label = first_line[:60]

    VIEWER_DIR.mkdir(parents=True, exist_ok=True)
    (VIEWER_DIR / f".waiting-{session_id}").touch()
    update_session(session_id, label=label, waiting=True)


if __name__ == "__main__":
    main()
