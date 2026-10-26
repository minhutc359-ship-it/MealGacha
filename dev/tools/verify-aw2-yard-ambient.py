#!/usr/bin/env python3
"""Verify AW2-006Q sources, exact runtime pixels and pinned references."""
from pathlib import Path
import hashlib, json, subprocess
from PIL import Image

R = Path(__file__).resolve().parents[2]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path = R / "src/aw2/assets/ambient-motion-v2.json"
manifest = json.loads(manifest_path.read_text())
paths = [manifest_path]
safe = 0
max_edge = 0

for kind in ("yard-steam", "yard-water"):
    asset = manifest["assets"][kind]
    source_path = R / asset["source"]["path"]
    runtime_path = R / asset["url"][1:]
    source = Image.open(source_path).convert("RGBA")
    built = Image.open(runtime_path).convert("RGBA")
    crop = asset["source"]["crop"]
    exact = source.crop(
        (
            crop["x"],
            crop["y"],
            crop["x"] + crop["width"],
            crop["y"] + crop["height"],
        )
    )
    assert exact.size == built.size and exact.tobytes() == built.tobytes()
    assert sha(source_path) == asset["source"]["sha256"]
    assert sha(runtime_path) == asset["sha256"]
    assert (
        json.loads((source_path.parent / f"{kind}-selection.json").read_text())[
            "sha256"
        ]
        == sha(source_path)
    )
    alpha = built.getchannel("A")
    for frame in asset["frames"].values():
        box = (
            frame["x"],
            frame["y"],
            frame["x"] + frame["width"],
            frame["y"] + frame["height"],
        )
        part = alpha.crop(box)
        width, height = part.size
        edges = [
            part.crop((0, 0, width, 1)),
            part.crop((0, height - 1, width, height)),
            part.crop((0, 0, 1, height)),
            part.crop((width - 1, 0, width, height)),
        ]
        edge = max(max(part.getdata()) for part in edges)
        assert edge == frame["alphaEdgeMax"] <= 8
        safe += 1
        max_edge = max(max_edge, edge)
    paths += [
        source_path,
        runtime_path,
        source_path.parent / f"{kind}-prompts.json",
        source_path.parent / f"{kind}-selection.json",
    ]

for reference in manifest["provenance"]["references"]:
    assert sha(R / reference["path"]) == reference["sha256"]
    assert (
        subprocess.check_output(
            ["git", "rev-parse", f"{reference['commit']}:{reference['path']}"],
            cwd=R,
            text=True,
        ).strip()
        == reference["blob"]
    )
    assert (
        hashlib.sha256(
            subprocess.check_output(
                ["git", "show", f"{reference['commit']}:{reference['path']}"],
                cwd=R,
            )
        ).hexdigest()
        == reference["sha256"]
    )

paths.append(R / "dev/aw2/assets/environments/ambient/v2/provenance.json")
before = {str(path.relative_to(R)): sha(path) for path in paths}
subprocess.run(["python3", "dev/tools/build-aw2-yard-ambient.py"], cwd=R, check=True)
assert before == {str(path.relative_to(R)): sha(path) for path in paths}
assert safe == 8
out = R / ".asset-work/aw2-006q"
out.mkdir(parents=True, exist_ok=True)
(out / "files.json").write_text(
    json.dumps(
        dict(
            status="PASS",
            exactRgba=True,
            sourceUnchanged=True,
            safeFrames=safe,
            maxFrameEdgeAlpha=max_edge,
            pinnedReferences=True,
            repeatIdenticalPaths=len(paths),
            sha256=before,
        ),
        indent=2,
    )
    + "\n"
)
print("PASS exactRGBA/8safe frames/pinned refs/repeat", len(paths), "paths")
