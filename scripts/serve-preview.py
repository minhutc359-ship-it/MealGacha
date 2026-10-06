#!/usr/bin/env python3
"""Serve an existing Vite production build with SPA route fallback."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse

root = Path(__file__).resolve().parent.parent / "dist"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--port", type=int, default=8080)
args = parser.parse_args()
if not (root / "index.html").is_file():
    parser.error("Chưa có thư mục dist. Chạy pnpm build trước.")


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        requested = Path(self.translate_path(urlsplit(self.path).path))
        if not requested.exists() and not requested.suffix:
            self.path = "/index.html"
        return super().send_head()


server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root)))
print(f"MealGacha TCG: http://127.0.0.1:{args.port} — Ctrl+C để dừng", flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
