# AW2-016F — đề xuất nội thất tiệm trà đầu tiên

**PROPOSED, chưa kích hoạt trong game.** BA/story/mechanic/animation/tester/scretary review trong phiên27/10/2026, nền `ec74c99`. Đây là phương án cụ thể để xem xét sau016E, không phải canon/room/schema đã được owner duyệt.

## Trải nghiệm đề xuất

Tại **Hiên tiệm trà** của Làng Giao Ước, người chơi đi tới cửa, E → **Vào tiệm trà**. Bên trong là một phòng nhỏ, có bàn xem đội đồng hành và góc đọc nhật ký/công thức. Đến gần từng điểm rồi tự tương tác. Cửa ra trả người chơi đúng điểm trước hiên, giữ hướng và nhân vật đại diện đã lưu. Không NPC mới, nhiệm vụ/phần thưởng/mua bán/gacha hoặc bếp mới; 6zone/8NPC/4quest/12spirit ban đầu giữ nguyên.

Điểm hiên hiện có trong `settlement-v1.json`: Làng, landmark `tea`, `(300,48)`; tiếp cận đề xuất `(300,80)`. Đây đang là điểm đi bộ/phong cảnh, chưa phải cửa. Không đổi ý nghĩa runtime trước khi scope được chấp thuận. Không đặt Vân hoặc người vắng mặt vào phòng.

| Thành phần đề xuất | ID/điểm | Hành vi |
|---|---|---|
| Phòng con | `aw2-room-village-tea` | Thuộc zone Làng, không thêm zone thứ7 |
| Cửa vào | `aw2-object-village-tea-door`,300/48 | Explicit E/action, không tự kích hoạt khi chạm |
| Điểm vào phòng |64/192, hướng phải | Spawn an toàn sau preflight/commit |
| Cửa ra |24/192 | Explicit action, trả checkpoint ngoài hiên |
| Bàn đồng hành |240/128; tiếp cận240/160 | Mở UI đội hiện hành, chỉ5người sở hữu hợp lệ; đổi đầu đội theo giao dịch cũ |
| Góc ghi chép |432/128; tiếp cận432/160 | Xem journal/công thức hiện có, không đọc hộ hint/nhận quest/nhận quà |

Tọa độ phòng là bản thiết kế kỹ thuật, cần kiểm tra với art/collision trước khi chốt. Canvas cơ sở640×384, giới hạn di chuyển16..624/16..368; một đại diện map/năm combat. World shell/native44px/phân trang/no-scroll; một modal tại mỗi thời điểm. Escape đóng UI trong phòng, không tự thoát phòng hoặc đổi save.

## Hợp đồng lưu và tương thích đề xuất

Cần schema6 thay vì giả lập `zoneId` hoặc lưu phòng trong một key không được kiểm soát. Phương án:

- Giữ `progress.zoneId/x/y/facing` là checkpoint ngoài hiên. Thêm `progress.interior: null | { roomId, x, y, facing }`; trong phòng chỉ tọa độ interior thay đổi. Scene resolver dùng context này thống nhất cho renderer/input/proximity/path/quest UI. Không trộn tọa độ trong/ngoài.
- Migration5→6 chỉ thêm `interior:null`; giữ nguyên saveId/revision/timestamps/collection/đội/inventory/XP/receipts/quest/boss/ending. Load là read-only, không setItem; chỉ ghi envelope6 khi một hành động lưu có chủ đích đã qua expected-raw/Web Lock. Không backfill phần thưởng hoặc reset.
- Giữ chuỗi migration2/3/4 hiện có rồi nâng6; kiểm tra mọi fixture lịch sử. Client cũ gặp6 phải báo unsupported và giữ nguyên raw, không cố ghi đè.
- Entry là action riêng: bắt buộc ngoài phòng, đúng zone/cửa, trong48px và checkpoint hợp lệ. Generic save-position không được tạo/chọn room/đổi checkpoint ngoài hiên. Trong phòng generic save chỉ đổi tọa độ/hướng hợp lệ của cùng room; không đổi roomId/zone/quest.
- Exit là action riêng, bắt buộc gần cửa trong phòng; clear interior và khôi phục checkpoint ngoài. Không nhận quest/đồ/XP qua enter/exit, refresh hoặc double-click.
- Ưu tiên future-version/corrupt raw/conflict protection trước migration. Không xóa key/save hoặc tự sửa dữ liệu không đọc được.

## Chuyển cảnh và hình ảnh đề xuất

Dùng016D: giữ nguồn → tải ảnh đúng context → dựng candidate/khung đầu → kiểm tra lại renderer trong khóa ghi → commit → promote cùng canvas. Hủy/timeout/lỗi ảnh/lỗi vẽ/lỗi ghi/tab cũ không đổi nguồn/raw. GPU lỗi sau commit dùng lỗi bản đồ/Đọc lại. Cảnh nguồn và candidate tối đa2context; chưa cam kết bộ nhớ/FPS điện thoại.

Vẽ nội thất nguyên bản dựa palette/kiến trúc dự án: nền sàn, bàn đồng hành, góc ghi chép, foreground mái/bàn mờ khi che người; ánh sáng ấm, không chữ đóng trong ảnh. Một floor và một prop atlas, mục tiêu runtime cộng≤4MB/decoded≤24MB, tổng preload đúng phòng; ngân sách là đề xuất cần đo, chưa có asset hay quyền phát hành mới. Không dùng ảnh nguồn/portrait làm world model hoặc copy tài nguyên game khác.

## Điều kiện triển khai và kiểm chứng

Chốt scope phòng/ID/entry/đọc-ghi6 trước khi sửa runtime. Sau đó triển khai scene resolver và migrations trước art/UI; không đưa room vào menu khi chưa có đủ gates.

Đơn vị: toàn bộ migration versions/byte preservation/no duplicate rewards; entry/exit/proximity/room-boundary/path fixtures; generic save cannot teleport/change room; stale lock/failed write/cancel/unmount/late lease/firstframe; own5party/oneleader. Full regression cần chạy vì đổi save/shared world context.

Trình duyệt source+compiled: hành trình mới thật và schema5cũ, từ hiên vào–tương tác–reload–ra, đổi leader/cancel/failed write, hai tab ở khác context, chuyển mode và quay lại đúng phòng, asset/render faults,4viewport20px/44px/focus/Tab/Escape/no-scroll/no-input-leak, legacy sentinels. Không tự nâng demo/product hoặc đóng D18/D20/human/phone/rights/release.

**Kết quả của tài liệu này:** phương án truy cập và migration đã cụ thể để review; chưa có phòng mới, schema6 hoặc asset mới trong code.016E hoàn thiện điểm kiểm nguyên liệu của Phòng Kho hiện hành và độc lập với đề xuất này.
