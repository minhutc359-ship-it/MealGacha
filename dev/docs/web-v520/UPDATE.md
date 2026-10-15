# Web 5.2 · Sân đấu và nhịp chiến đấu Vị Linh

Sân 5.1 dùng chiều cao nhân vật bằng 42% sân và SVG kéo giãn theo tỉ lệ màn hình: trên điện thoại, quân tuyến sau / vòng phép lên gần HUD. 5.2 neo nhân vật bằng chân trên sân, giới hạn kích thước theo cả chiều rộng và chiều cao, dành chỗ cho nhãn, tách HP boss / cảnh báo khỏi mặt sân. Màn ngang thấp dàn đội theo chiều ngang. Viền sân hai lớp, màu nhãn / focus rõ hơn; dock giới thiệu immersive nằm dưới hàng tuyệt kỹ, không đè lên thẻ. Phần giới thiệu ghi **TRẬN MINH HOẠ**; nó vẫn là clip 25 giây tua trận mẫu, không phải thời lượng campaign thật.

## Động tác và hiệu ứng

- Canvas dùng cùng `drawChannel`, `drawProjectile`, `drawImpact` và atlas va chạm của TCG: đạn có đầu chuyển động / đuôi ngắn, vệt chém, va chạm và recoil; bỏ đường SVG nối hai đầu và vòng kéo dài theo sân.
- Tuyệt kỹ có niệm chiêu → bay / liên trảm → va chạm / dư âm. Hộ trận có pháp thành; Đột kích có nhịp chém; Pháp vị có pháp ấn; Hồi phục có cánh hoa; Khống chế có lồng sao. Hệ và ba phong cách làm đổi màu, hình đạn, số nhịp / hình pháp ấn; áp dụng cho 25 bộ tuyệt kỹ thực có trong catalog, không tuyên bố 139 animation vẽ tay độc lập.
- Năm boss dùng hình niệm chiêu / hiệu ứng tương ứng: Trống (thành khiên), Khuyển (liên trảm / lửa), Cổ Thụ (khóa rễ), Triều (pháp ấn / sóng), Sen (hoa hồi phục). Có vòng tụ lực trước đòn báo trước; tinh anh cũng niệm chiêu và có thể bị ngắt bằng khống chế.
- Mốc chuyển động lấy theo serial sự kiện tung chiêu, tránh cú đánh nhận vào làm khởi động lại động tác đang tung. Canvas / lease / ResizeObserver không dựng lại theo cue; một đồng hồ trình bày chung, tối đa 32 cue, kích thước FX tính bằng pixel. Xóa FX đợt cũ khi chuyển đợt, đóng băng khi pause / tab ẩn, giảm chuyển động và preset nhẹ có fallback.

## Địch và độ khó

Campaign giữ 4 vùng × (5 màn nhỏ + boss), truyện / lựa chọn / điều kiện mở đường. Màn thường **3 đợt**, boss **4 đợt**, **4–6 quân / đợt**; boss xuất hiện cùng quân hỗ trợ và tinh anh. Cấp gợi ý theo vùng: 1–11, 11–21, 21–31, 31–41. Người chơi có thể vượt cấp hoặc quay lại farm bằng đội mạnh hơn; không thêm thời gian chờ giả để kéo dài trận.

| Phe địch | Kỹ năng / đối phó |
|---|---|
| Hộ vệ sương | Tạo khiên cho bản thân và đồng đội thấp HP |
| Thợ săn hương | Đánh tuyến sau, gây bỏng |
| Dệt sương | Hút năng lượng, làm yếu, Khóa hồi phục 3s |
| Người giữ sương | Hồi 10% HP cho hai đồng đội bị thương; ưu tiên tiêu diệt |
| Trống Rỗng | Quét tuyến, tạo khiên cho phe địch; nửa HP đổi tuyến |
| Khuyển Than | Quét lửa / bỏng; cuồng nộ phá một phần khiên |
| Cổ Thụ | Trói / choáng, hút sinh lực, Khóa hồi phục 4s |
| Người Giữ Nước | Hút năng lượng / làm yếu; cuồng nộ quét hai tuyến |
| Sen Giữ Kho | Hút năng lượng, Khóa hồi phục 5s, hồi HP / khiên phe địch |

**Khóa hồi phục** giảm lượng hồi nhận 50%; tuyệt kỹ của vai trò Hồi phục thanh tẩy trạng thái này trước khi hồi HP. Focus vào người giữ sương / dệt sương, ngắt tinh anh và canh Che chắn / tuyệt kỹ hồi phục có ý nghĩa thực tế.

Dungeon lấy trung bình cấp của **những người trong đội hình mang vào**, không dùng dự bị / cả bộ sưu tập. Lưu snapshot lúc vào: `baseLevel = clamp(round(0.9 × trung bình) + 3 × (bậc−1), 1, 50)`. Mỗi tầng +1 cấp, tối đa 50; thêm hệ số HP `1 + 0.14 × (bậc−1) + 0.035 × (tầng−1)`, công nhân căn bậc hai hệ số. Bậc cao vẫn mạnh hơn ở gần trần cấp. Tầng 5 có hai đợt và boss Sen; vẫn giữ HP / energy, điểm nghỉ tầng 2/4, vật phẩm và tài nguyên kiếm được khi rút lui. Nhận XP giữa tầng không tự tăng mức khó đã chốt.

## Bảo toàn và ngân sách

Trận mới chọn luật **520**. Trận 5.0 / 5.1 đang lưu tiếp tục luật cũ, kể cả dungeon đang đi: không áp AI / stats / scaling mới vào giữa chuyến, thưởng campaign cũ giữ cấp cũ. Save/key/version gốc vẫn 1; trường mới optional. Không reset tiến trình, sao, lựa chọn, nhân vật, tài nguyên, collection, wallet hay bản lưu Adventure cũ. Không thay luật / transport PvP. Không thêm media, dependency; không sửa / build / sync Android hoặc iOS.

Gộp các module Pixi thành một chunk vẫn tải theo nhu cầu để giảm tổng gzip, thay vì tăng trần 650 KB. Cấu hình theo [Vite 8 / code splitting](https://vite.dev/guide/build.html#chunking-strategy); đã chạy smoke trên **bundle sản xuất**, bao gồm Canvas Pixi của Rương.

Kiểm chứng: [VERIFICATION.md](VERIFICATION.md), [BUDGET.md](BUDGET.md), [browser-qa.json](browser-qa.json), [balance-qa.json](balance-qa.json). Đây là mẫu Chromium / SwiftShader, chưa đo FPS trên điện thoại thật hoặc xác nhận Safari / điểm trải nghiệm 9/10. PR để người dùng xem và merge, không tự merge.

Ảnh chụp QA cho sân điện thoại, pháp trận và bố cục ngang có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.
