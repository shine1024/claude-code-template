#!/usr/bin/env python3
"""
claude-viewer 전용 HTTP 서버.
SimpleHTTPRequestHandler 가 .md / .html 에 charset 헤더를 안 붙여
일부 브라우저(특히 한글 Windows)가 CP949 로 추측해 mojibake 발생.
text/* 타입에는 항상 charset=utf-8 을 강제한다.

사용법:
    python server.py <port> <cwd>
"""

import sys
import http.server
import socketserver


class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        t = super().guess_type(path)
        if t and t.startswith('text/') and 'charset' not in t:
            return f'{t}; charset=utf-8'
        return t

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
