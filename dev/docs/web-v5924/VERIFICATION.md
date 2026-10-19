# Kiểm chứng Web 5.9.24

- **795/795 Vitest, 81 file**; TypeScript app/dev đạt. Bốn Node budget/release guard đạt.
- Sáu test cohort xác nhận model riêng đi xuyên TCG/Adventure/shared character resolver, portrait canon đúng, đủ asset HD/pixel/sound, pose contact đúng và không khai báo VFX nhân vật giả.
- Inspector asset: **192 pose**, 32/32 ô alpha có nội dung cho từng atlas HD và pixel; kích thước lần lượt 1024×2048 và 256×512. Contact sheet cuối được rà cục bộ; không commit ảnh QA.
- Audit runtime: **83/139 model** đã sản xuất; còn 52 portrait-only và 4 model animation cũ. 139 model TCG vẫn duy nhất; Auto Chess giữ 44 model duy nhất và 38 bộ 32 pose.
- `compatibility.json`: toàn bộ **77 manifest cũ** giữ nguyên đệ quy mọi trường. Sáu model mới có `effect: null`; unit test khóa việc bỏ VFX hình học nhận diện để compositor dùng atlas theo hệ.
- Catalog hợp lệ: 123 món, 35 tag, 9 event. Asset validator kiểm 137 tham chiếu, thiếu 0. Release record có 786 asset và 32 dependency runtime. Culture/manga validators đạt.
- Build **182.042.811 bytes**, 863 file; tăng 4.592.417 bytes so với build 5.9.23 sau sửa tầm đánh. JS gzip **674.765/675.000 bytes**, CSS gzip 107.187 bytes. Không tăng ngân sách; offline shell 2.924.362/12.000.000 bytes.
- Rights check phi thương mại đạt cho asset mới; 13 mục cũ còn chờ bằng chứng thương mại, không đổi trong đợt này.

Đã thử khởi chạy bộ QA Adventure Chromium cho hai cohort nhưng runtime hiện tại không có executable Chromium/WebKit, nên không tạo báo cáo browser giả. Test renderer/reducer, asset, type, build và size đều đạt; cần để CI/preview và chủ dự án kiểm tra trực quan mobile. Chưa chứng nhận Safari/iPhone thật, FPS/RAM/nhiệt dài hạn hoặc PvP hai thiết bị.
