# -*- coding: utf-8 -*-
"""Local preview server that mirrors GitHub Pages behaviour:
- serves /path as /path.html when the extensionless file is missing
- serves /dir/ as /dir/index.html
So extensionless blog links (e.g. /blog/foo) work locally just like on the live site.

Run from the website root:  python build/preview_server.py [port]
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # website/
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099


class GHPagesHandler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        # default mapping first
        p = super().translate_path(path)
        url_path = unquote(urlparse(path).path)
        if url_path.endswith('/'):
            return p  # SimpleHTTPRequestHandler already tries index.html
        if os.path.isdir(p):
            return p
        if os.path.exists(p):
            return p
        # extensionless -> .html (GitHub Pages style)
        if not os.path.splitext(p)[1] and os.path.exists(p + '.html'):
            return p + '.html'
        return p


if __name__ == '__main__':
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), GHPagesHandler)
    print(f"Preview (GitHub-Pages-style) at http://127.0.0.1:{PORT}/  — Ctrl+C to stop")
    print(f"Serving: {ROOT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
