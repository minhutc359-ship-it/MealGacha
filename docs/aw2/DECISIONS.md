# AW2 Decision Register
| ID | Status | Decision |
|---|---|---|
| D01 | LOCKED | RPG mới trên nhánh riêng, khả năng tách repo/game riêng; master giữ ổn định |
| D02 | LOCKED | Free roam các map kết nối, không monolithic world |
| D03 | LOCKED | 5 Vị Linh auto attack/cast, player timed ultimate |
| D04 | LOCKED | Pixel/chibi map, HD anime battle, authored FX |
| D05 | LOCKED | TCG/Auto Chess tích hợp + direct quick access |
| D06 | LOCKED | 10–20 starter, thực hiện 12 full-quality đầu tiên |
| D07 | LOCKED | Gacha N-R-SR-SSR-UR; khác legacy 4 tier |
| D08 | LOCKED | Cho reset AW2 development save trước release; từ release dùng migrations |
| D09 | LOCKED | Lore/tên/công thức/hoạt họa có thể viết lại; tránh sao chép IP khác |
| D10 | APPROVED 2026-10-20 | Owner duyệt 12 identity/tên/món/tier/role và hướng kit tại AW2-003; phân phối 3N,3R,3SR,2SSR,1UR; spiritId từ đây immutable |
| D11 | PROPOSED | Rarity rates/pity do mechanic simulate rồi owner approve |
| D12 | OPEN (partial) | Final tên game mới, monetization, runtime platform; initial roster 12 đã chốt theo D10, mở rộng sau gate |
| D13 | APPROVED 2026-10-20 | Đội khởi đầu 5 N/R: Than, Lửa Nhỏ, Lam Lam, Mộc Non, Sương Lành; nhận trực tiếp qua nhập môn trước trận bắt buộc, không cần quay gacha |
| D14 | APPROVED 2026-10-20 | Hướng story/map/quest AW2-002: 6 zone, 8 NPC, 4 quest, puzzle thử lại không tiêu tài nguyên, boss ký ức; không xác nhận Vân là người vắng mặt |
| D15 | APPROVED 2026-10-20 | Hướng bốn slot kit/nhân vật và visual direction tại AW2-003; chưa phải stats/leveling, assets hoàn tất hoặc license approval |
| D16 | APPROVED 2026-10-21 | Owner yêu cầu tiếp tục AW2 trực tiếp trên game/adventure-world-2, không tạo branch mới; mỗi task hoàn thành phải kiểm tra/cập nhật doc/commit/push ngay vào nhánh đó và xác minh remote. Thay thế quy trình feature branch cũ; dọn các branch thừa đã tích hợp theo AW2-012B, giữ lịch sử chưa tích hợp và PR đang mở. |
| D17 | APPROVED 2026-10-23 | Khi khám phá map, chỉ nhân vật đầu đội đã lưu làm đại diện; bỏ đoàn nhân vật đi theo. Đội lưu và chiến đấu vẫn đủ5người. Thay thế phần hiển thị followers trước đây, không đổi D03/D13/canon/luật/save. |
| D18 | APPROVED 2026-10-24 | Mục tiêu cho PR tích hợp AW2 kế tiếp là demo100% và sản phẩm45%. Giữ số hiện tại90%/40% cho đến khi có bằng chứng: playtest độc lập toàn hành trình + đóng blocker, tuyến world/UX được nghiệm thu và baseline desktop + ít nhất một điện thoại thật. Phát triển task vẫn trực tiếp trên `game/adventure-world-2` theo D16; PR milestone chỉ mở sau khi đủ gate, dự kiến tích hợp vào `rpg`, không đụng `master`/deploy/release. |
| D19 | APPROVED 2026-10-24 | Owner yêu cầu gộp PR #82 vào `game/adventure-world-2` và xác nhận `rpg` là nhánh product về sau. AW2 tiếp tục phát triển/tích hợp theo D16, incoming PR82 được phép đổi đích vào AW2 và merge sau audit. Outgoing AW2→rpg vẫn theo D18; không tự cập nhật product/master/deploy/release. |
| D20 | APPROVED 2026-10-24 | Owner yêu cầu bỏ qua phần nghiệm thu để tiếp tục hoàn thiện. Ưu tiên triển khai tính năng/art tiếp theo; gác010C/011A khỏi công việc hiện tại, không lấy chúng làm điều kiện để bắt đầu task phát triển. Bằng chứng chưa chạy vẫn NOT_RUN; không tự đánh dấu PASS hoặc đủ milestone/deploy/release. Kiểm tra kỹ thuật theo tác động thay đổi và D16commitpush vẫn thực hiện. |
| D21 | APPROVED 2026-10-24 | Owner yêu cầu kết hợp hình Làng Linh Vị ở mainline để đồng bộ phong cách và có map khám phá nhiều lớp, phong cảnh có chiều sâu.006Iưu tiên trước006H: lấy ảnh gốc dự án tại nhánh mặc địnhmaster làm tham chiếu, nâng cảnh làng/camera rồi áp dụng cùng hướng cho vùng tiếp theo. Không đổi tên/canon/luật/save hoặc cho phép merge/cập nhậtmaster; không tự đóng full-environment/rights/nghiệm thu. |
| D22 | APPROVED 2026-10-24 | Owner yêu cầu thêm nhiều nhà/tiệm/cửa hàng/khu vui chơi vì khung nhìn còn trống.006Oưu tiên trước006N: đưa cụm kiến trúc sát tuyến khám phá và điều chỉnh góc bám để thấy khu dân cư; gắn quầy với NPC/tương tác có sẵn. Giữ6zone/8NPC/canon/save/collision, không suy thành duyệt commerce/room mới, quyền phát hành hoặc milestone. |
| D23 | LOCKED 2026-10-26 | Core gameplay targets one fixed viewport, map HUD/dock, single blocking submenu, quest/party/inventory pages, no document scrolling; battle/TCG/Chess target in-shell safe return. Imported concurrent UI row mislabeledD13 is normalized here, preserving original starterD13. Implementation phases/evidence at015A/B; design approval is not runtime completion. |

Mọi thay đổi quyết định LOCKED cần owner xác nhận và scretary ghi lại.

Approval evidence: owner replied **“Duyệt cả hai bản đề xuất”** to the explicit review request for AW2-002 story/map/quest and AW2-003 12 identities/tier/kit/N/R starter. Request explicitly excluded gacha rates/pity: D11 remains PROPOSED. D12 roster component is resolved for the initial 12 by D10; title/monetization/runtime platform remain OPEN. Proposal documents preserve their original review labels as historical artifacts; D10/D13/D14/D15 and CANON supersede those labels. No approval of asset completion, device QA, release or merge is implied.

D17 evidence: owner requests **“Khi di chuyển trong map, chỉ cần 1 nhân vật đầu team đại diện là được”**. AW2-006E applies the first committed slot, preserving draft/cancel/failed-write semantics and all five combat members. Before intro, the existing Than fallback is visual only and grants no ownership. Historical follower implementation/test records retain their original refs; current behavior follows D17.

D18 evidence: owner requests **“mục tiêu trong pr tiếp theo này là 100% demo, 45% product”**. [AW2-014A](tasks/AW2-014A.md) defines measurable gates and prevents the target from being reported as current progress before independent evidence exists.

D19 evidence: owner requests **“kết hợp merge code từ pr 82 vào game/adventure-world-2 luôn được không? sau này nhánh rpg sẽ là nhánh product”**. [AW2-013B](tasks/AW2-013B.md) records original-source ancestry and current-feature preservation;013Aprevious no-PR-change scope does not block this newly explicit authorization.

D20 evidence: owner requests **“bỏ qua phần nghiệm thu, tiếp tục hoàn thiện giúp tôi”**. [AW2-006G](tasks/AW2-006G.md) continues product work on the opening village. This reprioritizes development immediately; no independent/device result is invented and no outgoing PR/deployment was requested.

D21 evidence: owner requests **“Kết hợp với hình ảnh Làng Linh Vị ở nhánh main để đồng bộ phong cách đồ họa, phong cảnh, map khám phá có chiều sâu, chứ không chỉ 1-2 nhân vật + items lẻ tẻ.”** Default branch audit foundmaster/no main; two pinned original project images guide006Iart, with canon unchanged. [Contract](tasks/AW2-006I.md).

D22 evidence: owner requests **“thêm nhiều nhà/tiệm/cửa hàng/khu vui chơi/... vì chỉ có mỗi npc thì khung ảnh hơi trống, sau đó tiếp tục hoàn thiện game”**. [AW2-006O](tasks/AW2-006O.md) adds a denser architectural layer and walk-only neighborhood landmarks, preserves current services/geometry and keeps006Nambient next.


D23 provenance: concurrent design commits73ef962/cfb2923/2b5b011/601fed3recorded owner single-screen UI request, then owner explicitly requested integratingv1.1. [Exact source](design/world-v1.1/SOUL_OF_MEAL_AW2_MAP_NPC_WORLD_SPEC_v1.1.md), [reconciliation](WORLD_V1_1_INTEGRATION.md). D17one map representative/D14current canon/D11PROPOSED/D16/D18/D20remain authoritative.
