# Từ demo sang sản phẩm AW2

2026-10-22 · BA/scretary · Owner yêu cầu hoàn thiện demo và chuyển sang product. Phạm vi sản phẩm vẫn theo D10/D13/D14/D15:12 nhân vật đủ DoD, thế giới nối liền, đội5 auto/ultimate thủ công, TCG/Auto Chess. Không suy ra quyền phát hành/deploy/merge master hoặc duyệt D11 từ yêu cầu này.

Demo kỹ thuật có luồng mới từ save trống qua4 quest, hai mode, kinh tế, boss, ghi chép và hai kết thúc.010B bổ sung màn tổng kết đọc từ kết thúc đã lưu và hành động chơi tiếp. Owner xác nhận đã thử TCG/Auto Chess nhưng chưa kết thúc hành trình; trải nghiệm đến cuối cần ghi nhận thêm. Giữ9/10≈90% theo PROGRESS; bắt đầu phát triển sản phẩm trong lúc gate playtest này còn mở, không đổi mẫu số để gọi demo100%.

| Ưu tiên | Deliverable cụ thể | Điều kiện hoàn tất |
|---|---|---|
|1 · AW2-004I VERIFIED reference at2684954 | Boss có8 tư thế HD và hiệu ứng3 chiêu riêng, thay hình Than mượn | Nguồn/provenance/manifest đo thật; actual-event binding/không tự gây damage; pause/reduced/terminal/mobile/source+compiled PASS |
|2 · AW2-004J VERIFIED at7643ec4cb4e1e56d0c1013f7135a065e5ad3af36, next007E | Muối Đen: bộ tham chiếu64 ô đã có, kit thật tiếp theo | Giữ aw2-muoi/R/Muối rang và kit đã duyệt; task card riêng cho rules,4-way world/eight-state HD/portrait/FX/audio/leveling/QA; không chỉ portrait |
|3 · các owner | Lần lượt Nhiên/Hải/Liên/Mộc/Bách/Vân và hoàn thiện5 starter |12 ledger full DoD có chứng cứ; không biến số cel thành tỷ lệ nhân vật hoàn chỉnh |
|4 · story/animation/mechanic | Art map/NPC/dungeon riêng và đọc đường/counter rõ | Giữ6 zone/8 NPC/4 quest đã duyệt; nghiệm thu điều hướng/persistence/đường về/thiết bị |
|5 · mechanic/BA | Collection/team/mode tiến triển và kinh tế sản phẩm | Có yêu cầu rõ, migrations an toàn, chống double grant; runtime gacha phải chờ owner duyệt D11; practice hiện tại vẫn không tiêu/thưởng RPG |
|6 · tester/BA | Durability/performance/offline/thiết bị/quyền sử dụng/phát hành | Full regression, versioned production saves, quyền sử dụng được xét; nền tảng/title/monetization theo D12; release riêng cần owner yêu cầu |

Mỗi task làm trực tiếp trên game/adventure-world-2, kiểm tra phần chịu ảnh hưởng và tái sử dụng PASS của phần không đổi, cập nhật docs/commit/push/readback. Shared-core/save thay đổi cần full regression theo WORKFLOW. Không tự chạy nhiều agent nền. Các hàng chưa có card là worklist ưu tiên, chưa phải artifact hoặc passing test.

Sản phẩm≈40% (ước lượng35–45%),0/12 full DoD; chỉ tăng khi deliverable/gate tương ứng thật sự đóng. Demo9/10 và mẫu số sản phẩm tách biệt. [Tiến độ](PROGRESS.md), [board](BACKLOG.md), [demo](DEMO.md), [hướng dẫn local](LOCAL_TEST.md), [boss](BOSS_PRACTICE.md).

Mốc product đầu tiên004I đã giao bộ boss tham chiếu riêng, chưa đóng fullEnemy/character gates. 004J Muối Đen đã giao bộ tham chiếu riêng; tiếp tục[007E](tasks/AW2-007E.md), kit thật phải kiểm chứng riêng trước actual combat; không mở gacha hoặc sửa starter-save contract trong asset task. [Bằng chứng](evidence/AW2-004I.md).

Current004J source `7643ec4cb4e1e56d0c1013f7135a065e5ad3af36`:73 affected units/106 fresh browser/type/build/isolation PASS;6 spirit references/6 absent,0/12 full DoD. Demo90%/product≈40% unchanged. Muối art availability is not collection or actual kit; unchanged full1036/earned55/boss evidence retains original refs. [Evidence](evidence/AW2-004J.md), [gates](MUOI_CHARACTER_GATES.md).
