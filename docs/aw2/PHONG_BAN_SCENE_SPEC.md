# Phòng Bàn — authored environment slice / AW2-006B

2026-10-23 · pre-edit BA/story/animation/mechanic/tester contract · implementation NOT_RUN at specification time. Approved002/D14 arc and existing runtime geometry are the source of story/interaction truth. This spec adds visual material, not new NPC identity, missing-person reveal, quest, reward or collision.

Canonical zone `aw2-zone-kitchen-table`, environment visual ID `aw2-environment-kitchen-table-v1`. World640×384, orthographic overhead floor aligned with current chibi camera. Existing walkable bounds and one obstacle stay unchanged. No text/door/NPC is baked into background. Dynamic HTML labels and native navigation explain actual quest state, including reward-free post-ending rematch.

| Runtime anchor | Coordinate/contract | Planned visual |
|---|---|---|
| Safe west spawn/checkpoint |96,192 | Clear open floor |
| West return to Phòng Lửa |24,192; always usable outside battle | Existing native interaction marker over open floor, text waypoint |
| Người Giữ Bàn Quên |320,128; actual quest/rematch gates | Own existing HD battle.idle frame reused as static world marker, state label; full4direction world/motion incomplete |
| Ghi chép bên chén |448,144; requires real victory | Existing readable note marker/text state, no automatic read on movement |
| Shortcut to Sân |520,240; quest4 only | Locked/open native state, same travel command/spawn |
| Sole collision obstacle |288,304 width64 height48 | Original low wooden table/sideboard with an empty bowl/folded cloth; visual canopy may rise above footprint, sorted at lower edge and fades on character overlap |

Artwork palette follows current warm dining/kitchen mood: aged amber wood, quiet moss/teal accents and a soft lantern glow. Empty bowl/cloth expresses the already approved reserved-place motif without identifying the absent person. Two raster assets: open worn floor/background plate; transparent isolated table/sideboard. Built-in imagegen generates all painted pixels; selected PNGs retained, lossless WebP encoding only, measured rect/alpha/bytes/hashes in manifest/provenance. No external style/game/artist assets. Rights REVIEW_REQUIRED/commercial NOT_CLEARED until review; generated artwork is a development environment reference, not independent full-room approval.

Rendering: base plate below actors, grounded obstacle sorted by world y; any actor behind an overlapping canopy triggers lower prop alpha. The player and up to four followers remain legible. Image load errors must be visible and stop navigation while incomplete; no silent substitution marked complete. Original five other zones keep debug terrain; original12character assets unchanged. No new sound cues or false listening/device acceptance.

Waypoints have native labels and at least44px controls; they call the existing bounded path search and stop at the target, leaving E/Tương tác explicit. No persisted objective, completion, inventory or ownership state changes from viewing the scene or walking. Boss/note status derives from committed progression; shortcut unlock derives only from quest4. Loading, dialog and busy states disable controls. Color is supplementary to text.

Verification will distinguish exact historically earned checkpoint input from native actions in this task; assert traversable paths/both exits/obstacle bounds, state changes across actual victory/note/ending/rematch, all12followers/depth/fading, mobile/touch/keyboard/reload/stale/failed writes and isolated legacy bytes. Unit tests cover meaningful manifest/path/state/visibility boundaries. Full current-head suite only if shared authority/collision changes, otherwise preserve original-SHA evidence. Owner workflow requires commit/push and independent SHA readback. [Task](tasks/AW2-006B.md), [canon](CANON.md), [plan](NEXT_MILESTONES.md).

Implemented006B at `425aa16d94ea51decf7f43afb5986b13ad126dfc`: two selected generated images, manifest-measured uniform prop80×46.2342 at320,352, alpha.35 on overlap. Source PNG/runtime WebP exact RGBA parity; sideboard alpha>8frame69,278,1187,686 with4px padding/max edge alpha3. Native targets sourced from canonical map; geometry unchanged. [Observed checks/limits](evidence/AW2-006B.md), next[006C](tasks/AW2-006C.md).

006C implemented at `b350a11d777c1e8c94b5f2aadc6299b68f7e7722`: three debug note/exit shapes replaced by original ground props, centered at unchanged canonical objects; layer1 below actors, note44×31.6923/threshold36×21.6923, uniform measured frame scale. Note alpha.55→1after true victory, shortcut.4→1after ending, west1always; live state cannot authorize any action. Labels now start24worldpixels below anchors. Sources alpha0..254/edge1preserved. Old-zone ticker stops before accessing destination props. [Task](tasks/AW2-006C.md), [evidence](evidence/AW2-006C.md); boss still HD static, next006D. Prior006B table describes pre-006C visuals.

D17/006E at `d11708bfb316a128e4bb2df7b0104d81e8cabee2` supersedes the original five-follower rendering contract: one first saved member represents exploration, using actual position/facing and furniture visibility. All five remain in saved party/combat; original geometry/room assets/states unchanged. Historical006B/006Cfull-follower checks stay source-bound. [Task](tasks/AW2-006E.md), [evidence](evidence/AW2-006E.md).

006D at `PENDING006D` supersedes the old HD-static marker: sibling forgotten-host.world-v1 manifest owns four original idle frames/common scale/foot anchors, fixed canonical ground320,128(+6spritefoot). Dominant-axis facing follows actual player; ties vertical/zero down, alpha1/.6/1by existing victory/ending. Labels now24pixels below ground anchor. Original006Braw JSON/builder retained historical byte-for-byte; exported TABLE_ROOM_SCENE composes current bossMarker from new world registry. Not full motion/enemy acceptance. [Task](tasks/AW2-006D.md), [evidence](evidence/AW2-006D.md), next006F.
