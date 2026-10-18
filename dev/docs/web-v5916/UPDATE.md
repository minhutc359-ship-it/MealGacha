# Web 5.9.16 · Đọc manga theo chương

Trước đây mỗi chương có một tranh ghép và thoại nằm ở cột riêng. Bản này mở popup khi chọn chương, dàn thoại vào trang truyện và thêm bốn cảnh có tranh riêng cho mỗi chương.

- **17 chương, 182 trang cơ bản**: TCG 11–16 trang/chương; Adventure 8 trang, thêm trang theo lựa chọn đã lưu. Hai kết thúc TCG và nhánh hậu truyện được dựng đúng save. Chi tiết số trang ở `books.json`.
- **17 sheet Imagegen mới / 68 cảnh**, 1536×1024, WebP tổng **10.526.072 byte**; giữ 19 tranh gốc. Trang đọc có thể tái sử dụng một khung cho các nhóm thoại, không tuyên bố 182 tranh mới.
- Popup có lật trang, đọc cuộn, chọn trang, chữ lớn, phóng to, xem trọn tranh gốc và chuyển chương. Vùng đọc cuộn riêng; ảnh giữ tỷ lệ, chữ không bị ghi cứng vào bitmap hoặc che mặt nhân vật. Tab, Shift+Tab, Escape, Home/End và hai phím mũi tên có xử lý.
- TCG vẫn cần hoàn thành đủ ba màn; Adventure vẫn cần boss ở độ khó thường. Chương khóa không tải JSON/tranh, không hiện tiêu đề nội dung. Không viết vào save khi đọc.
- Kịch bản bổ sung ở `dev/content/manga5916.json`. File từng chương trong `public/assets/manga5916/` được sinh từ module canon và các cảnh mới bằng `dev/tools/build-manga5916.mjs`; `pnpm validate:manga` phát hiện bản sinh bị cũ.
- Gom phần UI ba chế độ với module game dùng chung để tránh lặp từ điển nén. Pixi vẫn tải theo yêu cầu; ngân sách JS giữ 675.000 byte. Không thêm dependency runtime, âm thanh hay video.
- Bổ sung quy tắc Git cho cả hai thư mục manga để bản checkout/deploy nhận WebP thật, không phụ thuộc LFS.

Hướng biên tập, nhịp manh mối và giới hạn canon: `STORY_DIRECTION.md`. Tranh dùng built-in Imagegen, prompt đầy đủ ở `art-prompts.json`; nguồn, hash, reference và khung hiển thị ở `asset-provenance.json`.

Chỉ web. Chủ dự án test thiết bị vật lý, review và quyết định merge; không tự merge.
