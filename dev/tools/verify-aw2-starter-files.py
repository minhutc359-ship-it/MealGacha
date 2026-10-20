"""Read-only verification of all five starters and the new generation audit trail."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from PIL import Image

root = Path(__file__).resolve().parents[2]
reports = []
portraits, audio = set(), set()
for unit in ["than", "lua", "lam", "moc-non", "suong"]:
    report = json.loads(subprocess.check_output([sys.executable, str(Path(__file__).with_name("verify-aw2-than-files.py")), f"src/aw2/assets/{unit}.base-v1.json"], cwd=root))
    reports.append(report)
    manifest = json.loads((root / f"src/aw2/assets/{unit}.base-v1.json").read_text())
    for asset in manifest["assets"].values():
        source = Image.open(root / asset["source"]["path"]).convert("RGBA")
        packed = Image.open(root / asset["url"].removeprefix("/")).convert("RGBA")
        assert source.getchannel("A").tobytes() == packed.getchannel("A").tobytes()
        assert all(a[3] == 0 or a == b for a, b in zip(source.getdata(), packed.getdata()))
    if unit == "than": continue
    directory = root / f"dev/aw2/assets/{unit}/base-v1"
    provenance = json.loads((directory / "provenance.json").read_text())
    prompts = json.loads((directory / "prompts.json").read_text())
    assert provenance["externalReferences"] == [] and provenance["licenseStatus"] == "REVIEW_REQUIRED"
    calls = {call["id"] for call in prompts["calls"]}
    selected = [output for output in provenance["outputs"] if output["selected"]]
    assert len(selected) == 4
    for output in selected:
        assert output["callId"] in calls
        assert hashlib.sha256((root / output["workspacePath"]).read_bytes()).hexdigest() == output["sha256"]
    portraits.add(manifest["assets"]["portrait"]["sha256"])
    audio.update(skill["audio"]["sha256"] for skill in manifest["skills"].values())
assert len(portraits) == 4 and len(audio) == 16, "Distinct identity portraits and audio per skill/unit"
print(json.dumps({"task":"AW2-004B", "status":"PASS", "units":reports, "newSourceImages":16, "newAudioCues":16, "newUniqueWebpBytes":sum(report["webpBytes"] for report in reports[1:]), "checks":["source/packed visible RGBA and alpha equality", "selected prompt/output/workspace hashes", "four distinct portraits and sixteen distinct audio cues", "rights not cleared; no full-character completion"]}))
