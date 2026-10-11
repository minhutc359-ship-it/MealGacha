#!/usr/bin/env python3
"""Package product sources or an existing web build without development archives."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--dist", action="store_true", help="Package the built website instead of source")
args = parser.parse_args()
version = json.loads((ROOT / "package.json").read_text())["version"]
out = ROOT / "dev/artifacts"
out.mkdir(parents=True, exist_ok=True)
suffix = "web" if args.dist else "source"
target = out / f"soul-of-meal-{version}-{suffix}.zip"
if args.dist:
    base = ROOT / "dist"
    if not (base / "index.html").is_file():
        parser.error("Run pnpm build first")
    files = [p for p in base.rglob("*") if p.is_file()]
else:
    base = ROOT
    names = ["README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json", "pnpm-lock.yaml", "tsconfig.json", "vite.config.ts", "webOffline.ts", "web-service-worker.js", "index.html", "vercel.json", ".env.example", ".gitignore", ".gitattributes", ".vercelignore"]
    files = [ROOT / name for name in names]
    for directory in ["src", "public", "rights"]:
        files.extend(p for p in (ROOT / directory).rglob("*") if p.is_file())
if any(not p.exists() or p.is_symlink() for p in files):
    parser.error("Missing or symlinked release source; inspect before packaging")
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(files):
        relative = p.relative_to(base).as_posix()
        if relative.startswith("dev/") or "__qa__" in relative or relative.endswith(".map"):
            parser.error(f"Development output leaked into release: {relative}")
        archive.write(p, relative)
print(json.dumps({"archive": str(target.relative_to(ROOT)), "files": len(files), "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}))
