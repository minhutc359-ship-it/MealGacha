"""Convert complete Imagegen pages to WebP, without resizing or cropping.

Usage: python dev/tools/pack-intro-manga5918.py --metadata-dir <generation records>
Original generated PNGs are kept untouched. Each record has id/source/prompt/references.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("--metadata-dir", required=True, type=Path)
args = parser.parse_args()
script = json.loads((ROOT / "dev/content/intro-manga5918.json").read_text())
out = ROOT / "public/assets/intro-manga5918"
docs = ROOT / "dev/docs/web-v5918"
out.mkdir(parents=True, exist_ok=True)
docs.mkdir(parents=True, exist_ok=True)
records = []
for chapter in script["chapters"]:
    pages = []
    for page in chapter["pages"]:
        meta = json.loads((args.metadata_dir / f'{page["id"]}.json').read_text())
        source = Path(meta["source"])
        image = Image.open(source).convert("RGB")
        assert image.width >= 1024 and image.height > image.width, page["id"]
        target = out / f'{page["id"]}.webp'
        encoded = io.BytesIO()
        image.save(encoded, "WEBP", quality=90, method=6)
        payload = encoded.getvalue()
        if not target.exists() or target.read_bytes() != payload:
            temporary = target.with_suffix(".webp.new")
            temporary.write_bytes(payload)
            target.unlink(missing_ok=True)
            temporary.rename(target)
        assert target.stat().st_size == len(payload) > 0
        Image.open(target).verify()
        pages.append({
            "id": page["id"], "title": page["title"],
            "lines": [{"speaker": s, "text": t} for s, t in page["lines"]],
            "image": "/" + target.relative_to(ROOT / "public").as_posix(),
            "size": list(image.size), "fullPage": True,
        })
        records.append({
            "id": page["id"], "path": target.relative_to(ROOT).as_posix(),
            "width": image.width, "height": image.height,
            "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "original": source.name,
            "originalSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "tool": "built-in Imagegen", "nativeLettering": True,
            "processing": "Full image converted to WebP quality 90; no crop, resize or lettering overlay.",
            "references": [r.split("/MealGacha/")[-1] for r in meta["references"]],
            "prompt": meta["prompt"],
            "revisions": meta.get("revisions", []),
        })
    (out / f'{chapter["id"]}.json').write_text(json.dumps({"editions": {"base": pages}}, ensure_ascii=False, separators=(",", ":")) + "\n")
(docs / "asset-provenance.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"chapters": len(script["chapters"]), "pages": len(records), "bytes": sum(r["bytes"] for r in records)}))
