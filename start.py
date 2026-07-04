from __future__ import annotations

import argparse
import http.server
import os
import socketserver
import subprocess
import sys
import webbrowser
from functools import partial
from pathlib import Path


PROJECT_NAME = "2fa"
DEFAULT_PORT = 4567


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def npm_command() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def build_dist(project_root: Path) -> None:
    print(f"[{PROJECT_NAME}] Building dist...")
    subprocess.run([npm_command(), "run", "build"], cwd=project_root, check=True)


def open_private_browser(url: str) -> None:
    print(f"[{PROJECT_NAME}] Opening private browser...")
    if os.name == "nt":
        for browser, flag in (("msedge", "--inprivate"), ("chrome", "--incognito")):
            try:
                subprocess.Popen(["cmd", "/c", "start", "", browser, flag, url])
                return
            except OSError:
                continue
    else:
        for browser, flag in (
            ("microsoft-edge", "--inprivate"),
            ("google-chrome", "--incognito"),
            ("chromium", "--incognito"),
        ):
            try:
                subprocess.Popen([browser, flag, url])
                return
            except OSError:
                continue
    webbrowser.open(url)


def serve(directory: Path, port: int) -> None:
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(directory))
    with ReusableTCPServer(("", port), handler) as server:
        print(f"[{PROJECT_NAME}] Serving {directory} at http://localhost:{port}/")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print(f"\n[{PROJECT_NAME}] Server stopped.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build and serve 2fa locally.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Local HTTP port.")
    parser.add_argument("--no-build", action="store_true", help="Skip npm build.")
    parser.add_argument("--no-open", action="store_true", help="Do not open a browser.")
    parser.add_argument("--check", action="store_true", help="Validate project paths and exit.")
    return parser.parse_args()


def check_project(project_root: Path) -> int:
    required = ["package.json", "index.html", "src/main.ts"]
    missing = [name for name in required if not (project_root / name).exists()]
    if missing:
        print(f"[{PROJECT_NAME}] Missing required files: {', '.join(missing)}", file=sys.stderr)
        return 1
    print(f"[{PROJECT_NAME}] start.py check passed.")
    return 0


def main() -> int:
    args = parse_args()
    project_root = Path(__file__).resolve().parent
    dist_dir = project_root / "dist"

    if args.check:
        return check_project(project_root)

    try:
        if not args.no_build:
            build_dist(project_root)
        if not dist_dir.exists():
            print(f"[{PROJECT_NAME}] dist directory not found. Run without --no-build first.", file=sys.stderr)
            return 1
        url = f"http://localhost:{args.port}/"
        if not args.no_open:
            open_private_browser(url)
        serve(dist_dir, args.port)
        return 0
    except subprocess.CalledProcessError as error:
        print(f"[{PROJECT_NAME}] Build failed: {error}", file=sys.stderr)
        return error.returncode or 1
    except OSError as error:
        print(f"[{PROJECT_NAME}] Failed to start server: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
