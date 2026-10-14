# Soul of Meal Web 4.5 · Bẫy Hương

## Khi chơi

Mỗi bên có **một ô bẫy độc lập**, giữ đủ ba ô đồng minh. Chọn lá bẫy trên tay → **Úp bẫy**; trả năng lượng ngay và dùng cộng hưởng giảm giá như thẻ khác. Bẫy chỉ sẵn sàng từ lượt tiếp theo, nằm úp cho đến khi bị lộ hoặc kích hoạt. Khi điều kiện xảy ra, lượt địch dừng tại cửa sổ **Kích hoạt / Giữ bẫy**. Không trả thêm năng lượng khi kích hoạt; bẫy dùng một lần rồi rời ô. Giữ bẫy để chờ hành động sau trong cùng lượt hoặc lượt khác. Trong lượt của mình có thể bỏ bẫy cũ để thay, không hoàn năng lượng.

| Bẫy | Giá gốc | Điều kiện | Kết quả |
|---|---:|---|---|
| Nắp Nồi Bật Lửa | 2 | Địch đánh chủ tướng | Chặn đòn, quân đánh tiêu lượt |
| Gương Nước Phản Hương | 3 | Địch tấn công | Chặn đòn, phản công lên chủ tướng địch theo công quân, tối đa 4 |
| Vòng Than Phản Công | 3 | Địch tấn công | Gây 2 lên các quân địch đang sẵn sàng; đòn tiếp tục nếu quân đánh sống |
| Dây Lá Giữ Chân | 2 | Địch triệu hồi quân giá gốc từ 3 | Sau hiệu ứng vào sân: gây 2 và đóng băng quân mới |
| Niêm Phong Bí Thuật | 3 | Địch dùng phép giá gốc từ 2 | Vô hiệu hiệu ứng nhưng địch mất lá/năng lượng; không kích nội tại phép hoặc combo |
| Mâm Đồng Che Chở | 2 | Địch đánh đồng minh | Cộng 2 chắn cho mỗi đồng minh trước giao tranh |
| Lá Thư Bên Bếp | 2 | Địch hạ quân mình giá tối đa 4 | Gọi lại đúng quân đó với 2 máu nếu có chỗ; không hiệu ứng vào sân, chưa sẵn sàng |
| Giỏ Hương Dự Phòng | 2 | Địch triệu hồi quân giá gốc từ 4 | Hồi 3 ý chí và rút 2; tay tối đa 8 |

Hai phép đối sách: **Lật Khăn Trải Bàn** (1) gỡ bẫy địch mà không cần biết danh tính; **Nếm Trước Một Nhịp** (2) làm lộ bẫy và rút một lá, bẫy vẫn có hiệu lực. Phép thứ hai có thể bị Niêm Phong chặn.

Gói **Nhận bộ bẫy 4.5** tại sảnh cấp mỗi thẻ ít nhất hai bản, tự nguyện và chỉ một lần. Không tiêu tiền/bụi hay sửa bộ bài đang dùng. Bộ gợi ý Bẫy Hương có 10 quân, 4 phép, 4 bẫy trong 18 lá; lọc Bẫy xuất hiện ở bộ sưu tập và xây bộ. Tổng catalog TCG 181 thẻ.

HUD cho biết lượt, năng lượng, quân sẵn sàng và ô bẫy. Tay bài điện thoại đọc tên rõ, cuộn ngang bằng chạm hoặc nút; bàn phím dùng mũi tên để chuyển thẻ. Cửa sổ phản ứng nêu hành động địch, sức tấn công và điều kiện bẫy, có focus/modal thật. Bẫy lật bằng animation và halo, âm thanh dùng mixer hiện có. Reduced motion/đồ họa nhẹ tắt chuyển động lật và blur nền. Demo TCG dùng bẫy thật trong kịch bản nhưng không chạm save người chơi.

## Tham khảo và lựa chọn cơ chế

Đã đọc nguồn chính thức:

- [Yu-Gi-Oh! Rulebook v9](https://img.yugioh-card.com/ygo_cms/ygo/all/uploads/Rulebook_v9_en.pdf): úp trước, không kích hoạt trong lượt vừa úp, điều kiện phản ứng và bẫy thường dùng một lần.
- [Fast Effect Timing](https://www.yugioh-card.com/en/play/fast-effect-timing/): cửa sổ phản ứng theo hành động.
- [Mirror Force](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=4887&ope=2&request_locale=en): phản ứng khi tuyên bố tấn công.
- [Magic Cylinder](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5124&ope=2&request_locale=en): chặn đòn và phản sát thương.

Thiết kế Soul of Meal dùng một phản ứng một lần, không triển khai chuỗi Chain/Spell Speed đầy đủ hoặc bẫy liên tục. Vòng Than gây sát thương có giới hạn thay vì xóa cả sân; Gương giới hạn 4; Niêm Phong cần phép giá từ 2 và trả trước 3 năng lượng. Triệu hồi giải quyết hiệu ứng vào sân rồi mới mở bẫy. Những giới hạn này phù hợp sân ba quân và tránh khóa toàn bộ thao tác. Nội dung, tên và 11 minh họa là thiết kế mới; không dùng hình, khung, nhân vật hoặc âm thanh Yu-Gi-Oh!.

## Save và luật cũ

Trận/run mới dùng luật 450. Trận đang lưu hoặc thám hiểm đang chạy theo luật 350/400 tiếp tục giữ pool và luật cũ. Giữ schema phiên bản 1, key lưu, tiền, XP, bụi, bộ bài, chương và tiến trình Auto/Adventure; thêm các trường tùy chọn cho ô bẫy, nhịp lượt, con trỏ AI và phản ứng đang chờ. Không reset tiến trình. Import kiểm tra điều kiện, lượt úp, danh tính thẻ, mục tiêu và con trỏ phản ứng; mã chuyển dữ liệu bảo toàn cửa sổ chờ. Tải lại tiếp tục đúng một lần, không rút bài/trả năng lượng lặp.

Bẫy địch úp chỉ hiển thị mặt sau. Dự báo và coach dùng thông tin công khai, không đoán tên hoặc hiệu ứng từ danh tính kín; hiện lời nhắc kết quả có thể thay đổi. Bẫy đã lộ được đưa vào dự báo thật. AI chọn gỡ bẫy theo ô đang có bài, không dùng tên bẫy kín khi chấm điểm.

## Ảnh và ngân sách

11 ảnh WebP 900×1200, tổng **4.244.246 byte**, tạo qua **image_gen.imagegen (built-in)**, mã hóa ffmpeg chất lượng 94/compression 6. Prompt và provenance: [artwork.json](artwork.json); decode/hash: [asset-qa.json](asset-qa.json). Ảnh là byte thật trong Git; registry quyền có nguồn riêng từng asset. Không thay atlas nhân vật động chung.

Baseline Web 4.4.1 **69.956.770 byte**; ngân sách thêm **10.000.000 byte**, trần đợt này **79.956.770 byte**. Guard tính toàn bộ output build, gồm code/CSS và ảnh, cùng trần web 100 MB/JS gzip 650 KB. Build sạch cuối: **74.246.151 byte**, tăng **4.289.381 byte**, còn **5.710.619 byte** trong phần thêm. **449 file**, JS gzip **618.446 byte**, CSS gzip **93.981 byte**, **0 leak**. Docs/prompt/test/ảnh QA không đi vào bản web.

## Kiểm chứng

**423 kiểm thử / 41 file** đạt; có 19 kiểm thử mới cho giá úp, điều kiện và thời điểm, giữ/kích hoạt, vô hiệu phép nhưng giữ chi phí, quân tấn công đã bị AoE hạ, hồi sinh đúng quân, giới hạn tay/sân, dự báo kín, save code, cửa sổ giả, gói idempotent và 30 trận mô phỏng với snapshot có thể tải ở từng bước. Typecheck app/dev, catalog 123 món, 146 asset references/0 thiếu, registry 350 asset, build/size và cú pháp service worker đạt. Local dùng hai worker/timeout 20s; CI dùng lệnh mặc định.

Chromium 1440×900, 390×844, 844×390, 320×568: sảnh nhận gói và trận đấu vừa viewport, ba quân + một bẫy, úp → tải lại khi đang phản ứng → giữ đòn yếu → kích hoạt chặn đòn mạnh, dùng một lần, tiền/XP giữ nguyên, danh tính bẫy địch kín, ảnh giải mã, demo ẩn chú thích và low/reduced motion không sửa save; không JS error/asset thiếu trong mẫu. Kiểm tra thêm cửa sổ cả tám bẫy ở điện thoại nhỏ và ngang. Dữ liệu [browser-qa.json](browser-qa.json), script [verify-web450.mjs](../../tools/verify-web450.mjs). Không có API/backend mới: thao tác UI → actBattle → protected localStorage → tải lại → UI. Chưa kiểm tra Safari hoặc thiết bị thật; không suy FPS từ kiểm tra headless.

Chỉ web; không sửa/sync/build Android/iOS. PR riêng đặt trên nhánh 4.4.1 của [PR #34](https://github.com/minhutc359-ship-it/MealGacha/pull/34), phụ thuộc bản đó; không tự merge.

Ảnh chụp QA cho bàn, phản ứng, bẫy và bố cục ngang có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.
