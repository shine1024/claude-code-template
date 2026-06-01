#!/usr/bin/env python3
"""
Claude Code UserPromptSubmit Hook - claude-viewer
사용자 입력 시점에 viewer/.waiting 마커를 생성해 viewer가 대기 상태를 표시하게 한다.
"""

from pathlib import Path

WAITING = Path(__file__).parent.parent.parent / "viewer" / ".waiting"
WAITING.parent.mkdir(parents=True, exist_ok=True)
WAITING.touch()
