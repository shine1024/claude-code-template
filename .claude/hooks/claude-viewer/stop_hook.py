#!/usr/bin/env python3
"""
Claude Code Stop Hook - claude-viewer
응답을 response.md 에 저장하고 프로젝트별 HTTP 서버를 유지합니다.
포트는 프로젝트 경로로 고정 산출되어 다른 프로젝트와 충돌하지 않습니다.
"""

import sys
import socket
import subprocess
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import get_session_id, update_session, read_hook_data, extract_turn_blocks, is_viewer_enabled, VIEWER_DIR, get_port

PORT = get_port()
SERVER_SCRIPT = Path(__file__).parent / "server.py"


def ensure_server():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', PORT)) == 0:
            return
    subprocess.Popen(
        [sys.executable, str(SERVER_SCRIPT), str(PORT), str(VIEWER_DIR)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main():
    if not is_viewer_enabled():
        sys.exit(0)

    data = read_hook_data()
    session_id = get_session_id(data)
    turn_text = extract_turn_blocks(data)

    if not turn_text.strip():
        sys.exit(0)

    VIEWER_DIR.mkdir(parents=True, exist_ok=True)
    (VIEWER_DIR / f"response-{session_id}.md").write_text(turn_text, encoding="utf-8", errors="replace")
    (VIEWER_DIR / f".waiting-{session_id}").unlink(missing_ok=True)
    update_session(session_id, has_response=True, waiting=False)

    ensure_server()
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[claude-viewer] ✓ {ts} ({session_id[:8]}) http://127.0.0.1:{PORT}/response.html", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
