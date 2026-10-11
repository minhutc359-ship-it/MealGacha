# Soul of Meal 4.3.1 · Giới thiệu tự chơi

Cập nhật web trên nền Adventure World 4.3. Không sync Capacitor, không sửa Android/iOS, không tạo APK/AAB. Giữ ngân sách web 100.000.000 byte, JS gzip 650.000 byte.

## Cách xem

Ở thanh chuyển chế độ của TCG (`/`), Auto chess (`/autochess`), Phiêu lưu (`/adventure`) và Rương (`/chest`), chọn **▶ Giới thiệu**. Một sân khấu riêng mở ra, tự chơi 25 giây, có phụ đề từng pha, mô hình/hiệu ứng/nhạc, thanh tiến trình và nút **Tạm dừng / Tiếp tục**, **Xem lại**, **Bỏ qua / Đóng**. Kết thúc có **Vào chơi**, đóng demo để trở về chế độ đang mở.

Chờ tải mô hình trước khi tính thời gian, tối đa 5 giây rồi dùng nhãn/fallback. Rời tab sẽ dừng đồng hồ; quay lại tiếp tục từ cùng thời điểm. Escape và nút đóng trả focus về nút vừa mở. Respect reduced motion và chế độ đồ họa nhẹ; tắt âm thanh/nhạc dùng tùy chọn hiện tại của người chơi. Header xếp nút giới thiệu thành hàng riêng trên cửa sổ web hẹp.

## Kịch bản 25 giây

| Chế độ | Thời gian | Pha và nội dung |
| --- | --- | --- |
| TCG | 0–3s | Giữa ván: 7 năng lượng, Cơm tấm sẵn sàng, Hộ vệ địch chặn chủ tướng. |
| TCG | 3–7s | Triệu hồi Phở bò, chi năng lượng, quân mới chờ lượt. |
| TCG | 7–12s | Nối Ấm trà ngã rẽ / Mời ngồi lại: cộng hưởng Hải giảm 1 năng lượng; Bữa cơm nhà hồi ý chí và cho chắn. |
| TCG | 12–18s | Hai nhúm gia vị / Dậy lửa nhắm Hộ vệ, gây 3 sát thương để mở đường. |
| TCG | 18–25s | Cơm tấm đánh chủ tướng 4 sát thương, thắng và nhắc thứ tự hành động. |
| Auto chess | 0–4s | Mua thêm hai Phở bò bằng 2 vàng. |
| Auto chess | 4–7s | Ba bản sao 1 sao tự ghép thành Phở bò 2 sao. |
| Auto chess | 7–9s | Xếp Cơm tấm tuyến trước, Phở bò/Bánh cuốn tuyến sau; 2 Người kể nhận thêm mana đầu trận. |
| Auto chess | 9–22s | Engine tự tìm đường, đánh, tích mana, dùng khiên/Hơi nhớ/hồi phục và thắng vòng mẫu 3. Mô phỏng được nén vào đoạn highlight; không đổi tốc độ trận thật. |
| Auto chess | 22–25s | Chiến thắng; nhắc chuẩn bị/mua quân/liên kết trước vòng tiếp theo. |
| Phiêu lưu | 0–5s | Đi trên crop bản đồ Chợ Đèn thật với Vị Linh theo sau và NPC. Nhắc WASD, chọn điểm, E. |
| Phiêu lưu | 5–10s | Gặp Bánh mì hoang dã cấp 8; Lá Xoáy của Gỏi cuốn bị kháng ×0,67 và tiêu PP. |
| Phiêu lưu | 10–14s | Đổi sang Phở bò hệ Hải, đối thủ có lượt hành động. |
| Phiêu lưu | 14–19s | Sóng Nước Dùng đánh Hỏa với lợi thế ×1,5, giảm HP. |
| Phiêu lưu | 19–25s | Dùng Hương Ấn thu phục, bạn mới vào đội. Ghi rõ kết quả mẫu, thu phục thật có thể thất bại. |
| Rương | 0–5s | Chọn bữa Sáng trong ba bữa; đây là chế độ sưu tầm. |
| Rương | 5–11s | Chìa mở nắp rương; số chìa mẫu giảm theo cấu hình giá mở. |
| Rương | 11–18s | Reveal Phở bò với artwork và độ hiếm từ catalog. Kết quả chọn sẵn, không mô tả là tỷ lệ random thật. |
| Rương | 18–25s | Phở bò vào bộ sưu tập mẫu; nhắc Hồ sơ vị giác và yêu thích. |

## Cách cô lập dữ liệu

`modeIntroState.ts` là Zustand transient, không persist. `modeIntro.ts` chỉ tạo fixture riêng, gọi các hàm engine thuần: `actBattle`, `buy/move/createCombat/advanceCombat`, `reduceAdventure`; không gọi store tiến trình, không đọc/ghi localStorage, không mở rương thật. Kịch bản Rương dùng nhóm món bữa Sáng và rarity catalog, không gọi draw/reward vào tài khoản.

Auto chess đang giao chiến tạm ngừng bước simulation khi intro mở, không ghi flag pause vào save, không tích lũy thời gian chạy bù. Phiêu lưu hủy đường click đang chạy và chặn phím game khi intro mở. Phím Space ở Rương không kích mở rương thật sau dialog. Nút giới thiệu Rương bị khóa khi còn reward đang reveal, tránh chồng hai nghi thức.

Player tải lazy khi cần; tái sử dụng atlas nhân vật, model SVG Phiêu lưu, food art và mixer nhạc/SFX. Không thêm binary asset hay dependency. Error boundary riêng cho intro cho phép đóng trở lại game nếu tải/player lỗi.

## Kiểm chứng

- Test kịch bản: mọi clip đủ 25 giây, frame/pha đúng thứ tự; TCG kích công thức, hồi, chắn, hạ Hộ vệ và thắng; Auto mua/ghép đúng giá, liên kết và cả ba quân dùng kỹ năng; Adventure tiêu PP, đổi đội, hạ HP và thu phục bằng reducer; replay xác định và dữ liệu đầu không bị sửa.
- Test timer: pause giữ thời gian, stall không chạy bù, dừng đúng 25 giây. Kiểm tra source cô lập không gọi store save/storage.
- `pnpm typecheck` và `pnpm typecheck:dev` đạt. Toàn bộ **387 test / 36 file** đạt; catalog **123 món / 35 tag / 9 event**, asset **132 tham chiếu / 0 thiếu**. Release records **328 asset / 32 dependency runtime** hợp lệ.
- Build sạch: **63.796.904 byte / 422 file**, tổng JS gzip **601.752 byte**, CSS gzip **89.871 byte**, không rò rỉ file. Đạt ngân sách 100 MB và JS gzip 650 KB.
- Browser local: Vite chạy được, CUA báo `net::ERR_CONNECTION_REFUSED` khi mở `127.0.0.1:8443` từ cloud browser. Preview Vercel trước đó yêu cầu quyền team. Chưa đánh dấu interactive browser QA là đạt.

Chỉ cập nhật PR web đang mở; chưa merge production.
