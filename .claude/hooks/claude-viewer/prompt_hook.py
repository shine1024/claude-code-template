#!/usr/bin/env python3
"""
Claude Code UserPromptSubmit Hook - claude-viewer
세션별 .waiting-<sid> 마커 생성 + sessions.json 에 세션 등록 (첫 prompt 한 줄을 라벨로).
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import get_session_id, update_session, VIEWER_DIR


def read_hook_data() -> dict:
    # Windows 한국어 로케일에서 sys.stdin 기본 인코딩이 cp949 라 UTF-8 JSON 이 mojibake 됨 → buffer 에서 직접 디코딩
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}


def main():
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
