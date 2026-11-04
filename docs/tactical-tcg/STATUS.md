# Status

Ngày 04/11/2026: TCG-005 hoàn tất vòng chơi thẻ bài và verification local. Các tuyên bố complete ở TCG-002/004 chỉ đúng phạm vi cutover/UI của chúng; prototype khi đó chưa có vòng deck/hand/collection.

- TCG đầy đủ vòng sở hữu → mở/craft → dựng bộ → chơi bài → reward/cốt truyện: PASS.
- Catalog 181 lá và ảnh tương ứng, bộ 24 lá, tay đầu 4 lá, Lửa Bếp, phép/bẫy/nội tại/công thức: PASS.
- Đội người chơi production dựng từ bài đã chơi, không còn preset: PASS.
- Pack 5 lá, odds/pity/duplicate/history và hai vé khởi đầu: PASS.
- 84 mô phỏng command hợp lệ kết thúc; xác nhận đường đi đủ 8 nút và ending: PASS.

- Tactical battle: PASS.
- Campaign 4 hồi/8 nút: PASS.
- Durable exact-once reward: PASS.
- Legacy backup/migration: PASS.
- Manga/Chest retention: PASS.
- Chest → collectible/Tinh Vị exact-once và recovery: PASS.
- Trap/reaction, campaign merge và boss Pha 1/2/3: PASS.
- Manga lazy boundary: PASS.
- Tactical battle/campaign/Chest reward UI completion: PASS (source, SSR and production build).
- TypeScript, full tests, policies và production build: PASS.
- Visual QA trên thiết bị thật: NOT RUN.
- Screenshot/browser localhost: BLOCKED trong phiên này (cloud browser không kết nối được server; browser binary local tải về lỗi). SSR/asset/build không thay thế QA cảm quan.
- Online PvP, mastery/side-story mở rộng, motion/VFX riêng từng lá, nhập backup Tactical và nghiệm thu độc lập: OPEN.
- Merge/deploy: NOT RUN (ngoài phạm vi).
