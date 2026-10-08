"""Measure existing transparent atlases; do not modify their artwork. Requires Pillow."""
import json
from pathlib import Path
from statistics import median
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
# Reviewed row boundaries: the illustration atlases are NOT uniform grids.
SHEETS = {
    "base": ("movement", 14, [0, 107, 232, 352, 466, 590, 699, 816, 948]),
    "fresh": ("new-movement", 7, [0, 112, 225, 334, 456, 582, 709, 836, 956, 1060, 1179, 1316, 1469, 1613, 1774]),
    "enemy": ("monsters", 7, [0, 107, 202, 310, 424, 538, 644, 773, 878, 999, 1127, 1308, 1436, 1570, 1774]),
}

def measure(name, columns, boundaries):
    image = Image.open(ROOT / f"public/assets/autochess/{name}.webp").convert("RGBA")
    alpha = image.getchannel("A")
    rows = []
    for y0, y1 in zip(boundaries, boundaries[1:]):
        frames, heights = [], []
        for column in range(columns):
            x0, x1 = round(image.width * column / columns), round(image.width * (column + 1) / columns)
            mask = alpha.crop((x0, y0, x1, y1)).point(lambda a: 255 if a > 96 else 0)
            bounds = mask.getbbox()
            if not bounds:
                raise ValueError(f"Empty frame {name}, {len(rows)}, {column}")
            l, t, r, b = bounds
            # Foot position compensates drift between poses. Restrict X to the
            # body centre so a spell/weapon at the edge never becomes the pivot.
            feet = mask.crop((l, max(t, b - max(5, (b - t) // 5)), r, b))
            pixels = feet.load()
            weight = sum(pixels[x, y] for x in range(feet.width) for y in range(feet.height))
            foot_x = l + sum(x * pixels[x, y] for x in range(feet.width) for y in range(feet.height)) / max(1, weight)
            centre = (l + r) / 2
            pivot_x = max(centre - (r - l) * .12, min(centre + (r - l) * .12, foot_x))
            frames.append([x0 + l, y0 + t, r - l, b - t, round(pivot_x - l, 2), b - t])
            if column < 3:
                heights.append(b - t)
        rows.append({"height": median(heights), "frames": frames})
    return {"path": f"/assets/autochess/{name}.webp", "width": image.width, "height": image.height, "rows": rows}

if __name__ == "__main__":
    measured = {key: measure(*settings) for key, settings in SHEETS.items()}
    target = ROOT / "src/game/autochess/spriteFrames.json"
    target.write_text(json.dumps(measured, separators=(",", ":")) + "\n")
    print(f"Measured {sum(len(row['frames']) for sheet in measured.values() for row in sheet['rows'])} frames → {target.relative_to(ROOT)}")
