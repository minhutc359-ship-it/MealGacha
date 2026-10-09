# Soul of Meal 3.3 · Vị Linh vào trận

Game ẩm thực và ký ức Việt Nam gồm **TCG**, **Chợ Đêm Auto chess** và **Rương vị giác**, chạy trên React 19 / Vite 8 / TypeScript. Không cần tài khoản; có mã MGC1 để chuyển tiến trình giữa thiết bị.

TCG có 163 thẻ, 6 chương/18 màn, xây bộ bài, AI, thám hiểm, chế tạo và nhiệm vụ. Auto chess có 32 quân, 10 quái/4 boss, chiến dịch, Survival, Daily, shop/pool hữu hạn, ghép sao, hệ/nghề/di vật, XP và kéo thả bàn/dự bị. Rương dùng catalog chung 123 món và tìm quán từ OpenStreetMap không cần API key. Model anime 2.5D dùng chung hai chế độ; không phải rig 3D chạy trực tiếp.

Bản 3.3 thêm niệm phép, đạn có hình lửa/nước/lá/tinh quang, vệt chém cong, khiên và sóng va chạm. VFX đọc sự kiện thực của trận, dùng cùng bộ renderer ở TCG/Auto chess, giữ reduced motion/preset nhẹ. Đồng bộ âm thanh và pose chịu đòn TCG tại mốc tiếp xúc. Giữ mức thử thách +30%, EXP, đội hình và save từ 3.2.2.

## Chạy và kiểm tra

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm validate:catalog
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
