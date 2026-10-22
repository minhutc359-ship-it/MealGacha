# Nhiên — reference assets and full-character gates

2026-10-22 · AW2-004K · aw2-nhien/SR/Bún bò/Striker/base-v1. Source `22877ba16e52d70d5447a5870452e3acebe114af`, tree `a36a766f573ffbe921633d2e5bd372669d5e5fbe`, base `8797cc94006322db559ae56fcef05f36ef2990b7` trên `game/adventure-world-2`. D16 exact staged/remote tree và14 binary Git SHA matches PASS; expected-head/force=false publication, independent fetch/tree/index/ancestry/guarded local fast-forward PASS, clean source HEAD bằng fresh remote. Completion chỉ sửa tài liệu; final clean remote readback trước bàn giao.

Giữ Nhịp Chảo/Bắt Nhịp/Bếp Đông/Lửa Qua Ba Nhịp và hướng dáng tiến/tạp dề đỏ đất/đôi dụng cụ gỗ ngắn. Female adult/high-knot/ivory shirt là elaboration của bộ tham chiếu, không thêm lore/quan hệ/ethnicity hay kế thừa nhân vật legacy. Nhiên aw2-nhien/SR/Bún bò/Striker có full-body portrait riêng,16 world cels bốn hướng,32 HD cels/tám trạng thái,16 FX cells và4 cue âm thanh tổng hợp.64 ô đo thật, edge alpha tối đa6/255 (tolerance8);5 WebPs4,685,032bytes/decoded RGBA31,451,712bytes. Source PNG giữ nguyên byte, lossless visible RGBA+alpha; chỉ đo rectangle/foot anchor/logical scale A1.3/B1.8364, không repaint/mask/mirror/resize.17 tệp scoped build lại byte-identical.

| State | Starts(ms) | Duration/loop | Remaining art acceptance |
|---|---|---|---|
| idle |0,300,600,900 |1200/yes | face/hair/breath/cloth/loop |
| move |0,170,340,510 |680/yes | alternating feet/contact/sliding/tools |
| attack |0,220,440,700 |1000/no | two contacts then ready recovery |
| cast |0,210,420,740 |1080/no | sweep/hand/tool continuity |
| hit |0,80,180,340 |520/no | recoil/face/anatomy |
| guard |0,180,400,700 |1000/yes | brace/loop, no invulnerability |
| ultimate |0,240,520,800; idle1080 |1320/no | three separate contact poses+idle recovery |
| defeat |0,220,480,760 |1000/no | one knee/final kneel/full tools |

World down/left/right/up separately generated16 cels; reduced holds each first authored pose. Melee basic no projectile;220/440 preview cue, finite180ms accents. Ultimate240/520/800 separate preview cues, finite220ms own accent per cue; not an actual hit, guaranteed future hit or stun-lock. Passive has one manual preview icon; no energy engine. Atlas B was compact recomposed; metadata scaling preserves source pixels and intended kneeling height, not final accepted continuity.

| Gate | Implemented subset | Still open / owner |
|---|---|---|
| Identity/story | Approved immutable identity/recipe/SR/four kit directions | Story/character independent visual continuity |
| Portrait/world/HD | Original portrait/16world/32HD cels | Anatomy/face/hands/tools/cloth/turn/contact/loops/inbetweens |
| FX/audio |16own FX/four synthesized cues; preview distinct contacts/pause/reduced/decode | Actual event binding after007F, human listening/mix/device |
| Actual kit/leveling | Not implemented; art registry separate from six combat kits | Mechanic007F bounded melee/recovery/energy/three real hits/simulations |
| Collection/team | Preview only, no save writes/grants | Explicit unlock/saved-team/migration contract; never implicit extra starter |
| Provenance/rights |7 calls/5 selected/2 unselected, source/reference hashes | Independent legal NOT_RUN/commercial NOT_CLEARED |
| Integration | Source48 (44+4),compiled48,onboarding8 preview/isolation;80 affected units | Actual Nhiên battle/world, performance/native/offline/production-save/release |

80 test/6 file PASS (7 case Nhiên mới),0failed/skipped,890ms. Hai typecheck PASS.104 browser assertions:48 source (44 đã PASS trước lỗi alias của verifier +4 case còn lại PASS sau sửa harness),48 compiled Nhiên và8 compiled onboarding/build consumer.6-path format/Python+MJS syntax/whitespace PASS; review build137files/44 HTML-JS-CSS/46,410,380bytes/source exclusions PASS. 171 đường dẫn byte-identical so với baseline: six-kit core/progression/presentation/audio, save/schema/store, world/economy/mode rules/maps, existing assets/manifests/audio/provenance/helpers và stable entry/config/dependencies. Chỉ registry thêm Nhiên làm ROSTER availability metadata thay đổi; consumer được80 units+8 compiled smoke mới kiểm tra. Giữ full1068/174/24 của007E tại e1f023d391a2fcf14ab07b7a436b3bd0ad7d6cbd trong ranh giới không đổi; không chạy lại/cộng số. Stable build851files/49 HTML-JS-CSS/177,450,422bytes từ007E giữ nguyên, chỉ scan lại exclusion; không gọi đó là build mới. Full regression vẫn cần trước release/shared-core/save change.

7 lần built-in image_gen,5 output chọn,2 output không chọn: portrait đầu được thay bằng bản refine nền trong suốt; B đầu UNSAFE (không có row cut alpha-safe, minimum214/255, top9/255), bản compact recompose pass. Không cắt/xóa pixel để vượt audit. Initial source browser44PASS rồi timeout do alias battle/motion-a cùng URL: verifier ban đầu chờ một ID duy nhất nhưng race có thể trả alias khác. Sửa nhận đúng tập own canonical IDs của URL bị chặn và vẫn yêu cầu canvas rỗng; chỉ chạy4 case source chưa xong, không lặp44PASS. Compiled48PASS từ lần đầu, runtime không đổi. Formatter CLI lần đầu từ chối --write trước mutation; dùng cú pháp mặc định và check đúng bản0.2.0. Không có unit failure hoặc fake HP/hit/win.4 actual captures opened; no full art/listening/physical-device claim. FullCharacterComplete=false. Demo **≈90% (9/10)** và sản phẩm **≈40% (ước lượng35–45%)**, giữ nguyên. Bộ tham chiếu **7/12≈58%**, tăng từ6/12; còn5 bộ Hải/Liên/Mộc/Bách/Vân chưa tạo.5/5 starter motion/160cels +Muối32 +Nhiên32 riêng; **0/12 full DoD**. Tham chiếu mới chưa đóng actual Nhiên kit/leveling/collection hoặc nghiệm thu art/playtest/thiết bị/rights/release. [Evidence](evidence/AW2-004K.md), [next007F](tasks/AW2-007F.md), [REPORT](REPORT.md).
