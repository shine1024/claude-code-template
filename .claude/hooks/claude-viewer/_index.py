#!/usr/bin/env python3
"""
claude-viewer 세션 인덱스 헬퍼.
stop_hook / prompt_hook / post_tool_hook 이 공유하는 유틸리티.
"""

import hashlib
import json
import time
from pathlib import Path

VIEWER_DIR    = Path(__file__).parent.parent.parent / "viewer"
SESSIONS_JSON = VIEWER_DIR / "sessions.json"

STALE_AGE_SECONDS = 60 * 60 * 24  # 24시간 무활동이면 자동 정리

PORT_RANGE_START = 20000
PORT_RANGE_SIZE  = 10000  # 20000~29999. 프로젝트 경로 해시로 고정 할당


def get_port() -> int:
    """프로젝트(viewer 디렉터리) 경로로 고정 포트를 산출한다.
    같은 프로젝트는 항상 같은 포트, 다른 프로젝트는 다른 포트를 쓰므로
    한 머신에서 여러 프로젝트가 viewer 를 동시에 띄워도 충돌하지 않는다.
    """
    key = str(VIEWER_DIR.resolve()).lower().encode("utf-8")
    digest = hashlib.md5(key).hexdigest()
    return PORT_RANGE_START + (int(digest, 16) % PORT_RANGE_SIZE)


def is_viewer_enabled() -> bool:
    import os
    return os.environ.get("CLAUDE_VIEWER_ENABLED", "false").lower() == "true"


def get_session_id(data: dict) -> str:
    sid = data.get("session_id")
    if sid:
        return str(sid)
    tp = data.get("transcript_path", "")
    return Path(tp).stem if tp else "unknown"


def _load() -> list:
    try:
        return json.loads(SESSIONS_JSON.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_atomic(sessions: list) -> None:
    VIEWER_DIR.mkdir(parents=True, exist_ok=True)
    tmp = SESSIONS_JSON.with_suffix(".json.tmp")
    tmp.write_text(
        json.dumps(sessions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp.replace(SESSIONS_JSON)


def _write_meta() -> None:
    """페이지가 자기 서버에서 열렸는지 판별할 수 있도록 정식 포트를 정적 파일로 남긴다.
    IDE 내장 서버(예: IntelliJ 63342) 등 다른 서버에서 열렸을 때 viewer 가 안내 배너를 띄우는 근거.
    """
    try:
        VIEWER_DIR.mkdir(parents=True, exist_ok=True)
        (VIEWER_DIR / "viewer-meta.json").write_text(
            json.dumps({"port": get_port()}, ensure_ascii=False),
            encoding="utf-8",
        )
    except Exception:
        pass


def _purge_session_files(session_id: str) -> None:
    (VIEWER_DIR / f"response-{session_id}.md").unlink(missing_ok=True)
    (VIEWER_DIR / f".waiting-{session_id}").unlink(missing_ok=True)


def purge_all_runtime() -> None:
    """viewer 런타임 산출물을 전부 삭제한다. 정적 파일(response.html)은 보존.
    서버 종료(클리어) 시 호출 — 살아 있는 세션은 다음 응답에 다시 생성되고,
    인덱스에서 빠져 청소되지 않던 고아 response-*.md / .waiting-* 도 함께 정리된다.
    """
    try:
        for f in VIEWER_DIR.glob("response-*.md"):
            f.unlink(missing_ok=True)
        for f in VIEWER_DIR.glob(".waiting-*"):
            f.unlink(missing_ok=True)
        for name in ("sessions.json", "sessions.json.tmp", "viewer-meta.json"):
            (VIEWER_DIR / name).unlink(missing_ok=True)
    except Exception:
        pass


def _cleanup_stale(sessions: list, now: float) -> list:
    cutoff = now - STALE_AGE_SECONDS
    kept = []
    for s in sessions:
        if s.get("updated_at", 0) >= cutoff:
            kept.append(s)
            continue
        _purge_session_files(s["id"])
    return kept


def delete_session(session_id: str) -> bool:
    """세션을 sessions.json 에서 제거하고 응답·마커 파일도 삭제한다.
    실제로 제거된 항목이 있으면 True, 없으면 False.
    """
    sessions = _load()
    remaining = [s for s in sessions if s.get("id") != session_id]
    if len(remaining) == len(sessions):
        return False
    _purge_session_files(session_id)
    try:
        _save_atomic(remaining)
    except Exception:
        pass
    return True


def read_hook_data() -> dict:
    """stdin 에서 훅 payload 를 읽는다. Windows cp949 환경 대응."""
    import sys
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}


# ── transcript 파싱 ──────────────────────────────────────────────

TOOL_ICONS = {
    "Read": "📖", "Edit": "📝", "MultiEdit": "📝", "Write": "💾",
    "Bash": "▶", "BashOutput": "▶",
    "Glob": "🔍", "Grep": "🔍",
    "TodoWrite": "✓", "Task": "🤖", "Agent": "🤖",
    "WebFetch": "🌐", "WebSearch": "🌐",
}
RESULT_MAX = 600


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


def extract_turn_blocks(data: dict, fallback: str = "") -> str:
    """현재 턴의 텍스트 + 도구 호출을 시간순으로 합쳐 반환."""
    transcript_path = data.get("transcript_path", "")
    if not fallback:
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

        if fallback and last_text != fallback:
            parts.append(fallback)

        if parts:
            return "\n\n".join(parts)

    except Exception:
        pass

    return fallback


# ── 세션 관리 ────────────────────────────────────────────────────

def update_session(session_id: str, *, label: str = "", has_response: bool = False, waiting=None) -> None:
    """세션 엔트리를 추가·갱신하고 stale 항목을 정리한다.

    label 은 비어있지 않을 때만, 기존 엔트리에 label 이 없는 경우에 한해 설정 (첫 prompt 유지).
    has_response=True 면 updated_at 을 현재 시각으로 갱신.
    waiting 은 True/False 로 명시했을 때만 변경.
    """
    sessions = _load()
    now = time.time()
    entry = next((s for s in sessions if s.get("id") == session_id), None)
    if entry is None:
        entry = {"id": session_id, "label": "", "updated_at": now, "waiting": False}
        sessions.append(entry)
    if label and not entry.get("label"):
        entry["label"] = label
    if has_response:
        entry["updated_at"] = now
    if waiting is not None:
        entry["waiting"] = bool(waiting)

    sessions = _cleanup_stale(sessions, now)
    sessions.sort(key=lambda s: s.get("updated_at", 0), reverse=True)
    try:
        _save_atomic(sessions)
    except Exception:
        pass
    _write_meta()
