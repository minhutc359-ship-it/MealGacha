# Bổ sung chuẩn nguồn nhiều sheet — 5.9.5

Kế thừa `../web-v594/CHARACTER_STANDARD.md` và chuẩn starter/chef trước đó. Character ID, renderer, timeline, cache và ngân sách giữ nguyên.

- Khi một sheet 32 pose quá chật, tạo hai sheet 4×4: idle/walk/attack/cast và ultimate/hit/death/victory. Sidecar `rects` chỉ chứa 16 ô thực của nguồn đầu, không cần pose giả để lấp chỗ.
- `actions` chấp nhận một spec cũ hoặc danh sách nhiều spec: `file`, `sourceSize`, `frames`, `rects`, `scale`. Công cụ lấp đủ 32 ô, thay pose chỉ định và dừng nếu thiếu ô. Một scale cho mỗi nguồn đã được hiệu chuẩn bằng pose cùng tư thế; sau đó một scale chung cho cả actor, không fit riêng từng frame.
- Nếu vũ khí tràn ranh giới lưới nhưng ảnh nguồn còn đủ, mở rộng rect và cô lập component actor. Nếu ảnh nguồn đã cắt mất vũ khí, vẽ sửa nguồn; crop không khôi phục được pixel không tồn tại. Xem rõ pose nằm, đuôi, tóc, cánh và đầu gậy trên contact sheet trước khi chốt.
- Model và VFX là hai tài nguyên riêng. Nguồn VFX có thể chia mỗi hàng một nhân vật × ba giai đoạn, rồi transpose về runtime chuẩn bốn cột nhân vật × ba hàng phase. Các mảnh từ ô bên cạnh phải được bỏ khi đăng ký; không thêm effect layer để che lỗi nguồn.
- Quy tắc canon: đọc cả tên catalog, model đang dùng và prompt gốc. Hạc/yến có thể được thiết kế dạng người; không tự thay đầu người bằng đầu thú khi nâng độ chi tiết. Giữ trang bị và silhouette cốt lõi xuyên mode.
- Nghiệm thu: 32 ô actor không rỗng/hash riêng, HD và pixel có pivot chân (0,5; 0,9375), tám trạng thái đúng hàng; portrait riêng đúng ID; contact và SFX thống nhất; reload/double-skip không recast; cue/lease cleanup; kiểm tra ba mode, nhiều viewport, offline và build sạch.
- Giới hạn: tổng build cảnh báo 300 MB, tối đa 320 MB; JS gzip tối đa 675.000 byte, tải ban đầu mục tiêu 8 MB/trần 12 MB, cache ảnh 64 MiB. Không tăng giới hạn để bỏ qua lỗi đăng ký/tải. Thử headless phải ghi rõ cấu hình và không thay benchmark thiết bị thật.

Tài nguyên runtime: `public/assets/characters/rare595/<id>.webp`, `<id>-pixel.webp`, `<id>-portrait.webp`, `ultimate.webp`. Báo cáo, prompt/hash, sidecar và evidence ở `dev/docs/web-v595/`. Giữ phim/atlas cũ còn consumer; chỉ xóa media đã chuyển hoàn toàn sang native.
