"""Export complete Imagegen sheets to WebP; measure panels without repainting art."""
import hashlib
import json
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "dev/docs/web-v5916"
sources = json.loads((DOC / "generated-sources.json").read_text())
records, frames = [], {}
for key, source in sources.items():
    track, chapter = key.split("/")
    image = Image.open(source).convert("RGB")
    assert image.size == (1536, 1024), (key, image.size)
    target = ROOT / f"public/assets/manga5916/{key}.webp"
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=88, method=6)
    # Find the actual grid dividers. Some authored rows differ in height; a
    # hard-coded halfway crop would trim part of the next panel's illustration.
    gray = np.array(image).mean(axis=2)
    h, w = gray.shape
    row_score = (gray > 180).mean(axis=1)
    col_score = (gray > 180).mean(axis=0)
    def divider(score, size):
        lo, hi = int(size * .37), int(size * .63)
        center = lo + int(np.argmax(score[lo:hi]))
        assert score[center] > .85, (key, center, score[center])
        start, end = center, center
        while start > lo and score[start-1] > .85: start -= 1
        while end < hi-1 and score[end+1] > .85: end += 1
        return start, end+1
    ys, ye = divider(row_score, h)
    xs, xe = divider(col_score, w)
    # Include the gutter, never content from outside a panel.
    rects = [[0,0,xs,ys],[xe,0,w-xe,ys],[0,ye,xs,h-ye],[xe,ye,w-xe,h-ye]]
    frames[key] = rects
    records.append({"track":track,"id":chapter,"path":str(target.relative_to(ROOT)),
        "size":list(image.size),"bytes":target.stat().st_size,
        "sha256":hashlib.sha256(target.read_bytes()).hexdigest(),
        "sourceSha256":hashlib.sha256(Path(source).read_bytes()).hexdigest(),
        "sourceName":Path(source).name,"tool":"Built-in Imagegen",
        "reference":f"public/assets/manga5915/{key}.webp","frames":rects})
    with Image.open(target) as check: check.load(); assert check.size == image.size
(DOC / "art-frames.json").write_text(json.dumps(frames,indent=2)+"\n")
(DOC / "asset-provenance.json").write_text(json.dumps({"version":"5.9.16","generatedOn":"2026-10-18",
    "count":len(records),"bytes":sum(r["bytes"] for r in records),"images":records},indent=2)+"\n")
print(json.dumps({"count":len(records),"bytes":sum(r["bytes"] for r in records)}))
