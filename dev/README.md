# Phần phát triển — không phân phối trong game

Mọi tài liệu thiết kế, prompt, ảnh kiểm chứng, test, script tạo asset, công cụ sửa nội dung và file nền tảng cũ được gom ở đây. `.vercelignore` loại `dev/` khỏi upload CLI; Vite chỉ đưa `public/` và module runtime vào `dist/`, kể cả khi build từ GitHub vẫn có toàn bộ repo.

| Thư mục | Nội dung |
| --- | --- |
| `docs/` | Thiết kế, lịch sử, bằng chứng asset, benchmark, kế hoạch mobile và đánh giá release |
| `tests/` | Test domain, game, audio, catalog, storage và presentation |
| `tools/` | Tạo sprite/nhạc, kiểm kê quyền, đo dung lượng, đóng gói và benchmark |
| `components/` | Bảng sửa nội dung chỉ chạy ở development |
| `references/` | Bản spec/tham chiếu nhập từ công cụ thiết kế |
| `platform/` | Script Figma Make và cấu hình toolchain lịch sử |
| `archive/` | File đã thay thế, audio/banner chờ bằng chứng giấy phép |

`pnpm dev` dùng `vite.dev.config.ts` và endpoint viết nội dung chỉ có trên server phát triển. `pnpm build` dùng cấu hình root độc lập, không import file trong `dev/`. `pnpm test` dùng `vitest.config.ts`; `pnpm typecheck:dev` kiểm tra cả công cụ và component phát triển.

Giữ thư mục này trong Git để không mất prompt, lịch sử và test. Chỉ exclude ở bước đóng gói/deploy, không cần thêm `dev/` vào `.gitignore`. Bản nguồn dùng để bán app nên bàn giao cả hồ sơ bằng chứng ở đây dù chúng không nằm trong game cài đặt.

## Nghiên cứu bản nâng cấp tiếp theo

[Soul of Meal 4.0 — Chợ Ký Ức Sống](docs/major-v400/PROPOSAL.md) đề xuất đồ họa 2.5D, gameplay TCG/Auto chess, âm thanh và VFX dựa trên `master` 3.5.0. [Kế hoạch kỹ thuật](docs/major-v400/TECHNICAL_PLAN.md), [roadmap và nghiệm thu](docs/major-v400/ROADMAP.md), [audit/nguồn/số đo](docs/major-v400/AUDIT.json) nằm cùng thư mục. Đây là thiết kế để review, chưa có thay đổi runtime hoặc bản phát hành 4.0.

Các tài liệu cũ có thể nhắc đường dẫn `scripts/` hoặc `docs/` trước 3.3. Chúng nay lần lượt là `dev/tools/` và `dev/docs/`. `vite.legacy.config.ts` là bản tham khảo không còn dùng; `platform/` chưa được chuyển thành một tích hợp Figma Make mới.
