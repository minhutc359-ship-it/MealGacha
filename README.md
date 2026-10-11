# Soul of Meal 4.1.0 · Chợ lên đèn

Game ẩm thực và ký ức Việt Nam gồm **TCG**, **Chợ Đêm Auto chess** và **Rương vị giác**, chạy trên React 19 / Vite 8 / TypeScript. Không cần tài khoản; có mã MGC1 để chuyển tiến trình giữa thiết bị.

Bản 4.1 chỉ cập nhật web: ngân sách tổng build 100 MB, 9 chủ đề nhạc dài trong hai phong cách và stem riêng cho ba vùng; nhạc dài phát streaming. Thêm bàn tập TCG/Auto độc lập save, gợi ý sau trận từ số liệu thực, không khí mưa/đèn/hơi bếp và cải thiện độ đọc thẻ. Web có cache offline theo tài nguyên đã dùng, cập nhật thủ công trong Cài đặt và xuất dữ liệu gốc khi giao diện lỗi. Android CI chỉ chạy thủ công; không sync/build native trong đợt này. Bản đồ vẫn truy cập nhanh chương 7–9, chương 10–12 Coming soon. Xem [chi tiết và kiểm chứng 4.1](dev/docs/web-v410/UPDATE.md).

TCG có 171 thẻ, 9 chương/27 màn, xây bộ bài, AI, thám hiểm, chế tạo và nhiệm vụ. Auto chess có 44 quân, 16 quái/đối thủ thường và 8 boss, chiến dịch, Survival, Daily, shop/pool hữu hạn, ghép sao, hệ/nghề/di vật, XP và kéo thả bàn/dự bị. Rương dùng catalog chung 123 món và tìm quán từ OpenStreetMap không cần API key. Model anime 2.5D dùng chung hai chế độ; không phải rig 3D chạy trực tiếp.

Bản 4.0 thêm Nêm vị/Ủ vị, 8 thẻ nhận qua gói khởi hành tự nguyện, 3 chương tiếp nối đúng hai kết thúc cũ, 4 sự kiện/4 di vật thám hiểm, chiến dịch Auto 18 đợt và 6 nâng cấp mới. Có 3 nền mới, 12 bản nhạc nguyên gốc, profile chuyển động và bảng đóng góp thực tế. Ghi save có journal/checkpoint và giao diện phục hồi; trận đang chơi giữ luật cũ. Xem [triển khai và giới hạn QA 4.0](dev/docs/major-v400/IMPLEMENTATION.md).

Bản 3.5.0 phân hóa nội tại quân và phép TCG, thêm hy sinh/tái triệu hồi/đóng băng, 6 combo công thức và 7 gợi ý bộ bài. Auto chess có VFX niệm phép, đòn diện rộng, khiên, hiệu ứng tan biến, nhạc chiến đấu/boss mới trong hai phong cách và ảnh RPG cho cả 9 trang bị. Cửa hàng luôn hiện nghề cạnh hệ. Survival bắt đầu với **3 ý chí**, thua mất 1 và chơi lại đúng đợt; thắng không hồi. Chiến dịch giữ 100 ý chí và mức trừ theo địch còn sống; còn ý chí thì chơi lại cùng đợt. Daily vẫn kết thúc ở lần thua đầu. Điểm/kỷ lục chỉ chốt khi lượt kết thúc. Xem [thay đổi và kiểm chứng](dev/docs/depth-v350/UPDATE.md).

Cơ chế tăng tốc ×3 sau giây 55 từ 3.4.1 được giữ; trận tiếp tục đến khi phân thắng thua. Các phiên đã kết thúc từ bản cũ và kỷ lục cũ không bị mở lại.

Bản 3.3 thêm niệm phép, đạn có hình lửa/nước/lá/tinh quang, vệt chém cong, khiên và sóng va chạm. VFX đọc sự kiện thực của trận, dùng cùng bộ renderer ở TCG/Auto chess, giữ reduced motion/preset nhẹ. Đồng bộ âm thanh và pose chịu đòn TCG tại mốc tiếp xúc. Giữ mức thử thách +30%, EXP, đội hình và save từ 3.2.2.

Bản 3.4 mở cấp 9, bàn tối đa 9 quân và đúng 9 ô dự bị; mua không tự chọn quân, dự bị đầy vẫn mua được bản đủ ghép sao. Mobile dùng kéo thả để xếp/bán, giữ 0,3 giây để xem nhanh rồi thả để đóng. Thêm 3 mảnh đồ, 6 công thức ghép, kéo trang bị có xem trước; HUD hệ bên trái, màu hệ, giá 1–5 vàng, ví vàng và XP ngay trong shop. Có nút ẩn/hiện shop và tùy chọn rung khi lên sao trên trình duyệt hỗ trợ. Giao diện vừa khung mobile dọc/ngang; save và mã MGC1 cũ tiếp tục được. Xem [chi tiết và kiểm chứng 3.4](dev/docs/market-v340/UPDATE.md).

Bản 3.3.1 sửa vị trí lá bị hạ trong TCG; thêm phím **W/E/F/D**, shop đánh dấu quân đã có/đủ ghép, hiệu ứng thức tỉnh và kích thước +7% mỗi sao. Có 20 nhân vật mới với 140 pose trong 5 atlas WebP; 12 linh vị món Việt dùng chung model ở TCG. Phiên cũ giữ pool và seed đã lưu; phiên mới 3.4 dùng luật 4. Xem [thay đổi 3.3.1](dev/docs/market-v331/UPDATE.md).

## Chạy và kiểm tra

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm validate:catalog
pnpm validate:assets
pnpm release:verify
pnpm build
pnpm preview
```

Node 22.21+ hoặc Node 24; pnpm theo `packageManager`. `pnpm dev` mở công cụ biên tập chỉ trong môi trường phát triển. `pnpm build` không phụ thuộc thư mục `dev/`. `.env.example` là cấu hình tùy chọn, không chứa key thật; mặc định bản game/tìm quán chạy không cần backend hoặc API key.

## Bản phát hành

| Phần | Nơi lưu |
| --- | --- |
| Runtime/source | `src/`, `public/`, cấu hình root và lockfile |
| Chính sách/pháp lý sản phẩm | `LICENSE`, `THIRD_PARTY_NOTICES.md`, `rights/`, `public/legal/` |
| Toàn bộ phần phát triển | `dev/`: docs/prompt, test, script, component biên tập, tham chiếu, nền tảng cũ, archive |
| Web đã build | `dist/`, chỉ file cần phục vụ game; không có prompt/test/archive |
| ZIP đóng gói | `dev/artifacts/`, tạo tại máy và được Git ignore |

```sh
pnpm release:records  # cập nhật notices, HTML chính sách, fingerprints sau khi đổi asset/dependency
pnpm release:verify   # kiểm tra hồ sơ đã khớp nguồn hiện tại
pnpm build
pnpm release:size     # báo dung lượng và chặn file dev/archived audio lọt vào dist
pnpm release:source   # ZIP nguồn sản phẩm, loại dev/, node_modules/, .git và secrets
pnpm release:web      # ZIP website đã build
```

ZIP source vẫn build được sau khi bỏ hoàn toàn `dev/`; muốn chạy test/tạo lại asset/biên tập nội dung cần full repository. Khi bán mã nguồn, bàn giao thêm hồ sơ bằng chứng và quyền trong `dev/docs/`, dù không đóng gói chúng vào app cài đặt.

Vercel dùng `vercel.json`: build `pnpm build`, output `dist`, SPA fallback và URL chính sách độc lập. `.vercelignore` loại công cụ/archive khỏi upload CLI; Git integration vẫn checkout repo nhưng chỉ phân phối `dist`. Asset công khai chưa đổi tên theo hash dùng cache ngắn để tránh giữ ảnh/nhạc cũ sau update. Commercial hosting cần gói phù hợp với điều khoản Vercel.

## Quyền sử dụng và mobile

Có điều khoản, quyền riêng tư và ghi công trong cài đặt/hướng dẫn cả ba chế độ. URL đọc trong app `/legal/terms`, `/legal/privacy`, `/legal/rights`; HTML không cần JavaScript ở cùng đường dẫn thêm `.html`. Notices phân phối ở `/legal/THIRD_PARTY_LICENSES.txt` và `/legal/APP_LICENSE.txt`.

Không tuyên bố “không có bản quyền”, CC0 hoặc bảo đảm không xâm phạm. Thư viện giữ giấy phép; GSAP dùng Standard License. 6 MP3/2 banner chưa có bằng chứng giấy phép được giữ ngoài release trong `dev/archive/`, thay âm thanh Rương bằng cue synth nguyên bản. Hồ sơ ghi nguồn và SHA-256 tài nguyên; chủ sở hữu cần hoàn thiện danh tính/liên hệ và xác minh quyền trước giao dịch thương mại.

- [Hồ sơ phát hành thương mại](rights/COMMERCIAL_RELEASE.md)
- [Đánh giá Vercel và dung lượng](dev/docs/release/VERCEL_AND_SIZE.md)
- [Kế hoạch iOS/Android chi tiết](dev/docs/release/MOBILE_PLAN.md): Capacitor, bundled offline game, native save/audio/lifecycle, QA và store; chưa tạo IPA/AAB.
- [Kiểm chứng 3.3 và ảnh trận](dev/docs/release/VERIFICATION.md)
- [Cấu trúc dev](dev/README.md), [lịch sử trước 3.3](dev/docs/HISTORY_BEFORE_33.md), [thay đổi 3.2.2](dev/docs/challenge-v322/VERIFICATION.md)

Bản hiện tại chơi với AI, không có PvP, giao dịch người chơi, quảng cáo, IAP hay đồng bộ tài khoản. Browser QA dùng Chromium; Safari/WKWebView và Android native cần được thử trên máy thật theo kế hoạch mobile.
