# Xác minh Web 5.3

Luồng cần xác minh: mở rương bằng UI → ghi chìa/phần thưởng/thẻ cùng giao dịch → hồ sơ đạt mốc → đồng bộ hội ngộ → xếp đội/nâng cấp → chiến đấu → video/âm riêng → kết thúc đúng một lần → lưu và reload.

## Kết quả

- **540 test / 49 file** qua. Bao gồm toàn bộ bộ cũ và kiểm tra mới cho 139 recipe, các mốc 15/25/35/45, rương lịch sử đã dùng, loại fusion, sổ độc lập mảnh tiêu hao, Ước hẹn, giữ roster/UID/tài nguyên, độ hiếm vừa phải, cấp/bậc Chân ước, mana địch, thanh tẩy/giáp/né/tái sinh, hút đúng năng lượng thật, nội tại hồi đúng người và xóa phản đòn mạnh đã hết hạn.
- Tính chiêu một lần, chặn chiêu thứ hai trong phim, tick dừng, reload chính xác, sự kiện phim phải khớp serial/source, chuyển đợt/kết quả sau phim, AUTO dừng tại chiêu đầu, OFF giữ qua reload, thưởng một lần; luật undefined/510/520 không có gate video và tiếp tục logic cũ.
- Typecheck app/dev; catalog **123 món**; asset refs **143 / 0 thiếu**; registry **635**; release verify; build; guard dung lượng; cú pháp service worker và diff checks qua.
- [Media QA](media-qa.json): giải mã toàn bộ **139 MP4 H264 + 139 MP3**, kiểm codec/kích thước/fps/thời lượng và hash, không dùng LFS pointer hoặc file chỉ có header. 139 video khác hash; 139 âm khác hash. Script dựng dùng tệp tạm rồi đổi tên sau khi encoder hoàn tất.

## Trình duyệt / dữ liệu thật

[Script](../../tools/verify-awakening530.mjs), [kết quả](browser-qa.json): Chromium / SwiftShader, 1440×900, 390×844, 844×390, 320×568, 390×700. Video thực có readyState ≥2, khung 512×288, currentTime tăng; dừng cả phim và tick, reload giữ trận rồi tiếp tục/bỏ qua mà không tính chiêu lại. Kiểm bounds các nhân vật/nhãn trong sân, HUD ngoài sân; kiểm cả năm vai trò, tự kết thúc clip, âm đang phát và lưu công tắc OFF. Khung phim toàn màn hình dùng portal và giữ focus; có điều khiển ở màn ngang.

Luồng thu thập dùng **nút rương thật**: fixture 44/45 Nhiên, nhịp Ước hẹn 4/5, 30 chìa → rương cho đúng thẻ → 45/45, 29 chìa → hồ sơ hội ngộ một lần → đặt vào đội → dùng một Sổ KN lên cấp 2 → reload giữ cấp/mảnh. Không đổi coin/dust TCG. Có ảnh rương và hồ sơ.

Kiểm thêm video bị chặn tải, reduced motion, và giả lập một lần lệnh hoàn tất không lưu được: có Thử lại, giữ gate, sau thử lại không tiêu năng lượng/tính sát thương nữa. Không JS error/asset thiếu trong các luồng chính.

[Production QA](production-qa.json), [script](../../tools/verify-production530.mjs): chạy **dist** qua `vite preview`, không import source/QA hook vào sản phẩm. Demo RPG/TCG/Auto chess/Rương có canvas và không đổi game save; Pixi chunk và canvas Rương thực sự hoạt động. Sau đó vào trận RPG thật, tung tuyệt kỹ, xác nhận video 512×288 và AudioBuffer clip 2.4s thực phát; tắt video rồi xác nhận vẫn phát âm riêng. Service worker trả video cache **206**, range 0–23, 24 bytes có `ftyp` khi mạng offline. Hồ sơ production tải mô tả JSON và tiến độ 0/45. Không JS error/HTTP lỗi.

## Nhịp trận

[Balance QA](balance-qa.json), [script](../../tools/verify-balance530.mjs). Thời gian dưới đây là đồng hồ mô phỏng, không cộng video, có AUTO/focus/che chắn:

| Đội / màn | Kết quả | Giây |
|---|---|---:|
| Cấp 1, kỹ năng 1, gear 0 · màn đầu | Thắng | 49 |
| Cùng đội, boss vùng đầu | Thua hết giờ | 180 |
| Boss Phố Đèn Lồng · cấp 11, kỹ năng 6, gear 3/3/2 | Thắng | 83 |
| Boss Bến Cảng · cấp 21 | Thắng | 83.5 |
| Boss Khu Vườn · cấp 31 | Thắng | 102.5 |
| Boss Thủy Triều · cấp 41 | Thắng | 99 |

Bộ kiểm tiến trình dùng tài nguyên thực farm được vẫn đi qua đủ 24 màn và dungeon; không cấp sẵn xu/sách để che lỗi kinh tế. Nhân vật mới hiếm cao vẫn cần nâng cấp, không biến thành trận kết thúc ngay.

## Tái chạy

Từ gốc repo: `pnpm test`, `pnpm typecheck`, `pnpm typecheck:dev`, `pnpm validate:catalog`, `pnpm validate:assets`, `pnpm release:verify`, `pnpm build`, `pnpm release:size`, `node --check dist/sw.js`.

QA trình duyệt dùng Playwright/Chromium ngoài dependency sản phẩm; đặt `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR` nếu cần rồi chạy hai script trên. `python3 dev/tools/verify-media530.py` cần ffmpeg/ffprobe; dựng lại phim với `node dev/tools/build-spirit-movies530.mjs` và âm với `python3 dev/tools/compose-spirit530.py` (NumPy). Catalog triệu hồi và bộ recipe được lưu để tái tạo, không gọi dịch vụ AI trong game.

Giới hạn: chưa kiểm Safari hoặc FPS/độ mượt trên thiết bị thật; chưa chấm điểm trải nghiệm 9/10. Vercel connector thiếu quyền team `minmin-s-app` (403), nên không coi trạng thái deployment Ready là bằng chứng đã xem được preview trực tiếp. Không đổi cơ chế bảo vệ deployment. Các kiểm chứng production ở trên chạy từ build cục bộ. Không build/sync native, không tự merge PR.
