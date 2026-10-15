#!/usr/bin/env python3
"""Build Web 5.8 runtime art from the approved source atlases."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "dev/docs/web-v580/source"
OUT = ROOT / "public/assets/rpg/campaign580"
VILLAGE_OUT = ROOT / "public/assets/rpg/village580"


def keyed_black(image: Image.Image) -> Image.Image:
    """Turn the atlas' near-black matte into a soft transparent edge."""
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    peak = rgb.max(axis=2).astype(np.float32)
    alpha = np.clip((peak - 3.0) * (255.0 / 22.0), 0, 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    return Image.fromarray(rgba, "RGBA")


def split_environment_atlas() -> None:
    source = Image.open(SOURCE / "campaign-environments.jpg").convert("RGB")
    names = (
        "tea-cloud-peak.webp",
        "red-salt-kiln.webp",
        "moon-lotus-marsh.webp",
        "aroma-palace.webp",
    )
    x_edges = [round(index * source.width / 2) for index in range(3)]
    y_edges = [round(index * source.height / 2) for index in range(3)]
    for index, name in enumerate(names):
        column, row = index % 2, index // 2
        crop = source.crop(
            (x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1])
        )
        crop = crop.resize((1280, 720), Image.Resampling.LANCZOS)
        crop = crop.filter(ImageFilter.UnsharpMask(radius=1.2, percent=105, threshold=3))
        crop.save(OUT / name, "WEBP", quality=90, method=6)


def build_enemy_atlas(source_name: str, output_name: str) -> None:
    source = Image.open(SOURCE / source_name).convert("RGB")
    atlas = Image.new("RGBA", (1400, 1280), (0, 0, 0, 0))
    x_edges = [round(index * source.width / 7) for index in range(8)]
    y_edges = [round(index * source.height / 8) for index in range(9)]
    for row in range(8):
        for column in range(7):
            cell = source.crop(
                (
                    x_edges[column],
                    y_edges[row],
                    x_edges[column + 1],
                    y_edges[row + 1],
                )
            ).resize((200, 160), Image.Resampling.LANCZOS)
            atlas.alpha_composite(keyed_black(cell), (column * 200, row * 160))
    atlas.save(OUT / output_name, "WEBP", lossless=True, method=6)


def build_ceremony_atlas() -> None:
    source = Image.open(SOURCE / "battle-ceremony.jpg").convert("RGB")
    # Keep the 5 × 5 grid intact so CSS can choose element and phase.
    keyed_black(source).save(OUT / "battle-ceremony.webp", "WEBP", lossless=True, method=6)


def build_village_art() -> None:
    village = Image.open(SOURCE / "village-crossroads.jpg").convert("RGB")
    village.save(VILLAGE_OUT / "crossroads.webp", "WEBP", quality=90, method=6)
    world = Image.open(SOURCE / "village-world.jpg").convert("RGB")
    world.save(
        ROOT / "public/assets/loading/v560/intro-jade-adventure.webp",
        "WEBP",
        quality=90,
        method=6,
    )


def build_village_party() -> None:
    source = Image.open(SOURCE / "village-party.jpg").convert("RGB")
    # The approved sheet is 12 columns (hero, flame, dragon) × 4 directions.
    # The game character renderer needs seven action poses per row, so map the
    # four right-facing walk frames to a gentle idle/walk/victory sequence.
    atlas = Image.new("RGBA", (896, 576), (0, 0, 0, 0))
    pose_map = (0, 1, 2, 3, 2, 1, 0)
    for actor in range(3):
        for output_pose, source_pose in enumerate(pose_map):
            left = (actor * 4 + source_pose) * 128
            frame = source.crop((left, 512, left + 128, 768))
            frame = frame.resize((128, 192), Image.Resampling.LANCZOS)
            rendered = keyed_black(frame)
            # The first flame cell contains a narrow tail from the hero cell
            # immediately to its left in the supplied sheet.
            if actor == 1 and source_pose == 0:
                rgba = np.asarray(rendered).copy()
                rgba[:, :18, 3] = 0
                rendered = Image.fromarray(rgba, "RGBA")
            atlas.alpha_composite(rendered, (output_pose * 128, actor * 192))
    atlas.save(VILLAGE_OUT / "party.webp", "WEBP", lossless=True, method=6)


def write_manifest() -> None:
    files = sorted(OUT.glob("*.webp")) + sorted(VILLAGE_OUT.glob("*.webp"))
    manifest = {}
    for path in files:
        with Image.open(path) as image:
            manifest[str(path.relative_to(ROOT / "public"))] = {
                "width": image.width,
                "height": image.height,
                "bytes": path.stat().st_size,
            }
    (ROOT / "dev/docs/web-v580/art-assets.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def update_sprite_manifest() -> None:
    """Measure the exact transparent crops used by CharacterSprite."""
    path = ROOT / "src/game/autochess/spriteFrames.json"
    frames = json.loads(path.read_text(encoding="utf-8"))
    sheets = (
        ("campaignA", OUT / "campaignA.webp", 200, 160, 8),
        ("campaignB", OUT / "campaignB.webp", 200, 160, 8),
        ("villageParty", VILLAGE_OUT / "party.webp", 128, 192, 3),
    )
    for key, source, cell_width, cell_height, row_count in sheets:
        image = Image.open(source).convert("RGBA")
        alpha = image.getchannel("A")
        mask = alpha.point(lambda value: 255 if value > 80 else 0)
        rows = []
        for row in range(row_count):
            poses = []
            for column in range(7):
                left, top = column * cell_width, row * cell_height
                box = mask.crop(
                    (left, top, left + cell_width, top + cell_height)
                ).getbbox()
                if not box:
                    raise RuntimeError(f"Empty sprite: {key} {row} {column}")
                x0, y0, x1, y1 = box
                sx, sy, width, height = left + x0, top + y0, x1 - x0, y1 - y0
                feet = alpha.crop((sx, max(sy, sy + height - 8), sx + width, sy + height))
                weights = [
                    sum(feet.getpixel((x, y)) for y in range(feet.height))
                    for x in range(width)
                ]
                total, running, anchor = sum(weights), 0, width / 2
                for x, weight in enumerate(weights):
                    running += weight
                    if running >= total / 2:
                        anchor = x + 0.5
                        break
                poses.append([sx, sy, width, height, anchor, height])
            rows.append({"height": cell_height, "frames": poses})
        frames[key] = {
            "path": f"/{source.relative_to(ROOT / 'public')}",
            "width": image.width,
            "height": image.height,
            "rows": rows,
        }
    path.write_text(
        json.dumps(frames, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    VILLAGE_OUT.mkdir(parents=True, exist_ok=True)
    split_environment_atlas()
    build_enemy_atlas("enemies-tea-salt.jpg", "campaignA.webp")
    build_enemy_atlas("enemies-lotus-aroma.jpg", "campaignB.webp")
    build_ceremony_atlas()
    build_village_art()
    build_village_party()
    update_sprite_manifest()
    write_manifest()


if __name__ == "__main__":
    main()
