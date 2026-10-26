#!/usr/bin/env python3
"""Build AW2-006Q yard motion and extend the verified v1 ambient manifest."""
from pathlib import Path
import hashlib, json
from PIL import Image, __version__ as pillow_version

R = Path(__file__).resolve().parents[2]
root = R / "dev/aw2/assets/environments/ambient/v2"
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


specs = {
    "yard-steam": dict(
        zoneId="aw2-zone-forgotten-kitchen-yard",
        displayWidth=34,
        displayHeight=50,
        depth=-700,
        placements=[(-60, -105), (65, -96), (720, 420)],
    ),
    "yard-water": dict(
        zoneId="aw2-zone-forgotten-kitchen-yard",
        displayWidth=60,
        displayHeight=24,
        depth=-850,
        placements=[(820, -70), (900, 100), (920, 255)],
    ),
}
names = ["calm", "lift", "bright", "settle"]
previous = read(R / "src/aw2/assets/ambient-motion-v1.json")
assets = dict(previous["assets"])
regions = list(previous["regions"])

for kind, spec in specs.items():
    source_path = root / f"{kind}-source.png"
    runtime_path = root / f"{kind}.webp"
    source = Image.open(source_path).convert("RGBA")
    width, height = source.size
    assert read(root / f"{kind}-selection.json")["sha256"] == sha(source_path)
    assert source.getextrema()[3][0] == 0

    alpha = source.getchannel("A")
    full = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    assert full
    sx0, sy0 = max(0, full[0] - 12), max(0, full[1] - 12)
    sx1, sy1 = min(width, full[2] + 12), min(height, full[3] + 12)
    runtime = source.crop((sx0, sy0, sx1, sy1))
    runtime.save(runtime_path, format="WEBP", lossless=True, exact=True, method=6)
    assert Image.open(runtime_path).convert("RGBA").tobytes() == runtime.tobytes()

    frames = {}
    for index, name in enumerate(names):
        x0, x1 = index * width // 4, (index + 1) * width // 4
        frame_alpha = alpha.crop((x0, 0, x1, height))
        bounds = frame_alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
        assert bounds
        left = max(0, bounds[0] - 8)
        top = max(0, bounds[1] - 8)
        right = min(x1 - x0, bounds[2] + 8)
        bottom = min(height, bounds[3] + 8)
        edges = [
            frame_alpha.crop((left, top, right, top + 1)),
            frame_alpha.crop((left, bottom - 1, right, bottom)),
            frame_alpha.crop((left, top, left + 1, bottom)),
            frame_alpha.crop((right - 1, top, right, bottom)),
        ]
        edge_max = max(max(edge.getdata()) for edge in edges)
        assert edge_max <= 8, (kind, name, edge_max)
        frames[name] = dict(
            x=x0 + left - sx0,
            y=top - sy0,
            width=right - left,
            height=bottom - top,
            alphaEdgeMax=edge_max,
            cell=dict(x=x0 - sx0, y=-sy0, width=x1 - x0, height=height),
        )

    runtime_width, runtime_height = runtime.size
    assets[kind] = dict(
        id=f"aw2-ambient-v2:{kind}",
        url="/" + str(runtime_path.relative_to(R)),
        width=runtime_width,
        height=runtime_height,
        bytes=runtime_path.stat().st_size,
        sha256=sha(runtime_path),
        source=dict(
            path=str(source_path.relative_to(R)),
            bytes=source_path.stat().st_size,
            sha256=sha(source_path),
            width=width,
            height=height,
            crop=dict(x=sx0, y=sy0, width=runtime_width, height=runtime_height),
        ),
        frames=frames,
    )
    regions.append(
        dict(
            zoneId=spec["zoneId"],
            asset=kind,
            display=dict(width=spec["displayWidth"], height=spec["displayHeight"]),
            depth=spec["depth"],
            placements=[
                dict(id=f"{kind}-{index + 1}", x=x, y=y)
                for index, (x, y) in enumerate(spec["placements"])
            ],
        )
    )

reference = read(root / "yard-steam-prompts.json")["references"]
assert reference == read(root / "yard-water-prompts.json")["references"]
provenance = dict(
    task="AW2-006Q",
    extends=dict(
        manifest="src/aw2/assets/ambient-motion-v1.json",
        sha256=sha(R / "src/aw2/assets/ambient-motion-v1.json"),
        task="AW2-006N/006P",
    ),
    tool="OpenAI built-in image_gen",
    model="not exposed by tool",
    date="2026-10-26",
    calls=2,
    selected=2,
    rejected=0,
    prompts=[
        dict(
            path=str((root / f"{kind}-prompts.json").relative_to(R)),
            sha256=sha(root / f"{kind}-prompts.json"),
        )
        for kind in specs
    ],
    references=reference,
    licenseStatus="REVIEW_REQUIRED",
    commercialRelease="NOT_CLEARED",
    processing="Unchanged selected transparent PNG; transparent-margin crop only; exact RGBA lossless WebP; measured safe frames. No code painting, masking, mirroring, resizing or interpolation.",
    builder="dev/tools/build-aw2-yard-ambient.py",
    pillow=pillow_version,
)

manifest = {
    key: value
    for key, value in previous.items()
    if key not in {"version", "id", "assets", "regions", "provenance"}
}
manifest.update(
    version=2,
    id="aw2-ambient-motion-v2",
    assets=assets,
    regions=regions,
    provenance=provenance,
)
write(root / "provenance.json", provenance)
write(R / "src/aw2/assets/ambient-motion-v2.json", manifest)
print(
    "PASS",
    sum(len(region["placements"]) for region in regions),
    "placements",
    sum(len(asset["frames"]) for asset in assets.values()),
    "frames",
)
