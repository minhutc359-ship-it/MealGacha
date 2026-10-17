"""Re-encode supplied Bach illustration and existing project realms; no repainting."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "dev/docs/web-v5911"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, quality=83, method=6)
    return {"path": str(path.relative_to(ROOT)), "width": image.width,
            "height": image.height, "bytes": path.stat().st_size, "sha256": digest(path)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bach-art", type=Path, required=True,
                        help="Owner-supplied image(3).png from the 2026-10-17 conversation")
    args = parser.parse_args()
    source = ROOT / "dev/docs/web-v530/environments.webp"
    realms = Image.open(source)
    assert realms.size == (1536, 1024)
    records = []
    for i, school in enumerate(["hearth", "ember", "grove", "tide", "sugar"]):
        x, y = (i % 3) * 512, (i // 3) * 512
        cell = realms.crop((x, y, x + 512, y + 512))
        record = encode(cell, ROOT / f"public/assets/rpg/showcase5911/{school}.webp")
        records.append({**record, "school": school, "source": str(source.relative_to(ROOT)),
                        "sourceSHA256": digest(source), "crop": [x, y, x + 512, y + 512],
                        "provenance": "Existing project AI-assisted environment; dev/docs/web-v530/artwork.json"})
    with Image.open(args.bach_art) as bach:
        assert bach.width == bach.height, "Supply the full square illustration, not a model crop"
        record = encode(bach.resize((768, 768), Image.Resampling.LANCZOS),
                        ROOT / "public/assets/tcg/characters/anime/bach.webp")
        records.append({**record, "id": "chef-bach", "source": "Owner attachment image(3).png",
                        "sourceSHA256": digest(args.bach_art), "sourceSize": list(bach.size),
                        "libraryFileId": "libfile_77aebffeaed88191a266b14c31f6654b",
                        "transformation": "Full illustration resized to 768 square; no crop or repaint",
                        "identity": "Dark swept hair, moustache/stubble, ivory shirt, burgundy apron, recipe book and ladle",
                        "provenance": "Owner-supplied illustration; input rights remain subject to publisher verification"})
    (DOC / "showcase-assets.json").write_text(json.dumps({
        "date": "2026-10-17", "encoding": "WebP quality 83 method 6", "assets": records,
        "rights": "Provenance record only; not a certificate of ownership or commercial clearance."
    }, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"files": len(records), "bytes": sum(r["bytes"] for r in records)}))


if __name__ == "__main__":
    main()
