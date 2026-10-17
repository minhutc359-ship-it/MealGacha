# Kiểm chứng Web 5.9.8

User story: vào trận hậu truyện → reducer phát cảnh báo/chuyển pha/kỹ năng → đúng model/pose và mục tiêu trên sân → renderer dọn hiệu ứng sau tác động, pause/ngắt chiêu vẫn giữ đúng trạng thái. Đây là thay đổi presentation của game web; không có API/database mới.

## Kết quả

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| TypeScript app/dev | `pnpm typecheck`, `pnpm typecheck:dev` đạt |
| Logic/regression | 688 Vitest / 65 file; thêm 5 ca ở `enemy598.test.ts`; 4 Node release/budget guard đạt |
| Catalog / asset / records | Catalog 123 món, 35 tag, 9 event hợp lệ; 128 đường dẫn kiểm tra không thiếu; 577 runtime asset có hồ sơ |
| Atlas | 8 bộ × 32 frame, 256 frame khác nhau, alpha và gutter an toàn; 24 WebP tổng 5.235.260 byte; `asset-qa.json` |
| Chromium 153 | 29 ca Adventure tại 320×568, 390×844, 844×390, 1440×900; `chromium-qa.json` |
| WebKit 26.5 | Cùng 29 ca; `webkit-qa.json`; engine Linux headless, không phải Safari/iPhone thật |
| Kết quả trận | Chromium/WebKit đều kiểm tra thêm hai enemy thắng và năm ally gục; `chromium-outcome-qa.json`, `webkit-outcome-qa.json` |
| Auto / TCG | Hai viewport Auto có cast thật và TCG bấm Thi triển thật; cả Chromium/WebKit đều qua, không JS error/asset lỗi; `modes-chromium/modes-qa.json`, `modes-webkit/modes-qa.json` |
| PvP | ICE/DTLS/SCTP thật qua PeerServer/STUN cục bộ, hai context; bốn viewport; 10 nhóm kiểm tra; `pvp-regression/browser-qa.json` |
| Build / guard / SW | Vite production ở thư mục output mới với cùng config; release guard và `node --check sw.js` đạt; `metrics.json` |
| Cold launch / offline | Ba context mới, tính cả SW precache; cả ba route reload offline được; `initial-load.json` |

Báo chiêu dùng fixture từ `createRpgBattle`/`advanceRpgBattle` rồi nhập qua validator của game; số liệu không được gán trực tiếp vào DOM. Timer cảnh báo của fixture chụp ảnh được kéo dài để kiểm tra pause/layout nhất quán giữa browser. Ca cast riêng rút thời gian hết hạn và quan sát chính engine phát skill/impact. Unit test kiểm tra expiry thật, năng lượng, stun, phase một lần và không thay đổi snapshot khi đọc presentation. Fixtures chỉ dùng trong script QA, không được build vào sản phẩm.

Phạm vi cảnh báo gồm fallback khi hàng trống, boss phase đánh toàn đội, hồi/khiên phía địch và tác động phụ Hard/Extreme. Renderer dùng mục tiêu cuối cùng từ event khi tác động xảy ra. Manifest không làm tám enemy xuất hiện trong pool Auto/TCG; hồi quy hai mode kiểm tra luồng thực vốn có.

PvP kiểm tra tạo/join, từ chối ghế thứ ba và khác mode, pause khi đứt kết nối, reconnect cùng trận, reload giữ phòng, chu kỳ farm/farm/farm/PvP, triệu hồi quân thứ tư, úp/kích hoạt bẫy và giữ bí mật bẫy, rời phòng/rematch/đóng host, bản lưu solo không đổi. Lần reload có một lần reconnect transport chủ động; ghi đúng trong JSON. Không kiểm chứng NAT/TURN production hay hai máy vật lý.

Bộ 60 trận TCG có một lần chạm timeout 20 giây khi nhiều browser chạy song song. Chạy lại toàn bộ sau khi browser kết thúc: **688/688 đạt trong 16,28 giây**, không sửa timeout hay luật game.

## Môi trường và giới hạn

Chromium 153 headless với SwiftShader; WebKit 26.5 headless trên Linux. WebKit được bổ sung thư viện chỉ trong môi trường QA, không thêm dependency sản phẩm. Screenshot/viewport không chứng nhận FPS, GPU hay Safari thực. Dung lượng tải báo body chưa nén (đo bảo thủ), không phải benchmark thời gian mạng.

Nguồn PNG chụp trực tiếp được nén cơ học sang WebP, không sửa bố cục/nội dung. `screenshot-register.json` giữ hash nguồn; thư mục `evidence/` chỉ lưu một tập hình đã xem, các script tái tạo được bộ đầy đủ. `qa/pose-contact.webp` được giữ thêm dưới `evidence/pose-contact.webp`.

Chưa nghiệm thu rig, run/turn nhiều hướng, lip-sync, 116 hero còn thiếu bộ pose mới, 32 enemy ID còn lại, Safari/iPhone/Android yếu thật, PvP khác thiết bị/mạng. `release:rights` vẫn ghi 13 asset cũ chờ chứng cứ; các asset mới có provenance không tự giải quyết việc đó. Xem `ROADMAP_STATUS.md`.
