# Kiểm chứng Web 5.9.17

## Tự động

- **765/765 Vitest trong 73 file** đạt, gồm test manifest model mới, portrait canon, resolver TCG/Adventure/Auto Chess, đủ năm cột VFX của nhóm khởi đầu và chính sách fallback theo hệ.
- TypeScript app/dev đạt.
- Inspector giải mã tám atlas cuối: **4 actor, 128 pose vật lý, 8 file**, 32 frame khác nhau mỗi actor, alpha/gutter/pivot và hash provenance hợp lệ.
- Model audit: 61/139 Vị Linh có 32 pose; Auto Chess 44/44 model độc lập, 38 model 32 pose và 4 legacy atlas ID.
- Test VFX khóa các hồi quy: slash/projectile/cast Auto Chess lấy đúng ô atlas theo hệ cho mọi model, mọi impact đồng thời dùng atlas, geometry chỉ chạy khi asset lỗi; Reduced Motion không lọc mất cue, atlas VFX riêng dùng đúng cột và Adventure không quay lại hình học toàn sân.
- Catalog 123 món, 133 asset tham chiếu, web-budget guard và release records đạt; 726 asset được đăng ký nguồn gốc. Danh sách 13 asset cũ còn chờ bằng chứng thương mại không tăng trong đợt này.
- Build production đạt **156.768.380 byte / 796 file**; JS gzip **672.420 / 675.000 byte**, CSS gzip 104.404 byte. Release guard không phát hiện source, map, archive hoặc credential.

## Phạm vi cần nghiệm thu thiết bị

- Bốn Vị Linh mới: idle/walk/attack/cast/ultimate/hit/fall/victory không nhảy identity, không cắt cánh/thương/nón và đặt chân đúng mặt sàn.
- Auto Chess: đòn xa có projectile atlas + impact atlas đúng hệ; đòn gần có slash atlas + impact atlas; đội hình đông không đổi các impact sau hiệu ứng thứ tư thành hình học.
- Adventure: attack/primary/support/ultimate vẫn có VFX theo hệ ở chế độ thường và Reduced Motion; cả năm Vị Linh khởi đầu dùng atlas thật cho skill, tuyệt kỹ Bách không còn “lồng” hình học lớn che nhân vật và khiên nằm sau model.
- TCG: model đúng ID, pose attack/hit/fall chạy theo snapshot đã commit; gameplay và hit timing không đổi.

Workspace không có Playwright browser binary cục bộ; CI/preview và nghiệm thu Safari/iPhone vật lý vẫn là bước bắt buộc.
