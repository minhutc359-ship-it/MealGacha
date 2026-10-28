# Soul of Meal AW2 — cập nhật 28/10/2026

**AW2-017A VERIFIED development — Làng chuyển sang công trình có chức năng.** Ba facade Nhà đồng hành/Tiệm trà/Hội quán đều có cửa và nội thất riêng; bảy nhà trang trí dư đã bỏ khỏi bản render Làng. Lối đi ghép tách lớp và camera gần hơn; nhấn mái đi tới cửa thật. Nhà mở đội/sổ, hội quán mở hai bàn TCG/Chess thật; ra/về giữ đúng phòng và checkpoint. Save7 đọc1–6 không ghi đè, nâng cấp khi lưu rõ ràng. [Bố cục và lộ trình](MAP_TUONG_TAC.md).

**1.925unit/142files PASS** toàn bộ, gồm11ca mới; **414browser mới=118khu mẫu+296toàn tuyến**, source+compiled đều đạt/0lỗi bất ngờ. Ba phòng/quota–retry/bấm lặp/reload/đúng cửa, save6no-write, bốnviewport20px/44px; toàn tuyến4quest/boss45tick/kết thúc300XP đạt. Hai typecheck/hai build/262asset parity đạt;516file gốc được guard. [Bằng chứng](evidence/AW2-017A.md).

**Demo90% / product≈40%(35–45%) giữ nguyên.** D24ưu tiên cấu trúc map trước lịchNPC;6zone/8NPC/4quest và D17giữ nguyên. Đây là khu mẫu Làng, chưa hoàn thiện toàn bộ map:22facade Phố/Sân còn xử lý, step portal/đồ vật ngoài trời/nội thất art riêng/vườn-biên-collision cuối chưa xong. Next017B: Phố Đèn Lồng theo cùng cấu trúc công năng và dẫn đường biết phòng. D18/D20/D11không đổi. Các bản ghi dưới là lịch sử; hiện hành theo017A.

016K source `c62500841351e6e8b68089ce89fca5f6641b74c2` / exact staged+independently fetched tree `ee8dc038bfe3fc1bab6470fec2c4da04ef6d4a28` published on AW2; all31changed blobs/expected-head/non-force/direct-parent/ancestry/index and clean tracked local sync PASS. [Publication proof](evidence/AW2-016K-publication.json). This stamp is documentation/evidence only.

Đã hoàn tất016K: **tiệm trà có bàn luyện tập TCG/Auto Chess** tại Góc nhật ký. Chọn tab và đọc không ghi save; Ghé bàn kiểm tra đúng phòng/khoảng cách, lưu điểm trở về một lần. Lưu lỗi giữ menu để thử lại; tab cũ cần Đọc lại. Quay về/ra hiên giữ đúng vị trí. [Cách dùng](BAN_LUYEN_TAP.md).

**Kiểm tra mới:**142unit/6files (13mới nằm trong tổng),156browser=78source+78compiled,0lỗi bất ngờ. Cả hai đi từ nhập môn mới tới tiệm trà, chơi TCG tới kết quả thật, xếp quân/đánh một vòng Chess và sang vòng2; quay về/reload/classic/quota–retry/bấm lặp/tabcũ đều đạt. Selector/desk qua bốnviewport/chữ20px/44px/no-scroll/focus. Hai typecheck/hai build/262asset parity đạt;529file gốc không đổi. [Bằng chứng](evidence/AW2-016K.md).

**Demo90% / toàn sản phẩm≈40%(35–45%) — không đổi.** Đây là dịch vụ trong tiệm trà hiện có, chưa tạo hội quán mới hay đổi schema6/canon/art/economy. D18/D20/D11 giữ nguyên; điện thoại thật/playtest độc lập/FPS/rights còn mở. Không cộng số kiểm thử lịch sử vào lượt mới. Next BA/story/mechanic: contract lịch sinh hoạt NPC theo game clock, không khóa nhiệm vụ theo giờ thật.

Base `01480f61c706c8ead346499f39666648487ecf8b`,431inputs `7199f1883206ae806f2db0f9dc0f94906ef507c60b0ada67470feb53cc9f60bd`. D16commit/push AW2 và đối chiếu fetch độc lập trước báo thành công; không master/rpg/deploy/release/reset.

[Trạng thái](STATUS.md) · [Công việc](BACKLOG.md) · [Bàn giao](HANDOFF.md) · [Kiểm thử](TEST_LEDGER.md) · [Phần trăm](PROGRESS.md)
