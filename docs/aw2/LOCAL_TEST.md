# Chạy AW2 trên máy để chơi thử

Dùng nhánh `game/adventure-world-2`. Môi trường hiện được kiểm tra: Windows/Node25.2.0, pnpm10.34.3, Chrome155; trước đó có bằng chứng Linux/Node22.23.2. Các trang AW2 này chạy phía trình duyệt, không cần backend, tài khoản hoặc file .env.

Tại thư mục dự án:

```sh
# Windows PowerShell: cd D:\prj\MealGacha
# Hoặc mở terminal tại thư mục clone trên máy bạn.
pnpm install --frozen-lockfile
pnpm dev
```

Nếu đã cài dependencies và lockfile không đổi, có thể bỏ qua lệnh install. Giữ terminal đang chạy; Ctrl+C để dừng. Mở **http://localhost:8443/dev/aw2/world.html** để vào AW2. Trang `/` là game Soul of Meal hiện tại. Nếu cổng8443 đang được dùng, dùng server hiện có hoặc chạy `pnpm dev --port 8444`, sau đó đổi cổng trong các địa chỉ dưới thành8444.

| Muốn thử | Địa chỉ |
|---|---|
| Hành trình, nhiệm vụ, đội, túi đồ, TCG/Auto Chess | http://localhost:8443/dev/aw2/world.html |
|32 cel/tám trạng thái và kỹ năng Sương Lành | http://localhost:8443/dev/aw2/starters.html?spirit=aw2-suong |
| Trận mẫu5 người, ultimate thủ công, tạm dừng/bước từng nhịp | http://localhost:8443/dev/aw2/battle.html |
| Xem trạng thái bản lưu AW2 | http://localhost:8443/dev/aw2/index.html |

Trong hành trình, chọn **Tạo bản lưu AW2** nếu chưa có save; save hợp lệ đã có sẽ mở tiếp. Chạm đường đi hoặc dùng WASD/mũi tên; đến gần NPC/đồ vật/cửa rồi nhấn E hoặc **Tương tác**. Có nút hướng trên màn hình. Theo **Mục tiêu trước mắt**: gặp Bà Giữ Chỗ → đọc khăn → trả nhiệm vụ để nhận5 starter. Chọn **Lưu vị trí** trước khi tải lại vì đi bộ chưa tự lưu; các hành động nhiệm vụ/phần thưởng lưu tiến trình khi xác nhận thành công. Tab chọn nút, Enter/Space kích hoạt, Escape đóng hội thoại.

Trong trận mẫu, thử ultimate Sương Lành khi đủ năng lượng, **Tạm dừng** → **Bước 1 nhịp** → **Tiếp tục**, rồi bật **Giảm chuyển động**. Hiệu ứng đạn/vùng chỉ đi cùng kết quả combat thật. Âm thanh bật tự nguyện bằng ô **Âm thanh**. Trận mẫu và màn xem nhân vật không ghi tiến trình/phần thưởng.

Sau AW2-004H, mỗi nhân vật có một làn riêng để tránh che nhau; trục ngang vẫn thể hiện bước tiến trong trận. Ký hiệu **Đ1–Đ5** là đội, **K1…** là ký ức. Mở **Máu và trạng thái từng nhân vật** để xem tên đầy đủ/HP/trạng thái hiện tại. Dùng **Đến tuyệt kỹ** và **Đến đấu trường** để chuyển nhanh bằng chạm hoặc Tab/Enter. Điện thoại cuộn dọc để giữ chữ và nhân vật rõ; nút ultimate trong trận boss nay là từng hàng có chân dung. Thử ở cửa sổ hẹp, tạm dừng rồi đổi kích thước, kiểm tra nhân vật/đạn vẫn đúng mục tiêu và báo thao tác/cảnh khó theo dõi.

Boss mới ở **world.html**, sau khi nhận nhiệm vụ cuối tại Dì và vào Phòng Bàn; trận mẫu battle.html không phải boss này. Mời hụt/Tắt bếp có cảnh báo ba nhịp; Ghế trống chặn bốn đòn đánh thường. Chờ lớp bảo vệ vỡ rồi dùng tuyệt kỹ gây sát thương. Dùng Tạm dừng/Bước1 nhịp để đọc cảnh báo; thắng xong chọn **Lưu kết quả và trở về**. [Hướng dẫn boss và lưu kết quả](BOSS_PRACTICE.md).

Chơi thử nhanh: nhận đội → đi sang Phố và trở về → lưu/tải lại → mở TCG hoặc Auto Chess từ **Ghé nhanh**, chơi rồi rời bàn. Sau đó tiếp tục mục tiêu nhiệm vụ tới boss. Bản đồ nối Làng → Phố → Sân → Kho → Lửa → Bàn. [Hướng dẫn demo đầy đủ](DEMO.md).

Save AW2 dùng `aw2.development.save`, tách dữ liệu Soul of Meal. Giữ cùng trình duyệt và địa chỉ `localhost:8443`: đổi cổng/host hoặc dùng cửa sổ riêng tư là kho lưu khác. Ghi save cần localhost/HTTPS và Web Locks; nếu báo không ghi được, dùng Chrome mới và giữ thông báo lỗi để báo lại. Không cần reset/xóa localStorage để thử cập nhật này. Khi gặp lỗi, ghi trang/zone, thao tác trước lỗi, thông báo trên trang/Console và việc có tái hiện sau tải lại hay không.

Có thể kiểm tra bản biên dịch riêng:

```sh
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1 --port 8455
```

Mở http://127.0.0.1:8455/ để vào hành trình. Kho lưu của địa chỉ này độc lập với localhost:8443. Đây là bản xem thử local; map/NPC/boss, cân bằng, âm thanh, quyền sử dụng và playtest người dùng vẫn còn gate chưa hoàn tất. [Tiến độ](REPORT.md), [kiểm chứng](TEST_LEDGER.md).

Sau004I, thử **Đến đấu trường** ở320/390px: boss có hình bát gốm/tạp dề riêng, không bị bảng cảnh báo che ở điểm nhảy. Quan sát ba chiêu/counter, pause/giảm chuyển động/rút lui; hình tác động không tự quyết định thắng. Màn tổng kết chỉ xuất hiện sau kết thúc đã lưu. [Gate boss](BOSS_CHARACTER_GATES.md), [worklist sản phẩm](PRODUCT_PLAN.md).

## Muối Đen · bộ hình tham chiếu mới

Mở http://localhost:8443/dev/aw2/roster.html?spirit=aw2-muoi sau `pnpm dev` để xem world bốn hướng,32 cel/tám trạng thái, bốn FX và âm thanh tự nguyện. Màn này không cấp nhân vật/ghi save; kỹ năng debuff và thu thập Muối Đen còn chờ007E và phần collection. Đội khởi đầu vẫn5 người.
