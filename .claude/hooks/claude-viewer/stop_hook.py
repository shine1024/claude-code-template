#!/usr/bin/env python3
"""
Claude Code Stop Hook - claude-viewer
응답을 response.md 에 저장하고 HTTP 서버(port 19988)를 유지합니다.
"""

import sys
import json
import socket
import subprocess
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import get_session_id, update_session, VIEWER_DIR

PORT = 19988

TOOL_ICONS = {
    "Read": "📖", "Edit": "📝", "MultiEdit": "📝", "Write": "💾",
    "Bash": "▶", "BashOutput": "▶",
    "Glob": "🔍", "Grep": "🔍",
    "TodoWrite": "✓", "Task": "🤖", "Agent": "🤖",
    "WebFetch": "🌐", "WebSearch": "🌐",
}
RESULT_MAX = 600


def read_hook_data() -> dict:
    # Windows 한국어 로케일에서 sys.stdin 기본 인코딩이 cp949 라 UTF-8 JSON 이 mojibake 됨 → buffer 에서 직접 디코딩
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}


def truncate(s: str, n: int = RESULT_MAX) -> str:
    s = s.strip()
    if len(s) <= n:
        return s
    return s[:n] + f"\n... (+{len(s) - n} chars)"


def code_block(text: str, lang: str = "") -> str:
    return f"```{lang}\n{text}\n```"


def collect_tool_results(entries: list, start: int) -> dict:
    """tool_use_id → result text 매핑."""
    results = {}
    for i in range(start, len(entries)):
        msg = entries[i]
        inner = msg.get("message", msg)
        if inner.get("role") != "user":
            continue
        content = inner.get("content", "")
        if not isinstance(content, list):
            continue
        for b in content:
            if not isinstance(b, dict) or b.get("type") != "tool_result":
                continue
            tid = b.get("tool_use_id", "")
            c = b.get("content", "")
            if isinstance(c, list):
                txt = "\n".join(
                    x.get("text", "") for x in c
                    if isinstance(x, dict) and x.get("type") == "text"
                )
            elif isinstance(c, str):
                txt = c
            else:
                txt = ""
            results[tid] = txt
    return results


def format_tool_use(tool_use: dict, result: str = "") -> str:
    name = tool_use.get("name", "")
    inp  = tool_use.get("input", {}) or {}
    icon = TOOL_ICONS.get(name, "⚙")

    def header(label: str) -> str:
        return f"{icon} **{name}** {label}".rstrip()

    if name == "Read":
        return header(f"`{inp.get('file_path', '')}`")

    if name in ("Edit", "MultiEdit"):
        target = inp.get("file_path", "")
        old = inp.get("old_string", "")
        new = inp.get("new_string", "")
        diff_lines = []
        for line in old.splitlines()[:10]:
            diff_lines.append(f"- {line}")
        for line in new.splitlines()[:10]:
            diff_lines.append(f"+ {line}")
        body = "\n" + code_block("\n".join(diff_lines), "diff") if diff_lines else ""
        return header(f"`{target}`") + body

    if name == "Write":
        target = inp.get("file_path", "")
        content = inp.get("content", "")
        snippet = "\n".join(content.splitlines()[:10])
        body = "\n" + code_block(snippet) if snippet.strip() else ""
        return header(f"`{target}`") + body

    if name == "Bash":
        cmd = inp.get("command", "").replace("\n", " ⏎ ")
        body = "\n" + code_block(truncate(result)) if result.strip() else ""
        return header(f"`{cmd[:200]}`") + body

    if name in ("Glob", "Grep"):
        pattern = inp.get("pattern", "")
        path = inp.get("path", "")
        target = pattern + (f" in {path}" if path else "")
        return header(f"`{target}`")

    if name == "TodoWrite":
        todos = inp.get("todos", [])
        marks = {"completed": "✓", "in_progress": "▶", "pending": "○"}
        lines = [
            f"  {marks.get(t.get('status', ''), '•')} {t.get('content', '')}"
            for t in todos[:15]
        ]
        body = "\n" + "\n".join(lines) if lines else ""
        return header(f"({len(todos)})") + body

    summary = json.dumps(inp, ensure_ascii=False)[:200]
    return header(f"`{summary}`")


def extract_turn_blocks(data: dict) -> str:
    """현재 턴의 텍스트 + 도구 호출을 시간순으로 합쳐 반환.
    Stop hook 시점에 마지막 텍스트가 transcript에 flush되지 않았으면
    payload의 last_assistant_message로 보충한다.
    """
    transcript_path = data.get("transcript_path", "")
    fallback = (data.get("last_assistant_message") or "").strip()

    if not transcript_path:
        return fallback

    try:
        raw_lines = Path(transcript_path).read_text(encoding="utf-8").strip().splitlines()
        entries = []
        for line in raw_lines:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except Exception:
                pass

        # 마지막 실제 사용자 메시지 위치 탐색
        # tool result: type=user + sourceToolAssistantUUID 있음
        # 실제 사용자: type=user + sourceToolAssistantUUID 없거나 None
        last_user_idx = -1
        for i in range(len(entries) - 1, -1, -1):
            msg = entries[i]
            if msg.get("type") == "user" and not msg.get("sourceToolAssistantUUID"):
                last_user_idx = i
                break

        start = last_user_idx + 1 if last_user_idx >= 0 else 0
        tool_results = collect_tool_results(entries, start)

        parts = []
        last_text = ""
        for i in range(start, len(entries)):
            msg = entries[i]
            inner = msg.get("message", msg)
            if inner.get("role") != "assistant":
                continue
            content = inner.get("content", "")
            if isinstance(content, str) and content.strip():
                parts.append(content.strip())
                last_text = content.strip()
            elif isinstance(content, list):
                for b in content:
                    if not isinstance(b, dict):
                        continue
                    bt = b.get("type")
                    if bt == "text":
                        t = b.get("text", "").strip()
                        if t:
                            parts.append(t)
                            last_text = t
                    elif bt == "tool_use":
                        tid = b.get("id", "")
                        parts.append(format_tool_use(b, tool_results.get(tid, "")))

        # flush 보정: payload 마지막 텍스트가 transcript에 누락됐으면 append
        if fallback and last_text != fallback:
            parts.append(fallback)

        if parts:
            return "\n\n".join(parts)

    except Exception:
        pass

    return fallback


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
    data = read_hook_data()
    session_id = get_session_id(data)
    turn_text = extract_turn_blocks(data)

    if not turn_text.strip():
        sys.exit(0)

    VIEWER_DIR.mkdir(parents=True, exist_ok=True)
    # transcript 에 외톨이 surrogate(잘린 emoji·바이너리 일부) 가 섞일 수 있어
    # utf-8 인코딩 실패 문자는 � 로 대체한다
    (VIEWER_DIR / f"response-{session_id}.md").write_text(turn_text, encoding="utf-8", errors="replace")
    (VIEWER_DIR / f".waiting-{session_id}").unlink(missing_ok=True)
    update_session(session_id, has_response=True, waiting=False)

    ensure_server()
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[claude-viewer] ✓ {ts} ({session_id[:8]})", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
