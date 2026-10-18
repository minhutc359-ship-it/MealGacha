#!/usr/bin/env python3
import hashlib, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public/assets/manga5915"
DOCS = ROOT / "dev/docs/web-v5915"
TCG = ["cover", "lantern", "harbor", "garden", "tide", "moon", "last-table", "living-market", "rain-harbor", "tomorrow-table"]
ADVENTURE = ["cover", "lantern", "harbor", "garden", "tide", "mistwood", "sugartower", "ashalley", "lasttable"]
STORY = {
    "tcg": "src/game/narrative.ts + src/game/livingStory.ts",
    "adventure": "src/game/adventureRpg/story.ts + src/game/adventureRpg/content.ts",
}
REFERENCES = {
    "tcg": ["public/assets/characters/chefs593/", "public/assets/tcg/story/", "public/assets/v4/arenas/", "public/assets/autochess/portraits.webp"],
    "adventure": ["public/assets/characters/chefs593/", "public/assets/rpg/campaign580/", "public/assets/tcg/characters/anime/", "public/assets/autochess/portraits.webp"],
}

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    rows = []
    for track, ids in (("tcg", TCG), ("adventure", ADVENTURE)):
        for page_id in ids:
            path = ASSETS / track / f"{page_id}.webp"
            if not path.exists():
                raise SystemExit(f"missing {path.relative_to(ROOT)}")
            with Image.open(path) as image:
                image.load()
                if image.size != (1086, 1448) or image.mode not in ("RGB", "RGBA"):
                    raise SystemExit(f"invalid image {path}: {image.size} {image.mode}")
            rows.append({
                "track": track,
                "id": page_id,
                "path": str(path.relative_to(ROOT)),
                "size": [1086, 1448],
                "bytes": path.stat().st_size,
                "sha256": digest(path),
                "tool": "Built-in Imagegen",
                "storySource": STORY[track],
                "identityReferences": REFERENCES[track],
                "promptPolicy": "Five-panel vertical manga page, canonical events and identities, no baked text; exact Vietnamese dialogue is rendered from source data.",
            })
    expected = set(TCG) | set(ADVENTURE)
    actual = {path.stem for path in ASSETS.glob("*/*.webp")}
    if not expected.issubset(actual) or len(rows) != 19:
        raise SystemExit("manga asset set mismatch")
    report = {
        "version": "5.9.15",
        "generatedOn": "2026-10-18",
        "count": len(rows),
        "bytes": sum(row["bytes"] for row in rows),
        "pages": rows,
    }
    if "--write" in sys.argv:
        DOCS.mkdir(parents=True, exist_ok=True)
        (DOCS / "asset-provenance.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pages": len(rows), "bytes": report["bytes"], "decoded": True}))

if __name__ == "__main__":
    main()
