# Handoff

Nhánh: `game/tactical-tcg`.

TCG-005 là bản khôi phục vòng TCG thực sau phản hồi prototype sơ sài: `/` mở sảnh; collection/decks/packs/guide đã có route tab. Trận luyện/campaign nhận active deck (24 lá, owned/limit validated), tay đầu 4 lá và sân người chơi trống. Native IDs/art/lore của 181 thẻ được giữ; Tactical text mô tả hiệu ứng đã chuyển đổi, nội tại/công thức có engine authority.

New fields bổ sung trên progress v1, không đổi/xóa key cũ: account/decks/tickets/pity/pack receipts/choices/checkpoint. `ensureTacticalAccount` hồi phục một lần legacy profile và thêm starter. `withTacticalLock` serialize UI writers khi browser hỗ trợ; transaction fallback vẫn là optimistic localStorage, không phải database/server lock. Rương cũ giữ dữ liệu/receipt; gói TCG ở màn riêng. Chưa có UI import backup mới hoặc cloud save.

Luồng thử nhanh: Sảnh → nhận quà ngày → Mở thẻ → lật 5 lá → Bộ sưu tập tìm thẻ mới → Bộ bài sửa/lưu → Luyện tập chọn lá và ô/mục tiêu → Giao chiến/Tuyệt kỹ/Kết vòng → reload checkpoint → Hành trình đọc cảnh trước/sau/nhận reward → Manga. Thử cả 390px dọc/ngang và desktop trên preview thật trước merge.

Local verification hiện hành: 2,337 tests/177 files, 67 focused, hai typecheck, release records và build/package 375 files PASS. 84 mô phỏng chiến dịch bằng public commands (không sửa HP/kết quả) chứng minh có đường đi đủ 8 nút với thẻ kiếm được và lựa chọn ending. Xem evidence TCG-005; đây không là kết quả human balance/playtest.

TCG-003 hoàn tất local: Chest cấp collectible/Tinh Vị exact-once, bẫy/reaction/Tuyệt kỹ dùng được, boss ba pha, merge campaign/PvP đúng số bản, tutorial trận đầu và Manga lazy boundary. Không xóa hoặc ghi đè reward Chest cũ.

TCG-004 hoàn tất local: battle hierarchy, commander HP, boss phase, Vị Linh card/inspector, trap panel, result/log, campaign progress và Chest reward UI đã được đồng bộ; responsive 760/430px và reduced-motion có kiểm tra source/SSR. Vite dev server không khởi động được trong sandbox do `uv_interface_addresses`; production build vẫn PASS. QA hình ảnh/touch trên thiết bị thật chưa chạy.

Kiểm tra trước merge: checkout đúng remote SHA, chạy `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm release:verify`, `pnpm build`; sau đó review `/`, `/?tab=campaign`, `/?tab=manga`, `/chest` ở desktop và mobile.

Không đưa các tệp staging ẩn trong `dev/aw2/assets` vào commit. Không merge hoặc deploy nếu chưa hoàn thành QA thiết bị thật.
