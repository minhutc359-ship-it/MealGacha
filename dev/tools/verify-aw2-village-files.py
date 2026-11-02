"""Verify selected original pixels, alpha-safe frames and deterministic006G output."""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
manifest = ROOT / "src/aw2/assets/covenant-village.environment-v1.json"
data = json.loads(manifest.read_text())
paths = [manifest, ROOT / "dev/aw2/assets/environments/covenant-village/v1/provenance.json"]
observed, edges = {}, {}
for key, asset in data["assets"].items():
    source, runtime = ROOT / asset["source"]["path"], ROOT / asset["url"][1:]
    a, b = Image.open(source).convert("RGBA"), Image.open(runtime).convert("RGBA")
    assert a.tobytes() == b.tobytes()
    assert hashlib.sha256(source.read_bytes()).hexdigest() == asset["source"]["sha256"]
    assert hashlib.sha256(runtime.read_bytes()).hexdigest() == asset["sha256"]
    assert runtime.stat().st_size == asset["bytes"]
    observed[key] = {"alpha": a.getchannel("A").getextrema(), "bytes": asset["bytes"]}
    if key in ["floor", "props"]:
        paths += [source, runtime]
    if key == "props":
        alpha = a.getchannel("A")
        for name, f in data["frames"].items():
            l,t,r,bottom = f["x"],f["y"],f["x"]+f["width"],f["y"]+f["height"]
            assert 0 <= l < r <= a.width and 0 <= t < bottom <= a.height
            rows = [(l,t,r,t+1),(l,bottom-1,r,bottom),(l,t,l+1,bottom),(r-1,t,r,bottom)]
            edges[name] = max(max(alpha.crop(row).getdata()) for row in rows)
            assert edges[name] <= 8
for name in ["prompts", "reference"]:
    p = data["provenance"][name]
    assert hashlib.sha256((ROOT / p["path"]).read_bytes()).hexdigest() == p["sha256"]
before = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
subprocess.run(["python3", "dev/tools/build-aw2-village.py"], cwd=ROOT, check=True, capture_output=True)
assert all(hashlib.sha256((ROOT/p).read_bytes()).hexdigest() == h for p,h in before.items())
report = {"task":"AW2-006G","status":"PASS","exactRgba":True,"repeatHashes":before,"assets":observed,"frameEdgeAlpha":edges,"budget":data["budget"]}
out = ROOT / ".asset-work/aw2-006g/files.json"
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report))
