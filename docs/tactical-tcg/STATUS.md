# Status

05/11/2026 · TCG-007: màn chiến đấu mới toàn khung, bỏ cuộn trong bàn chính; tay bài/thanh hành động cố định, thẻ lớn/mục tiêu rõ, giao chiến từng bước và hiệu ứng đặt/lật/nâng sao/bẫy. Ba bộ nhập môn chơi ngay + hai công thức phát triển; giữ thẻ/deck/tiền/active cũ. 2,354 tests/179 files, 84 focused, hai types, release và build/package 376 files PASS. Browser desktop và 5 viewport iframe thực PASS giới hạn; chưa phải nghiệm thu điện thoại thật. Xem evidence TCG-007. Chưa merge/deploy.

TCG-006, 04/11/2026: session/recovery implementation and fresh automated checks PASS — 2,349 tests/178 files, 79 focused, both typechecks, release records and 376-file production build. Home resume, checkpoint replacement confirmation, stale-tab guard, daily/claimed reward states, explicit card targets and HTTP/WebView-safe pack/deck IDs are implemented. Backup import has preview/confirm/raw rollback/one undo snapshot and interrupted-restore recovery. Browser follow-up is in progress; see evidence TCG-006. No merge/deploy.

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
- Screenshot/browser localhost: BLOCKED ở TCG-005; TCG-007 đã kiểm tra desktop và responsive bằng Chrome/iframe. SSR/asset/build không thay thế nghiệm thu điện thoại thật.
- Online PvP, mastery/side-story mở rộng, motion/VFX riêng từng lá và nghiệm thu độc lập: OPEN. Nhập backup Tactical đã có trong TCG-006.
- Merge/deploy: NOT RUN (ngoài phạm vi).
