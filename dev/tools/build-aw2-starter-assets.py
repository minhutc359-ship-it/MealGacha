"""Encode preserved image_gen sources, measure cells and author presentation tracks.

No image repainting/masking/resizing/mirroring. Portrait doubles as identity reference.
Uses AW2-004A's lossless encoder, actual alpha measurements and original cue synth.
"""
from pathlib import Path
import copy
import argparse
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("than_build", Path(__file__).with_name("build-aw2-than-assets.py"))
util = importlib.util.module_from_spec(spec)
spec.loader.exec_module(util)
STATES = util.STATES
SLOTS = ["basic", "auto", "passive", "ultimate"]
CONFIG = {
    "lua": {"name": "Lửa Nhỏ", "worldY": [0, 314, 627, 940, 1254], "battleX": [0, 384, 768, 1152, 1536], "battleY": [0, 512, 1024],
            "skills": ["Nhịp Giòn", "Chuyền Hơi Ấm", "Đúng Giờ", "Dọc Phố Sớm"], "passive": "same-target rhythm event from combat; capped", "pitch": 1.2},
    "lam": {"name": "Lam Lam", "worldY": [0, 319, 624, 929, 1254], "battleX": [0, 384, 768, 1152, 1536], "battleY": [0, 519, 1024],
            "skills": ["Giọt Trong", "Chan Ấm", "Để Nguội Vừa", "Bữa Ăn Yên"], "passive": "capped overheal event from combat", "pitch": 1.5},
    "moc-non": {"name": "Mộc Non", "worldY": [0, 308, 617, 920, 1254], "battleX": [0, 406, 768, 1152, 1536], "battleY": [0, 513, 1024],
                "skills": ["Lá Gửi", "Gói Gọn", "Mỗi Người Một Tay", "Chung Một Mâm"], "passive": "two distinct allies helped event from combat; capped", "pitch": 1.8},
    "suong": {"name": "Sương Lành", "worldY": [0, 314, 619, 922, 1254], "battleX": [0, 384, 768, 1152, 1536], "battleY": [0, 512, 1024],
              "skills": ["Dải Hơi", "Trải Sương", "Nét Còn Rõ", "Lối Qua Màn Trắng"], "passive": "zone dwell threshold event from combat; per-target cooldown", "pitch": 2.1},
}


def apply_lua_motion(data):
    """Pack preserved generated RGBA; timing/scale changes are metadata only."""
    sheets = [
        ("battle-motion-a-v1", STATES[:4], [0, 324, 643, 963, 1254], [0, 346, 643, 949, 1254]),
        ("battle-motion-b-v2", STATES[4:], [0, 338, 643, 963, 1254], [0, 354, 651, 951, 1254]),
    ]
    timing = {"idle": [0, 300, 600, 900], "move": [0, 170, 340, 510],
              "attack": [0, 220, 300, 380], "cast": [0, 210, 420, 740],
              "hit": [0, 80, 180, 340], "guard": [0, 180, 400, 700],
              "ultimate": [0, 280, 560, 960], "defeat": [0, 220, 480, 760]}
    for name, states, xs, ys in sheets:
        asset = util.encode(name)
        asset["id"] = f"aw2-lua:{name}:base-v1"
        data["assets"][name] = asset
        cells = util.frames(name, xs, ys, [[f"battle.{state}.{i}" for i in range(4)] for state in states])
        for frame in cells.values(): frame["renderScale"] = 1.35 if name == "battle-motion-a-v1" else 1.9
        data["frames"].update(cells)
        for state in states:
            clip = data["battle"][state]
            clip["frames"] = [{"atMs": at, "frame": f"battle.{state}.{i}"} for i, at in enumerate(timing[state])]
            if state == "attack": clip["frames"].append({"atMs": 560, "frame": "battle.idle.0"})
            clip["reducedMotionFrame"] = f"battle.{state}"
            clip["method"] = "four distinct image_gen cels with authored frame timing; attack has two contacts and idle recovery; independent art review pending"
    data["status"] = "MOTION_REFERENCE_IMPLEMENTED"
    data["provenance"]["processing"] += "; motion RGBA sources unchanged, calibrated rectangles/anchors and logical renderScale metadata only"
    for skill in data["skills"].values():
        skill["scope"] = "reference presentation used by development combat; final balance/full-character QA pending"


def apply_lam_motion(data):
    """Preserved image_gen cels; rectangles, pivots and scale are metadata."""
    sheets = [
        ("battle-motion-a-v2", STATES[:4], [0, 291, 645, 947, 1254], [0, 334, 645, 947, 1254], 1.6),
        ("battle-motion-b-v2", STATES[4:], [0, 325, 645, 947, 1254], [0, 325, 661, 947, 1254], 1.65),
    ]
    timing = {"idle": [0, 300, 600, 900], "move": [0, 170, 340, 510],
              "attack": [0, 260, 700, 820], "cast": [0, 210, 420, 740],
              "hit": [0, 80, 180, 340], "guard": [0, 180, 400, 700],
              "ultimate": [0, 520, 800, 1040], "defeat": [0, 220, 480, 760]}
    for name, states, xs, ys, scale in sheets:
        asset = util.encode(name)
        asset["id"] = f"aw2-lam:{name}:base-v1"
        data["assets"][name] = asset
        cells = util.frames(name, xs, ys, [[f"battle.{state}.{i}" for i in range(4)] for state in states])
        for frame in cells.values(): frame["renderScale"] = scale
        data["frames"].update(cells)
        for state in states:
            clip = data["battle"][state]
            clip["frames"] = [{"atMs": at, "frame": f"battle.{state}.{i}"} for i, at in enumerate(timing[state])]
            clip["reducedMotionFrame"] = f"battle.{state}"
            clip["method"] = "four distinct image_gen cels with authored timing; launch/impact and two healing gestures are reference cues; independent art review pending"
    data["status"] = "MOTION_REFERENCE_IMPLEMENTED"
    data["provenance"]["processing"] += "; motion RGBA sources unchanged, calibrated rectangles/anchors and logical renderScale metadata only"
    for skill in data["skills"].values():
        skill["scope"] = "reference presentation used by development combat; final balance/full-character QA pending"


def apply_moc_motion(data):
    """Keep generated RGBA unchanged; calibrate actual nonuniform cells."""
    timing = {"idle": [0, 300, 600, 900], "move": [0, 170, 340, 510],
              "attack": [0, 260, 700, 820], "cast": [0, 210, 420, 740],
              "hit": [0, 80, 180, 340], "guard": [0, 180, 400, 700],
              "ultimate": [0, 280, 560, 960], "defeat": [0, 220, 480, 760]}
    for name, states in [("battle-motion-a-v1", STATES[:4]), ("battle-motion-b-v1", STATES[4:])]:
        asset = util.encode(name)
        asset["id"] = f"aw2-moc-non:{name}:base-v1"
        data["assets"][name] = asset
        if name == "battle-motion-a-v1":
            cells = util.frames(name, [0, 322, 645, 965, 1254], [0, 338, 649, 948, 1254], [[f"battle.{state}.{i}" for i in range(4)] for state in states])
        else:
            cells = {}
            xs = [0, 330, 654, 976, 1263]
            cuts = [[0, 341, 662, 958, 1246], [0, 341, 662, 976, 1246],
                    [0, 341, 661, 979, 1246], [0, 344, 661, 976, 1246]]
            for col in range(4):
                cells.update(util.frames(name, xs[col:col + 2], cuts[col], [[f"battle.{state}.{col}"] for state in states]))
        for frame in cells.values(): frame["renderScale"] = 1.45
        data["frames"].update(cells)
        for state in states:
            clip = data["battle"][state]
            clip["frames"] = [{"atMs": at, "frame": f"battle.{state}.{i}"} for i, at in enumerate(timing[state])]
            clip["reducedMotionFrame"] = f"battle.{state}"
            clip["method"] = "four distinct image_gen cels with authored timing; reference support/launch/impact cues; independent art review pending"
    data["status"] = "MOTION_REFERENCE_IMPLEMENTED"
    data["provenance"]["processing"] += "; motion RGBA unchanged, calibrated per-column rectangles/anchors and logical renderScale metadata only"
    for skill in data["skills"].values():
        skill["scope"] = "reference presentation used by development combat; final balance/full-character QA pending"


def build(unit, config):
    identity = f"aw2-{unit}"
    util.ASSETS = ROOT / f"dev/aw2/assets/{unit}/base-v1"
    util.URL = f"/dev/aw2/assets/{unit}/base-v1/"
    # Preserve unit-owned metadata. Never inherit another character's mutable
    # motion frames, assets, status or provenance from a live manifest.
    data = json.loads((ROOT / f"src/aw2/assets/{unit}.base-v1.json").read_text())
    data["battle"] = util.reference_battle_clips(identity)
    sources = {name: util.encode(name) for name in ["world", "battle", "portrait", "fx"]}
    for name, asset in sources.items():
        asset["id"] = f"{identity}:{name}:base-v1"
    sources["reference"] = {**copy.deepcopy(sources["portrait"]), "id": f"{identity}:reference:base-v1"}
    directions = ["down", "right", "left", "up"] if unit == "suong" else ["down", "left", "right", "up"]
    cells = {}
    for row, direction in enumerate(directions):
        # Measured Mộc Non gutter has one faint alpha=9 edge pixel; retain
        # contiguous source rectangles and declare this 9/255 tolerance explicitly.
        start = config["worldY"][row]
        cells.update(util.frames("world", [0, 314, 627, 940, 1254], [start, config["worldY"][row + 1]], [[f"world.{direction}.{i}" for i in range(4)]], edge_tolerance=9 if unit == "moc-non" else 8))
    for col in range(4):
        split = 514 if unit == "moc-non" and col == 3 else config["battleY"][1]
        cells.update(util.frames("battle", config["battleX"][col:col + 2], [0, split, 1024], [[f"battle.{STATES[col]}"], [f"battle.{STATES[col + 4]}"]]))
    cells.update(util.frames("fx", [0, 314, 627, 940, 1254], [0, 314, 627, 940, 1254], [[f"fx.{s}.{i}" for i in range(4)] for s in SLOTS]))
    data.update(spiritId=identity, displayName=config["name"], assets=sources, frames=cells)
    basic = data["battle"]["attack"]
    basic.update(durationMs=1000 if unit != "lua" else 760)
    basic["frames"] = [{"atMs": 0, "frame": "battle.idle"}, {"atMs": 120, "frame": "battle.attack"}, {"atMs": 820 if unit != "lua" else 560, "frame": "battle.idle"}]
    basic["motion"] = util.track((0, 0, 0, 0, 1, 1), (120, -10, 0, -.02, 1, 1), (220, 22, 0, .02, 1, 1), (300, -6, 0, -.01, 1, 1), (380, 30, 0, .02, 1, 1), (760, 0, 0, 0, 1, 1)) if unit == "lua" else util.track((0, 0, 0, 0, 1, 1), (260, 4, 0, .01, 1, 1), (1000, 0, 0, 0, 1, 1))
    basic["markers"] = [{"atMs": at, "kind": "contact", "skill": "basic"} for at in [220, 380]] if unit == "lua" else [{"atMs": 260, "kind": "launch", "skill": "basic"}, {"atMs": 700, "kind": "impact-preview", "skill": "basic"}]
    if unit == "lam":
        ultimate = data["battle"]["ultimate"]
        ultimate.update(durationMs=1700, markers=[{"atMs": at, "kind": "heal-pulse-preview", "skill": "ultimate"} for at in [520, 1040]])
        ultimate["motion"] = util.track((0, 0, 0, 0, 1, 1), (520, 0, -3, 0, 1.02, 1), (800, 0, 0, 0, 1, 1), (1040, 0, -3, 0, 1.02, 1), (1700, 0, 0, 0, 1, 1))
    if unit == "lua":
        data["battle"]["ultimate"]["motion"] = util.track((0, -10, 0, 0, 1, 1), (360, -15, 0, -.02, 1, 1), (560, 80, 0, .02, 1, 1), (1320, 0, 0, 0, 1, 1))
    for index, slot in enumerate(SLOTS):
        skill = data["skills"][slot]
        skill["displayName"] = config["skills"][index]
        beats = [220, 380] if slot == "basic" and unit == "lua" else [700] if slot == "basic" else [520, 1040] if slot == "ultimate" and unit == "lam" else [180] if slot == "passive" else [420] if slot == "auto" else [560]
        skill.update(fxCueAtMs=beats, fxTriggerAtMs=beats[0], fxFrameMs=90 if slot == "basic" else 110)
        skill["trigger"] = config["passive"] if slot == "passive" else "authored presentation cue; combat owns validation, interruption and outcome"
        x, y, scale, layer, attachment = (200, -220, 1.2, "front", "contact") if slot == "basic" else (220, -150, 1.5, "front", "unit") if slot == "auto" else (0, -115, 1.3, "front", "unit") if slot == "passive" else (60, -110, 2.2, "behind", "unit")
        if unit != "lua" and slot == "basic": x, y, scale = 300, -240, 1
        if unit == "lua" and slot == "auto": x, y, scale, layer = 100, -130, 1.8, "behind"
        if unit == "suong" and slot == "auto": x, y, scale = 250, -70, 1.7
        if unit == "suong" and slot == "passive": x, y = 250, -185
        if unit in ["lua", "suong"] and slot == "ultimate": x, y, scale = 130, -85, 2
        skill["fxPlacement"] = {"attachment": attachment, "layer": layer, "x": x, "y": y, "scale": scale}
        skill["projectile"] = {"frames": ["fx.basic.0", "fx.basic.1"], "frameMs": 100, "launchAtMs": 260, "impactAtMs": 700, "from": {"x": 100, "y": -240}, "to": {"x": 300, "y": -240}, "scale": .75} if slot == "basic" and unit != "lua" else None
        pitch = config["pitch"]
        length = [.16, .34, .22, .46][index]
        notes = [(frequency * pitch, sweep * pitch, volume) for frequency, sweep, volume in [(220 + index * 80, 120 + index * 45, .18), (440 + index * 110, -80, .09)]]
        skill["audio"] = util.cue(slot, length, notes, .035 if unit == "lua" else 0)
        skill["audio"]["id"] = f"{identity}:audio:{slot}"
    data["provenance"].update(referenceAsset=f"{identity}:portrait:base-v1", prompts=util.URL + "prompts.json", processing="unchanged source PNGs; lossless WebP encoding with real alpha; measured cell rectangles/visible pivots; portrait also used as identity reference; no repaint/masking/mirroring/resizing")
    data["provenance"]["alphaEdgeTolerance"] = 9 if unit == "moc-non" else 8
    if unit == "lua":
        apply_lua_motion(data)
    if unit == "lam":
        apply_lam_motion(data)
    if unit == "moc-non":
        apply_moc_motion(data)
    (ROOT / f"src/aw2/assets/{unit}.base-v1.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"unit": identity, "status": "PASS", "frames": len(data["frames"]), "webpBytes": sum(a["bytes"] for n, a in sources.items() if n != "reference")}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--unit", choices=list(CONFIG))
    selected = parser.parse_args().unit
    for unit, config in CONFIG.items():
        if selected is None or selected == unit:
            build(unit, config)
