#!/usr/bin/env python3
"""
claude-viewer 전용 HTTP 서버.
SimpleHTTPRequestHandler 가 .md / .html 에 charset 헤더를 안 붙여
일부 브라우저(특히 한글 Windows)가 CP949 로 추측해 mojibake 발생.
text/* 타입에는 항상 charset=utf-8 을 강제한다.

DELETE /sessions/<id> 로 세션 + 응답·마커 파일을 정리한다.

사용법:
    python server.py <port> <cwd>
"""

import os
import re
import sys
import threading
import time
import http.server
import socketserver
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _index import delete_session, purge_all_runtime


# Claude Code 세션 ID 는 UUID 형식. 안전을 위해 16진수·하이픈만 허용 (path traversal 방어)
SESSION_ID_RE = re.compile(r'^[a-fA-F0-9-]{1,64}$')

# IDE 내장 서버(예: IntelliJ localhost:63342)에서 연 페이지가 viewer API 를 교차출처로 호출할 수 있게
# 로컬호스트 계열 Origin 만 CORS 로 허용한다. 서버는 127.0.0.1 로컬 바인딩이라 외부 노출은 없다.
ALLOWED_ORIGIN_RE = re.compile(r'^https?://(127\.0\.0\.1|localhost)(:\d+)?$')


class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        t = super().guess_type(path)
        if t and t.startswith('text/') and 'charset' not in t:
            return f'{t}; charset=utf-8'
        return t

    def _cors_origin(self):
        origin = self.headers.get('Origin')
        return origin if origin and ALLOWED_ORIGIN_RE.match(origin) else None

    def _send_cors(self, origin):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')

    def do_OPTIONS(self):
        origin = self._cors_origin()
        self.send_response(204)
        self._send_cors(origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        path = self.path.split('?', 1)[0]
        if path == '/server/shutdown':
            origin = self._cors_origin()
            self.send_response(204)
            self._send_cors(origin)
            self.end_headers()
            # 종료 = 클리어. 런타임 산출물을 정리한 뒤 종료한다.
            # 살아 있는 세션은 다음 응답에 stop_hook 이 다시 생성한다.
            purge_all_runtime()
            # 응답 flush 직후 종료. serve_forever() 정리 없이 즉시 빠져나가도
            # 다음 stop_hook 의 ensure_server() 가 새 프로세스를 띄운다.
            threading.Thread(target=lambda: (time.sleep(0.1), os._exit(0)), daemon=True).start()
            return
        self.send_error(404)

    def do_DELETE(self):
        path = self.path.split('?', 1)[0]
        prefix = '/sessions/'
        if not path.startswith(prefix):
            self.send_error(404)
            return
        sid = path[len(prefix):]
        if not SESSION_ID_RE.match(sid):
            self.send_error(400, "invalid session id")
            return
        if not delete_session(sid):
            self.send_error(404, "session not found")
            return
        origin = self._cors_origin()
        self.send_response(204)
        self._send_cors(origin)
        self.end_headers()

    def log_message(self, format, *args):
        pass


def main():
    port = int(sys.argv[1])
    directory = sys.argv[2]
    handler = lambda *a, **kw: UTF8Handler(*a, directory=directory, **kw)
    with socketserver.TCPServer(('127.0.0.1', port), handler) as httpd:
        httpd.serve_forever()


if __name__ == '__main__':
    main()
