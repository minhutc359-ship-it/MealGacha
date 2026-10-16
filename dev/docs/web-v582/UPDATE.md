# Web 5.8.2 · Ký ức và hiệu ứng giao ước

- Tuyệt kỹ có chân dung đúng Vị Linh, màu hệ, chuyển cảnh và 20 hình chuyển động theo kỹ năng (19 đang được roster hiện tại sử dụng). Cùng bộ vẽ xuất hiện trong video, khi video lỗi và trên chiến trường khi tắt video. Mỗi Vị Linh giữ tên, bộ kỹ năng và biến thể hạt sáng riêng; không đổi cân bằng chiến đấu.
- Khiên là một màng bong bóng trong suốt có phản sáng và chuyển động. Khi lượng khiên về 0, người mang gục hoặc Che chắn hết hạn, màng tan và tách thành giọt. Sự kiện ghi riêng sát thương hấp thụ và người vừa mất khiên; save cũ tiếp tục đọc được.
- Tám chương Adventure có mở màn, bước ngoặt, đối đầu và hậu truyện. Mạch Vân–Bếp Gốc–Sương Nhạt nối cả tám vùng. Hai lựa chọn cuối chương có lời hồi đáp và xuất hiện ở đầu chương sau. Người chơi đã hoàn thành có thể đọc lại chương; người chơi lại có thể vào trận ngay.
- Bản đồ TCG Chợ Sống dùng minh họa mới `public/assets/tcg/map/living-world-v582.webp`. Ghìm số và danh sách tên chương giúp đọc rõ ở khung 320px, giữ hình vuông và không cắt ảnh. Khóa chương 10–12 vẫn theo trạng thái nội dung hiện có.

## Kiểm tra

`pnpm typecheck`, `pnpm typecheck:dev`, `pnpm test` (53 file / 556 test), `pnpm build`. Browser QA: `dev/tools/verify-web582.mjs`; báo cáo `browser-qa.json`. Các khung kiểm tra là Chromium mô phỏng 320×568, 390×844, 844×390 và 1440×900, không phải thiết bị iOS vật lý.

## Minh họa bản đồ

Dùng built-in imagegen, không dùng API CLI. Ảnh tạo mới, không sử dụng screenshot làm ảnh tham chiếu; screenshot chỉ xác định phần giao diện cần thay. PNG nguồn 1254×1254, chuyển sang WebP quality 90. Runtime: `public/assets/tcg/map/living-world-v582.webp`.

Prompt cuối:

> Use case: stylized-concept. Asset type: square background illustration for Soul of Meal fantasy RPG chapter selection map, region Living Market (Vietnamese culinary memory fantasy). Create a polished illustrated bird's eye / slightly isometric parchment-world map, square 1536x1536 composition, fills the entire frame, no frame. A luminous winding jade river runs from upper middle to lower middle, crossing a lush Vietnamese landscape with terraced tea fields, lotus ponds, tiny tiled roof villages, footbridges, warm lantern-lit market pavilions. Six distinct small landmarks positioned on a readable zigzag journey: market village around (18%,67%), rainy harbor around (33%,25%), communal long table garden around (51%,67%), tea mountain temple around (68%,26%), moon lotus marsh shrine around (80%,67%), distant spice palace around (84%,13%). Keep scenery around these landmark centers low contrast for UI markers later. Palette deep teal, jade, muted sage and warm lantern gold, painterly anime RPG environment, rich hand-painted detail yet readable from phone size. Lighting: golden late afternoon with mist drifting toward the far mountains, inviting adventure, delicate paths linking the landmarks, elegant professional game art. No text, numbers, labels, badges, UI boxes, typography, watermarks, diagrams, geometric placeholder mountains, or characters.
