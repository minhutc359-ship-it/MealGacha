# Soul of Meal 4.0.0 — Chợ Ký Ức Sống

Bản triển khai web để review, dựa trên PR #23 (chính sách/nghiên cứu), không tự merge hoặc tự quảng bá là đã qua QA điện thoại thật.

## Nội dung chạy được

- 171 thẻ TCG, gồm 8 thẻ mới. Nêm vị yêu cầu chọn đúng một nhánh trước khi trả năng lượng; AI và huấn luyện viên chọn nhánh cụ thể. Ủ vị có ID/đích/lượt/sequence được lưu, tối đa hai hiệu ứng mỗi phe, giải quyết một lần đầu lượt sau; Mở nắp chỉ gỡ đích địch hợp lệ. Mục tiêu đã rời sân thì buff không tìm một quân khác thay thế. Khăn ấm giải băng; Người kể rút một lá sau Nêm vị, tối đa một lần/lượt.
- Gói khởi hành tự nguyện cấp mỗi thẻ mới tối thiểu hai bản, một lần. Không đổi bộ bài, xu, bụi, pity, thẻ cũ hay tiến trình cũ. Người chơi tự thêm thẻ vào bộ bài.
- 3 chương/9 màn TCG sau 18 màn cũ. Cần hoàn thành 18 màn và chọn kết thúc cũ. Mai không hồi sinh; nhánh nhớ giữ tiếng vọng, nhánh tiễn để An nói. Ending gốc được ghim khi bắt đầu nội dung mới. Reward màn mới có receipt trong namespace story400; clearedStages và settled tiếp tục chặn nhận lặp.
- Thám hiểm mới có 4 sự kiện và 4 di vật bổ sung. Chuyến đang chơi giữ luật/pool thưởng 350. Các node đã sinh và reward đang chờ giữ nguyên.
- Auto Chess mới dùng luật 6: 18 đợt, 6 augment bổ sung, hai boss chiến dịch ở 15/18 dùng frost/copy và chuyển pha. Lượt luật 1–5 giữ pool augment/boss Survival, kết thúc chiến dịch ở 12. Nếu phiên chiến dịch 3.5 thắng ở 12 vẫn còn lưu, bắt đầu chiến dịch sẽ tiếp tục 13 với đội hình, shop/pool, đồ, vàng, XP, ý chí và receipt đợt cũ; không mở lại record cũ. Nếu phiên đó đã được thay thế, chiến dịch mới đi từ đợt 1. Đây không phải đồng bộ đội hình từ record.
- Bảng đóng góp Auto theo sự kiện thực: sát thương mất máu, hồi thực, chắn trao từ kỹ năng, chắn thực sự hấp thụ. Không suy đoán từ thanh máu và không cộng chắn ban đầu thành kỹ năng.
- 3 arena WebP gốc (820.494 byte) nối vào chương/trận TCG mới và arena Auto 13–18. 14 profile chuyển động thủ tục riêng phủ trên atlas có sẵn; không phải 14 sprite sheet hay rig 3D mới. Reduced motion giữ thông tin và bỏ chuyển động thêm.
- 6 cue vùng × hai cách phối thường/8-bit, 12 MP3 gốc (1.829.779 byte), tác giả bằng score thủ tục tái lập, không dùng sample ngoài. Chuyển cue ấm/căng theo vùng và trận, dùng mixer/crossfade có sẵn; chưa triển khai mixer ba stem đồng bộ như đề xuất nghiên cứu. Cache decoded music tối đa hai buffer/48 MiB (voice đang phát/crossfade còn giữ tham chiếu riêng). Cache atlas LRU soft target 16 ảnh/64 MiB; canvas đang mount giữ tham chiếu riêng. Không cam kết hard cap tổng RAM trình duyệt.

## Bảo vệ tiến trình

Hai khóa gốc `foodchest.tcg.v1`, `foodchest.user.v1` giữ nguyên. Trận/chuyến thiếu rulesVersion đọc là 350; nội dung mới được nối thêm, không cân lại định nghĩa 163 thẻ cũ. Các trade hàng ngày dùng catalog cũ để giữ lời chào hàng theo ngày. Auto đang chơi giữ rulesVersion/seed/pool.

Ghi có journal, checkpoint mới nhất/bản trước, raw comparison và writer lease đồng bộ best effort. JSON lỗi, schema tương lai, ghi gián đoạn, storage không dùng được và ghi đè bởi tab cũ mở giao diện phục hồi, không tự tạo rồi ghi save thay thế. Có xuất raw và xem trước JSON/MGC1 trước phục hồi. Save/quota lỗi không cập nhật store giả là đã ghi thành công. Lease không phải atomic CAS giữa hai process; bản 3.5 không biết lease và có thể ghi đè, checkpoint phát hiện ở lần đọc kế tiếp. Không gộp tự động trạng thái trận. Giữ backup riêng; ảnh timeline vẫn ở IndexedDB và cần ZIP backup.

## Kiểm chứng

- `pnpm typecheck`, `pnpm typecheck:dev`: đạt.
- `pnpm test`: 334 tests/30 files đạt, gồm kiểm tra tiếp tục đợt 13 và receipt cả 9 màn mới.
- Production build khoảng 41,725 MB; tổng JS gzip khoảng 525,550 KB; giữ gate 45.000.000 byte và 650.000 byte.
- Browser production headless: quà nhận một lần/reload và raw ending/inventory/deck giữ nguyên ở remember/release; mở lời dẫn đúng nhánh; Nêm vị đánh đúng mục tiêu, một spell, không tiêu trước khi chọn; 390×844/844×390/1366×768 không tràn ngang; raw corrupt giữ nguyên và hiện phục hồi. Kết quả `browser-v4-results.json`.
- Asset provenance: `arena-prompts.json`, `audio-v4.json`, `rights/ASSET_REGISTER.json`. Luật/card hiện thực trong `src/game/v4Cards.ts`; policy của PR #23 tiếp tục áp dụng, cập nhật phạm vi bản web 4.0.

## Giới hạn trước phát hành rộng

Cần playtest cân bằng người thật toàn bộ 9 màn/6 đợt và kiểm tra trên Android tầm trung (âm thanh, FPS/frame-time, RAM, background/resume, export/import ảnh). Headless không chứng minh nghe nhạc hay FPS điện thoại. Giữ Canvas hiện tại để tránh đổi toàn bộ renderer trong cùng migration save; WebGL/rig, ba stem, 24 quân minh họa mới và thư viện boss animation đầy đủ nằm ở đợt tiếp theo của roadmap. Không có backend/cloud save/IAP. Các thông tin chủ thể phát hành/contact pháp lý còn cần chủ repo xác nhận như checklist PR #23.
