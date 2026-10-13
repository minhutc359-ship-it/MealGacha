# Soul of Meal Web 4.9 — phòng PvP giao hữu

Tạo phòng TCG hoặc Auto chess, gửi mã hệ thống cho một người bạn, rồi cả hai bấm Sẵn sàng. Phòng có đúng hai ghế. Thiết bị người tạo phòng giữ toàn bộ trận và tính luật chơi; máy báo hiệu chỉ chuyển SDP/ICE để hai thiết bị mở kênh WebRTC. Không cần tài khoản, camera hoặc micro.

## Luật và giao diện

- TCG: mỗi người dùng bộ đang trang bị gồm 24 lá, tối đa 2 bản mỗi thẻ; 4 quân và 1 ô bẫy. Hai bên khởi đầu 34 máu, đi trước được chọn bằng seed của chủ phòng. Không chạy AI khi kết thúc lượt. Người giữ bẫy tự chọn Kích hoạt hoặc Giữ.
- Bài trên tay của đối thủ, thứ tự rút và bẫy úp được che trước khi gửi snapshot, gồm mọi trạng thái trước/sau animation. Bẫy đã lật công khai được hiển thị đủ 2.25 giây. Cập nhật trạng thái kết nối/thời gian chờ không khởi động lại animation hay phát lại âm thanh.
- Auto chess: hai người khởi đầu cùng đội hình, cửa hàng, 10 vàng và 100 ý chí. Chu kỳ lặp lại: 3 vòng đánh quái → 1 vòng đối đầu đội hình thật của bạn. Cả hai cùng sẵn sàng trước mỗi trận và trước vòng tiếp.
- Farm: nhận 5 vàng + 1 nếu thắng + lãi tối đa 3, thêm 2 XP; thắng nhận một mảnh trang bị. Thua quái không mất ý chí. PvP: bên thua mất 10 + 2 × số quân địch còn sống, tối đa 25; hòa không mất ý chí. Hết ý chí thì thua trận.
- Dùng chung canvas, nhân vật, animation, âm thanh và màn hình bài hiện có. Không thêm thư viện chạy trong sản phẩm hoặc media. Giao diện phòng và thao tác chính nằm trong màn hình; vùng túi/chi tiết có cuộn riêng nếu cần.

## Kết nối, dữ liệu và giới hạn

Khách mất mạng giữ ghế bằng mã nối lại trong sessionStorage của tab. Trận tạm dừng; khách có thể nối lại hoặc tải lại cùng tab rồi chọn Nối lại phòng trước. Chủ phòng chuyển tab sẽ tạm dừng mô phỏng. Chủ phòng phải giữ tab mở: tải lại/đóng tab này mất phòng. Khách chủ động rời trận sẽ nhường trận và giải phóng ghế; chủ phòng có thể mở trận mới và mời người khác.

Phòng dùng kinh tế riêng trong bộ nhớ. Không ghi trận vào bản lưu chơi đơn, không trao phần thưởng tài khoản, không gửi toàn bộ bản lưu/ảnh/vị trí. Chủ phòng nắm trạng thái đầy đủ, kể cả bài/bẫy; đây là trận giao hữu, không phải hệ thống xếp hạng chống gian lận. Chính sách quyền riêng tư và trang tĩnh đã mô tả đúng dữ liệu báo hiệu/STUN và bộ bài truyền trực tiếp.

Mặc định dùng PeerServer Cloud và Google STUN. Một số mạng NAT/firewall cần TURN do người vận hành cấu hình. Không cam kết kết nối trên mọi mạng; chưa kiểm tra mạng chéo, Safari hoặc hiệu năng thiết bị thật. Có thông báo khi không nối được trực tiếp sau 25 giây.

## Cấu hình tùy chọn cho người vận hành

Vite đọc cấu hình công khai khi build:

```dotenv
VITE_PVP_SIGNAL_URL=wss://your-signal.example/som/peerjs
VITE_PVP_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]
```

Nếu cần TURN, dùng credential ngắn hạn và cấu hình quy trình cấp credential của dịch vụ triển khai. Không commit thông tin bí mật; mọi biến `VITE_` đều có thể đọc trong trình duyệt. PeerServer tự quản phải dùng TLS, tắt discovery và giữ cùng đường dẫn/key `peerjs` theo adapter. Hạ tầng trả phí không được tạo trong cập nhật này.

Tài liệu giao thức gốc: [PeerServer](https://peerjs.com/server/getting-started), [Cloud](https://peerjs.com/server/cloud), [PeerJS socket](https://github.com/peers/peerjs/blob/master/lib/socket.ts). Adapter native sử dụng thông điệp OFFER/ANSWER/CANDIDATE; không chép hoặc đóng gói thư viện PeerJS vào web.

## Xác minh

- 472 kiểm thử trong 45 file; typecheck ứng dụng và dev; catalog/asset/release registry; build sản xuất và kiểm tra dung lượng.
- 16 kiểm thử PvP: quyền theo lượt, mã/ghế phòng, bộ bài 24 lá, dedup/revision, bẫy của cả hai bên, che mọi frame, chặn phép, cooldown, đội hình/sao/đồ thật, mua đồng thời, hai chu kỳ 3+1, khóa sẵn sàng, nhường trận và rematch.
- `browser-qa.json`: hai context Chromium độc lập kết nối qua native ICE/DTLS/SCTP tại 1440×900, 390×844, 844×390 và 320×568; không lỗi console hoặc asset thiếu. Có chứng cứ từ chối ghế thứ ba/sai chế độ, nối lại đúng trận, khách tải lại tab, manual end-turn và bản lưu chơi đơn giữ nguyên.
- Thử bẫy qua UI: triệu hồi quân thứ tư, úp bẫy có animation và âm thanh một lần, địch tấn công, chủ bẫy tự kích hoạt, đo thời gian reveal bằng MutationObserver trên cả hai thiết bị. Kiểm tra rời khách/nhường trận, mời lại và thông báo đóng phòng.
- Kết nối QA dùng PeerServer chính thức `peer@1.0.2` chỉ trong thư mục QA và STUN loopback để vượt giới hạn liệt kê NIC của container. Đây là kênh WebRTC thật; không thay transport bằng mock. Vòng Auto chess được tăng tốc bằng engine sau khi quan sát tick thời gian thực, không phải benchmark FPS.

Lặp lại QA với Playwright, Chromium và gói `peer` nằm ngoài dependency sản phẩm: `node dev/tools/verify-pvp490.mjs`. Đường dẫn có thể cấu hình bằng `PVP_QA_MODULES`, `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`. Script dùng cổng 4192–4194 và cấu hình dev tắt HMR để không làm mất host khi ghi tài liệu phát hành. Hook `window.__session` chỉ được script QA gắn qua evaluate; không có trong bundle sản xuất.

Bản 4.9 kế thừa Web 4.8 trong PR #39 (bẫy, bộ bài đồng bộ, hai atlas Adventure mới). Không merge tự động, không sửa hoặc build Android/iOS. `visual-budget.json` giữ phần ngân sách còn lại của 5 MB đã duyệt; không tăng hạn mức JS 650 KB.
