# Phần trăm hoàn thiện AW2

2026-10-21 · BA/scretary · Owner yêu cầu ước lượng theo %. Đây là chỉ báo lập kế hoạch với phạm vi/cách tính công khai, không phải phê duyệt phát hành hoặc phần trăm công sức đã đo. Bản web chơi đơn là giả định hiện tại; D12 nền tảng/monetization còn mở. [REPORT](REPORT.md) là bản tóm tắt.

## Demo với art tham chiếu

Trước AW2-010A: **8/10 nhóm tiêu chí đã kiểm chứng, khoảng80%**. Hai nhóm còn lại là kiểm tra liên hoàn/hướng dẫn người mới và playtest độc lập. Sau AW2-010A: **9/10 nhóm tiêu chí PASS, khoảng90%**. Nguồn và bản biên dịch đều hoàn tất lượt chơi mới thực tế; nhóm còn lại là playtest độc lập và đóng lỗi dùng thử. [Bằng chứng](evidence/AW2-010A.md).

| Nhóm tiêu chí demo, mỗi nhóm10 điểm | Bằng chứng/trạng thái |
|---|---|
| Nhập môn, nhận trực tiếp5 starter | PASS development,013A/009C |
| Đi lại6 zone, va chạm/đường về | PASS development,013A/009C |
| Ký ức, puzzle,4 quest | PASS development,013A/009C |
| Rương/túi đồ/EXP/nấu/chia bữa | PASS development,013A/009C |
| Boss thật, ghi chép/hai kết thúc | PASS development,013A/009C |
| TCG luyện tập có luật/kết quả thật | PASS009B, regressed009C |
| Auto Chess luyện tập có luật/kết quả thật | PASS009C |
| Save riêng, vào/ra/reload/stale không phá tiến trình | PASS development,009A/B/C |
| Hành trình mới liên hoàn/hướng dẫn/bàn phím trên source+compiled | PASS010A source43/compiled43 kiểm tra liên hoàn;10 điểm |
| Người chơi độc lập thử trải nghiệm và đóng lỗi chặn demo | NOT_RUN; chưa tính điểm |

Đây là tỷ lệ nhóm tiêu chí có trọng số ngang nhau; các nhóm không có cùng số giờ thực hiện. Demo cho phép5 bộ tham chiếu, map/NPC/boss tạm và mode tài nguyên mượn; phạm vi này không thay thế tiêu chí12 nhân vật của sản phẩm. Tự động hóa và ảnh đã mở không phải một người chơi độc lập đã thử.

## Sản phẩm đầy đủ theo phạm vi12 nhân vật

Ước lượng **khoảng40%**, nên đọc như khoảng **35–45%** với độ tin cậy thấp. Trọng số và điểm dưới là đánh giá BA về khối lượng/gate còn lại, chưa được hiệu chỉnh bằng vận tốc nhiều sprint. Số task/test xanh không được dùng làm mẫu số.

| Nhóm công việc | Trọng số | Điểm tạm ghi nhận | Cơ sở |
|---|---:|---:|---|
| Nền runtime/combat/save/tích hợp |25 |20 | Luật thật, checkpoint/progression và hai practice đã chạy; production durability/hoàn thiện còn mở |
| Arc thế giới/quest/dungeon |15 |10 |6 zone/4 quest/boss/hai kết thúc hoạt động; map/NPC/boss riêng và polish còn thiếu |
|12 nhân vật đủ DoD/art/animation/kit |30 |5 |12/12 bộ tham chiếu,10/12 kit thực thi sau007I; **0/12 đạt đầy đủ DoD**, collection và nghiệm thu còn mở |
| UX/presentation/audio |10 |3 | Có điều khiển/touch/opt-in và hướng dẫn; UI/game art còn cần hoàn thiện/playtest |
| Kinh tế/mode sản phẩm/gacha/cân bằng |10 |2 | Kinh tế/practice còn là development tuning; D11 chưa duyệt, gacha runtime/thu thập mode chưa làm |
| Gate phát hành: thiết bị/hiệu năng/offline/save production/rights |10 |0 | Các gate đầy đủ còn NOT_RUN/mở; chưa có phát hành |
| **Tổng** |**100** |**40** | **Ước lượng theo khối lượng, không phải chứng nhận chất lượng** |

Hoàn tất một test mới có thể làm tỷ lệ demo tăng mà điểm sản phẩm giữ nguyên: art/nội dung/gate phát hành vẫn còn phần lớn công việc. Chỉ nâng điểm nhóm khi có artifact và bằng chứng đúng phạm vi; không coi portrait hoặc approved proposal là nhân vật hoàn thành. Xem [CANON](CANON.md), [STATUS](STATUS.md), [TEST_LEDGER](TEST_LEDGER.md).

Theo yêu cầu owner2026-10-21, scretary báo hai chỉ báo sau **mỗi mốc cập nhật hoàn tất**, kể cả khi giữ nguyên; giữ mốc gốc/cách tính và ghi lý do điều chỉnh. Sau nhân vật đầu tiên đủ DoD và playtest demo, BA/tester điều chỉnh trọng số/ước lượng thời gian trong [DELIVERY_PLAN](DELIVERY_PLAN.md); không suy ra ngày hẹn từ40% hoặc90%.


## AW2-004C measurement update

Than có thêm32 khung chuyển động/tám trạng thái, đã kiểm chứng source+compiled và boss thật; [bằng chứng](evidence/AW2-004C.md), [gate từng phần](THAN_CHARACTER_GATES.md). Bốn lần gọi image_gen tạo hai bản đầu bị loại vì khoảng cách ô và hai bản sửa được chọn. Đây là số đo của một gói motion, chưa phải thời gian hoàn thiện/kiểm duyệt một nhân vật. Art độc lập, cân bằng/cấp độ cuối, nghe âm thanh, thiết bị/quyền sử dụng còn mở. **0/12 full DoD, demo≈90% và sản phẩm≈40% giữ nguyên**; không tự cộng điểm chỉ vì tăng số khung/test. Tiếp theo004D Lửa Nhỏ; chưa có dữ liệu vận tốc để siết lịch12 nhân vật.


AW2-004D: Lửa Nhỏ thêm32 cels/tám trạng thái, hai hit/FX đúng sự kiện thật và builder tái tạo ổn định; [bằng chứng](evidence/AW2-004D.md), [gate còn lại](LUA_CHARACTER_GATES.md). Ba lần image_gen tạo hai sheet được chọn, một bản B bị loại và sửa bố cục. Than+Lửa Nhỏ có64 cels mới nhưng vẫn là hai gói tham chiếu, chưa phải hai nhân vật qua full DoD. Giữ **demo≈90%, sản phẩm≈40%,0/12 full DoD**; không suy điểm hay vận tốc12 nhân vật từ số khung/test. Tiếp theo004E Lam Lam, các gate độc lập vẫn mở.

## AW2-004E measurement update

Lam Lam có thêm32 cels/tám trạng thái, tác động đạn và hai nhịp heal theo event thật; sửa mất hiệu ứng khi trùng hành động và hết hạn FX trong reduced motion. Nguồn `cf0b394`;1007 test/471 kiểm tra browser cuối PASS, [bằng chứng](evidence/AW2-004E.md), [gate từng phần](LAM_CHARACTER_GATES.md). Bốn lần image_gen/hai layout sửa được chọn;3/5 starter có32 cels mỗi người (96 tổng), hai starter còn key-pose,7 bộ chưa tạo. **Demo≈90% và sản phẩm≈40% giữ nguyên** (35–45% rough range), **0/12 full DoD**: chưa đóng playtest độc lập/nhân vật hoàn chỉnh/thiết bị/rights/release. Motion/test-count không tự tăng điểm nhóm. Sau mỗi cập nhật phải báo cả hai %, lý do thay đổi hoặc giữ nguyên, đồng bộ REPORT/HANDOFF. Next004F Mộc Non; chưa có dữ liệu vận tốc nhân vật được chấp nhận đủ DoD để siết lịch.

## AW2-004F measurement update

Mộc Non thêm32 cels/tám trạng thái và trình diễn hỗ trợ theo event thật, nguồn `1803347`. **Riêng motion5 starter:4/5=80%, tăng từ3/5=60%**, gồm Than/Lửa Nhỏ/Lam Lam/Mộc Non;128 cels tổng, Sương Lành còn key-pose. Hai lần image_gen/hai output đầu được chọn, chưa là nhân vật đủ DoD. [Gate Mộc Non](MOC_NON_CHARACTER_GATES.md), [bằng chứng](evidence/AW2-004F.md).

Theo yêu cầu owner, chỉ chạy62 test chịu ảnh hưởng/88 bước browser mới; full1007/471 và quest/save/mode/stable không đổi giữ bằng chứng004E ở SHA gốc, không chạy lại/cộng số. **Demo≈90% và sản phẩm≈40% (35–45%) giữ nguyên;0/12 full DoD** vì playtest độc lập/nhân vật hoàn chỉnh/thiết bị/rights/release vẫn mở. Metric motion80% dùng mẫu số riêng, không phải80% sản phẩm. Tiếp theo004G Sương Lành; tiếp tục báo hai % dự án sau mỗi cập nhật.

## AW2-004G reference-motion status —2026-10-21

Source `489ce7162df7db11b1b1954d0b0a62b4d073fe17` adds32 Sương Lành cels/eight states and confirmed area-recipient presentation; identity/R/Bánh cuốn/skill directions/rules unchanged. All5 starter reference-motion packages now present:5/5=100%,160 cels; supersedes004F's one remaining key-pose inventory only for Sương. Seven other sets absent, all5 fullCharacterComplete=false/0 of12 full DoD. 69 affected tests/8 files PASS (62 unaffected cases retained from first in-session run; corrected7-case fixture file rerun alone), both typechecks/4-file formatting/syntax/whitespace PASS.113 fresh browser checks:41 source+42 compiled Sương,12 compiled Lam+14 compiled Moc affected renderer only,4 documented local-startup checks. Full current-head suite NOT_RUN. Unchanged full1007 units/471 browser/stable851-file78-text exclusion/earned world-quest-save-mode journeys retain original-SHA PASS at cf0b39469d1fb8f7d77e18feb5e16895d70565a1; not rerun or added to fresh totals.124 byte-identical paths prove unchanged core/save/world/economy/modes/helpers/other assets/stable entry/config/dependencies against base; other manifests and original12 Sương files unchanged. Release/major save/shared-engine work still requires full regression. Demo9/10≈90% and full product≈40% (rough35–45%) unchanged. Starter reference motion5/5=100%, up from4/5=80%,160 new cels total.0/12 full DoD,5 reference sets/7 absent; motion completion uses a separate denominator. Independent playtest/art/anatomy/cloth/loops/contact/readability/audio binding/listening/device/FPS/offline/native/rights/production-save/release gates remain open. Planning ranges/assumptions unchanged; motion/test counts do not measure finished-character velocity. [Sương gates](SUONG_CHARACTER_GATES.md), [evidence](evidence/AW2-004G.md). Next004H arena/readability; independent playtest/audio/device/rights remain open.

## AW2-004H readability update —2026-10-21

Source `aa0a3a645f15035cb72e16650cc2fa77b440237a`: responsive battle lanes/labels/statuses, full roster and readable mobile ultimate controls;43 affected tests/89 compiled browser checks PASS. **Demo≈90% (9/10) and product≈40% (rough35–45%) unchanged**, motion5/5=100%/160 cels/0 of12 full DoD unchanged. Technical readability fixes do not constitute an independent playtest or close art/device/rights/release gates. Vertical scrolling remains a mobile usability tradeoff to review with a player. [Evidence](evidence/AW2-004H.md), [REPORT](REPORT.md). Next BA/tester independent playtest/observed blockers; animation/character retain full-art work.

## AW2-007D boss development kit —2026-10-22

Source `910b55bf977557f11be03111afa40283df0fbcf1` adds actual three-part boss mechanics and authoritative readable warnings;1036 full units/95 fresh compiled browser assertions/9 simulations PASS. This improves the already counted boss/journey group. **Demo≈90% (9/10), product≈40% (rough35–45%) unchanged**;5/5 starter reference motion/160 cels,0/12 full DoD/7 absent sets unchanged. Owner reports having played and seen no blocker; version/device/full quest/ending coverage is unknown, so record partial player smoke without awarding the final10 points. Full independent playtest gate remains NOT_RUN until its coverage/feedback are recorded. Own boss art/signature presentation, full-character/device/rights/release gates remain open. [Evidence](evidence/AW2-007D.md), [next004I](tasks/AW2-004I.md).

## AW2-010B demo → product —2026-10-22

Source `b836a82f3cb8babf1087e6ac32603de1f83336de` supplies a clear saved-ending summary/play-again routes;55 compiled earned checks PASS. Owner2026-10-22 confirms TCG/Auto Chess tried, full journey not finished. Record partial human mode smoke; end-to-end player acceptance remains NOT_RUN, not inferred from the request to move to product. **Demo9/10≈90%, product≈40% (rough35–45%) unchanged**. Completion UI does not close human full-route/art/character/release gates. Product development now starts004I while acceptance remains open. [Worklist](PRODUCT_PLAN.md), [evidence](evidence/AW2-010B.md).

## AW2-004I product development starts —2026-10-22

Owner requests demo then product;010B closes technical completion UI and004I at `26849546825131a5c448645274880977caa9d230` delivers original boss reference art/actual FX. Demo9/10≈90%, product≈40% (rough35–45%) unchanged: this is one reference-presentation deliverable, not a closed independent-playtest/full-character/release gate.5/5 starter motion/160 cels,0/12 full DoD/7 absent spirit sets remain. Boss is not one of12 collectible spirits; no increase in0/12 full DoD. Owner tried TCG/Auto Chess but not the ending; do not call demo100% or reset the denominator. Next004J addresses first missing Muối Đen set; product priorities [PRODUCT_PLAN](PRODUCT_PLAN.md), [actual boss gates](BOSS_CHARACTER_GATES.md).

## AW2-004J reference asset update —2026-10-22

Source `7643ec4cb4e1e56d0c1013f7135a065e5ad3af36` adds Muối Đen original64-cell package/portrait/four cues/reference preview, preserving aw2-muoi/R/Muối rang/four approved skill directions. This supersedes004I's seven-absent inventory only for Muối: six references/six absent, with separate roster registry and five-starter save/team unchanged. Demo9/10≈90% and full product≈40% (rough35–45%) unchanged. Authored spirit reference sets6/12=50% (was5/12), six absent; starter motion5/5=100%/160 cels unchanged; Muối adds32 cels separately.0/12 full DoD. One reference package does not close actual kit/leveling/collection/independent art/audio/device/rights/release gates or supply accepted-character production velocity. No actual Muối kit/leveling/collection or approved balance claim; next007E. Existing planning ranges/assumptions unchanged until accepted full-character/playtest/device evidence. [Gates](MUOI_CHARACTER_GATES.md), [evidence](evidence/AW2-004J.md).

## AW2-007E actual development kit —2026-10-22

Source `e1f023d391a2fcf14ab07b7a436b3bd0ad7d6cbd` delivers Muối bounded actual kit/level1–20/isolated practice and confirmed FX/audio. This supersedes004J's kit/leveling/event-binding pending status only; ownership/collection remains pending. Six explicit actual combat identities now exist (five starters+Muối), same five-starter world/save contract. Demo **≈90% (9/10)**, sản phẩm **≈40% (ước lượng35–45%)**, giữ nguyên. Sáu bộ tham chiếu/12 (50%), sáu bộ còn thiếu;5/5 starter motion/160 cels, Muối32 cels riêng; **0/12 full DoD**. Kit phát triển mới chưa đóng thu thập nhân vật, cân bằng cuối, art/playtest độc lập hoặc gate phát hành. Planning ranges remain unchanged; actual development-kit/test counts do not measure accepted full-character velocity. Muối collection/đội lưu trong hành trình chưa triển khai; chỉ số/cap là development tuning. Art/continuity/readability độc lập, human listening/mix, thiết bị thật/FPS/offline/native, rights/production-save/release còn mở. Owner đã thử TCG/Auto Chess nhưng chưa hoàn tất hành trình; end-to-end player acceptance NOT_RUN. D11 tỷ lệ/pity PROPOSED, D12 OPEN. [Evidence](evidence/AW2-007E.md), [gates](MUOI_CHARACTER_GATES.md), [next004K](tasks/AW2-004K.md).

## AW2-004K reference inventory update —2026-10-22

Source`22877ba16e52d70d5447a5870452e3acebe114af` adds Nhiên original64-cell/portrait/four-cue reference, preserving aw2-nhien/SR/Bún bò/four skill directions. This supersedes007E six-reference inventory for Nhiên only:7sets/5absent, still six actual combat identities and five-starter world/save. No actual Nhiên kit/leveling/collection or owner final-balance/art/license approval. Demo **≈90% (9/10)** và sản phẩm **≈40% (ước lượng35–45%)**, giữ nguyên. Bộ tham chiếu **7/12≈58%**, tăng từ6/12; còn5 bộ Hải/Liên/Mộc/Bách/Vân chưa tạo.5/5 starter motion/160cels +Muối32 +Nhiên32 riêng; **0/12 full DoD**. Tham chiếu mới chưa đóng actual Nhiên kit/leveling/collection hoặc nghiệm thu art/playtest/thiết bị/rights/release. ETA ranges remain conditional, not shortened from cels/tests. [Gates](NHIEN_CHARACTER_GATES.md), [evidence](evidence/AW2-004K.md), [next007F](tasks/AW2-007F.md).

## AW2-007F actual Nhiên development kit —2026-10-22

Source `5ca3964a2cb46b60188d3192e32a2545740cda14` supersedes004K's Nhiên combat/leveling/event-binding pending status only. Seventh explicit actual combat identity, own two-contact basic/frontal sweep/three-contact ultimate, finite recovery/interruption and capped distinct-target energy; practice max5, same original five-starter world/save. No collection, final balance, identity/story/rarity, D11 or D12 approval.1107 full units/205 browser/36 simulations PASS; art/deep save/mode-detail evidence remains source-bound within171 unchanged paths. Demo **≈90% (9/10)** và sản phẩm **≈40% (ước lượng35–45%)**, giữ nguyên: thêm kit phát triển chưa đóng playtest độc lập/full-character/release. **7/12 bộ tham chiếu≈58%, 0/12 full DoD**; còn Hải/Liên/Mộc/Bách/Vân. Thu thập/đội lưu Muối và Nhiên, art/listening/thiết bị/FPS/offline/native/rights/production-save/release còn mở. D11 PROPOSED, D12 OPEN. Next[004L Hải reference](tasks/AW2-004L.md). [Evidence](evidence/AW2-007F.md), [practice](NHIEN_PRACTICE.md).

## AW2-004M–P current reference inventory —2026-10-23

**AW2-004M–P VERIFIED: đủ 12/12 bộ hình tham chiếu (100%)** — source `8344fc0b05275a1d8e314100fcfa3263d9956c8e`, base `e0d6bb52584e84d047e0536d7c4525df0a64125e`. Liên/Mộc/Bách/Vân mỗi bộ có portrait,16 world cels/bốn hướng,32 HD cels/tám trạng thái,16 FX cels và bốn cue âm thanh riêng; registry12, không còn bộ thiếu.105 focused cases/7files và full1132 cases/108files PASS (hai tập chồng nhau);390 browser assertions=382 source+compiled references+8 compiled onboarding; cả hai typecheck, review build, hash/alpha/PCM/rebuild PASS.7 actual combat identities/five-starter world/save giữ nguyên;0/12 full-character DoD. Demo≈90% và sản phẩm≈40% (35–45%) giữ nguyên; hoàn tất tài nguyên tham chiếu chưa đóng nghiệm thu art/playtest/listening/device/rights/release. [Danh mục12 bộ](ROSTER_ART.md), [bằng chứng](evidence/AW2-004M-P.md).

## AW2-007G actual Hải development kit —2026-10-23

**AW2-007G VERIFIED — Hải đã có bộ kỹ năng chiến đấu thật và cấp1–20**. Source `3154df089761afc11552c66668f8890640a1d914`, base `92922b33167b81b84b7b382fd6b21a8375347a35`. Tám identity combat, đội starter lưu vẫn5; bộ hình12/12, full-characterDoD0/12. Giữ Lối là vùng chậm cố định; Biết Đường Về cấp khiên có cooldown; Bờ Đợi chắn theo hướng với sức chắn/thời hạn hữu hạn và counterplay đánh vòng.1164 ca unit riêng biệt được xác minh (1132 PASS giữ lại từ full run +32 ca file đã sửa),237 browser assertions và48 simulations PASS; cả hai typecheck/review+stable builds/isolation PASS. Demo≈90% và sản phẩm≈40% (35–45%) giữ nguyên vì chưa đóng collection, art/playtest/device/rights/release. [Luyện Hải](HAI_PRACTICE.md), [bằng chứng](evidence/AW2-007G.md).

This supersedes earlier seven-actual-kit/Hải combat-pending status only. Existing conditional planning ranges and accepted-character velocity assumptions remain unchanged. Next007H actual Liên; no new collection/gacha/rarity/story/production approval.

## AW2-007H actual Liên development kit —2026-10-23

**AW2-007H VERIFIED — Liên đã có kỹ năng hồi phục thật và cấp1–20**. Source `5247fd0963f261f156f00d673b0961657182b4af`, base `b4d8d90d9ed6efb0be686bb4e49479cdcf51efab`. Hẹn Sau Cơn Mệt hồi ba nhịp hữu hạn; Mở Lời tẩy đúng một debuff được phép rồi hồi hai nhịp; nội tại cấp kháng một lần ngắt khi thực sự hồi HP cho người còn debuff.1201full unit tests/110files (37new Liên),278browser assertions,60simulations, cả hai typecheck/review+stable builds/isolation PASS.9actual kits/12bộ hình/5starter lưu/0full-characterDoD. Demo≈90% và sản phẩm≈40% (35–45%) giữ nguyên; collection/art/playtest/device/rights/release còn mở. [Luyện Liên](LIEN_PRACTICE.md), [bằng chứng](evidence/AW2-007H.md).

This supersedes earlier eight-actual-kit/Liên combat-pending status only. Existing conditional planning ranges and accepted-character velocity assumptions unchanged. Next007I Mộc; no new collection/gacha/rarity/story/production approval.


## AW2-007I — current measurement

**AW2-007I VERIFIED — Mộc có bộ kỹ năng chiến đấu thật và cấp1–20**. Source `9b9c365a5dd4c01176bef59772967d64522685b0`, base `c38a5cc6d0ac0731904cc65ea1f582be24a4ef7a`. Gieo Dấu là một vùng cố định chờ3nhịp/kích hoạt một lần/hết hạn6nhịp; Mùa Nối Mùa cấp khiên ngắn khi thay dấu ở vị trí mới; Mở Gói Mùa Xanh thu tối đa một dấu và báo trước2nhịp rồi nổ một lần. **10/12 kit thực thi≈83%** (từ9/12=75%); **12/12 bộ hình tham chiếu100%**, năm starter lưu giữ nguyên, **0/12 full-characterDoD**. **Demo≈90% và toàn sản phẩm≈40% (ước lượng35–45%) giữ nguyên**: chưa đóng collection, nghiệm thu art/playtest độc lập/thiết bị/rights/release.1242ca unit riêng biệt/111files được xác minh (1241PASS từ full run +69ca hai file sửa kiểm tra inventory, không cộng trùng),41ca Mộc mới;310browser assertions và72simulations PASS. Hai typecheck/review+stable build/isolation PASS. [Luyện Mộc](MOC_PRACTICE.md), [bằng chứng](evidence/AW2-007I.md). Next BA/mechanic:007J Bách, sau đó Vân; collection/đội lưu riêng.
