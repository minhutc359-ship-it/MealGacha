# Chơi thử hành trình AW2

Phạm vi: web demo với5 Vị Linh và art tham chiếu. Đây là bản phát triển riêng;12 nhân vật hoàn chỉnh và gate phát hành vẫn còn mở. [Cài và chạy local từng bước](LOCAL_TEST.md) · [Báo cáo](REPORT.md) · [Phần trăm/cách tính](PROGRESS.md).

```sh
pnpm dev
# Mở /dev/aw2/world.html trên địa chỉ Vite vừa in ra.
```

Nếu đã có save AW2, tiếp tục hành trình đang lưu. Nếu chưa có, chọn **Tạo bản lưu AW2**. Muốn thử một lượt mới mà giữ nguyên dữ liệu đang có, dùng hồ sơ trình duyệt QA riêng. Không cần reset hoặc xóa save Soul of Meal.

1. Đọc **Mục tiêu trước mắt** ở phía trên bản đồ. Có thể mở **Hướng dẫn di chuyển, lưu và ghé bàn** bất cứ lúc nào. Chạm lối đi để đến nơi; chọn bản đồ rồi dùng WASD/mũi tên và E để tương tác. Tab chọn nút; Enter/Space kích hoạt, kể cả nút di chuyển. Escape đóng hội thoại và trả focus về bản đồ.
2. Bắt đầu tại Bà Giữ Chỗ, đọc mảnh khăn rồi trở lại để nhận trực tiếp5 starter. Theo mục tiêu qua Phố, Sân và các phòng; cửa hai đầu đường có tương tác **Đi qua**. Đóng hội thoại không tự nhận nhiệm vụ hoặc chọn kết thúc.
3. Mở **Đội và túi đồ** để xem cấp/EXP/nguyên liệu. Rương ở Phòng Kho nhận một lần. Khi mở lại bếp, đứng gần Dì Gác Bếp ở Sân hoặc ngọn lửa trong Phòng Lửa để nấu rồi chia bữa; hướng dẫn cho biết khi đang đứng xa.
4. Dùng **Ghé nhanh TCG / Auto Chess** hoặc hai bàn ở Phố để chơi thực tế. Ván dùng tài nguyên mượn, không tiêu túi đồ/nhận thưởng RPG. Quay về đọc điểm lưu trước khi vào; tải lại/rời bàn bỏ ván. [TCG](TCG_PRACTICE.md) · [Auto Chess](AUTO_CHESS_PRACTICE.md).
5. Nhận nhiệm vụ cuối tại Dì trước khi vào thử thách Phòng Bàn. Đội tự chiến đấu, bạn chọn tuyệt kỹ; có tạm dừng/tiến từng nhịp/giảm chuyển động, âm thanh chỉ bật khi chọn. Boss báo Mời hụt/Tắt bếp trước ba nhịp; Ghế trống chặn bốn đòn đánh thường. Chờ bảo vệ vỡ rồi dùng tuyệt kỹ gây sát thương, dùng hỗ trợ khi cần. [Chi tiết boss](BOSS_PRACTICE.md). Sau trận phải **Lưu kết quả và trở về**. Khi thắng, đọc ghi chép rồi về Bà để chọn một trong hai kết thúc.
6. Đi bộ chưa lưu vị trí; **Lưu vị trí** trước khi rời trang. Các hành động nhiệm vụ/rương/nấu/ghé bàn lưu riêng theo thao tác. **Đọc lại** trở về lần lưu gần nhất. Nếu tab khác thay đổi dữ liệu, đọc lại trước khi tiếp tục; không ghi đè tiến trình mới hơn.

Gate kỹ thuật mới dùng một lượt thật từ save trống qua cả hai mode/cổng, bốn quest, rương/nấu/chia, boss và hai kết thúc. Nhánh kết thúc thứ hai dùng đúng checkpoint đã kiếm và lưu, không sửa cờ nhiệm vụ. Nguồn và bản biên dịch đã cùng PASS ở AW2-010A; bản compiled với boss mới được kiểm tra lại47 bước tại [AW2-007D](evidence/AW2-007D.md), thắng thật ở nhịp45. Owner đã chơi và chưa thấy lỗi chặn, nhưng chưa ghi phiên bản/thiết bị/phạm vi quest/hai kết thúc nên gate playtest đầy đủ vẫn mở.

```sh
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1 --port 8455
# / → world review, không deploy hoặc cập nhật game stable.
node dev/tools/verify-aw2-demo.mjs --playwright <module> --chromium <executable>
node dev/tools/verify-aw2-demo.mjs --compiled --playwright <module> --chromium <executable>
```

Verifier tự mở/đóng source8462 hoặc compiled8463; build trước bản compiled. Chạy build xong trước các browser runner để Vite không reload giữa một hành trình. Chỉ dùng context QA mới, ảnh/runner JSON ở ignored `.asset-work/aw2-010a/`.

Còn cần playtest độc lập, đóng lỗi dùng thử, hoàn thiện12 nhân vật/map/NPC/boss/art/UI/cân bằng và QA thiết bị/hiệu năng/offline/quyền sử dụng/save production. Năm bộ hiện có đều `fullCharacterComplete=false`; không có gacha runtime và D11 chưa duyệt. Mốc demo không tự duyệt phát hành.

Sau kết thúc đã lưu, **Bạn đã hoàn tất hành trình demo** cho biết lựa chọn/EXP và cách tiếp tục khám phá. **Luyện TCG / Luyện Auto Chess** vào bàn qua điểm lưu an toàn; không cấp lại quà nhiệm vụ. Owner đã thử hai mode nhưng chưa kết thúc hành trình, nên playtest tới cuối còn mở. [Chuyển sang sản phẩm](PRODUCT_PLAN.md).

004I bổ sung hình boss/FX riêng trong trận, giữ nguyên quest/phần thưởng/lựa chọn kết. Đây là gói tham chiếu có8 tư thế và9 ô FX, full motion/audio/world/rights vẫn mở. [Gate boss](BOSS_CHARACTER_GATES.md).

AW2-006B: Phòng Bàn có nền/bàn riêng và bốn nút điểm đến dưới bản đồ. Bấm để đi bộ, đến gần dùng E/Tương tác; lối tắt chỉ mở sau ending. Boss dùng HD tĩnh và một số marker còn tạm. Không cần reset save. [Cách dùng/giới hạn](PHONG_BAN.md).

006E/D17: map chỉ hiển thị nhân vật đầu đội đã lưu. Đưa nhân vật muốn dùng vào Vị trí đội1 rồi Lưu đội hình; đội chiến đấu vẫn5. Draft/Hủy/lỗi lưu không đổi đại diện. Không cần reset save. [Đội hình](COLLECTION.md).
