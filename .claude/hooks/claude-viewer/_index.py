#!/usr/bin/env python3
"""
claude-viewer 세션 인덱스 헬퍼.
stop_hook 과 prompt_hook 이 sessions.json 을 갱신할 때 사용한다.
"""

import json
import time
from pathlib import Path

VIEWER_DIR    = Path(__file__).parent.parent.parent / "viewer"
SESSIONS_JSON = VIEWER_DIR / "sessions.json"

STALE_AGE_SECONDS = 60 * 60 * 24  # 24시간 무활동이면 자동 정리


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


def _purge_session_files(session_id: str) -> None:
    (VIEWER_DIR / f"response-{session_id}.md").unlink(missing_ok=True)
    (VIEWER_DIR / f".waiting-{session_id}").unlink(missing_ok=True)


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
