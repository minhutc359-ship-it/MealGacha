# Web 5.9.15 — Manga Ký Ức TCG và Adventure

Đợt này thêm hai tập manga diễn giải đúng cốt truyện đang chạy trong game. **Tập I · Bàn Ký Ức** có chín chương TCG; **Tập II · Tám Hương Ấn** có tám chương Adventure. Hai bìa luôn mở, còn 17 trang truyện chỉ mở khi người chơi hoàn thành chương tương ứng.

## Nội dung và mở khóa

- TCG mở một trang khi đủ cả ba stage của chương trong `clearedStages`; chương cuối còn hiển thị đúng kết thúc `remember` hoặc `release` của save.
- Adventure mở một trang khi boss stage 6 của map có sao; kết quả lựa chọn trên trang lấy đúng nhánh đã lưu trong `choices`.
- Trang khóa không mount thẻ `img`, nên không tải tranh và không tiết lộ tiêu đề/nội dung chương.
- Hội thoại, lời dẫn và nhánh truyện được dựng trực tiếp từ module canon. Tranh không chứa chữ sinh sẵn, tránh sai tiếng Việt hoặc lệch bản truyện trong code.
- Không đổi ID stage, gameplay, phần thưởng, schema hay dữ liệu save. Người chơi cũ mở ngay các trang đã đủ điều kiện.

## Tranh và giao diện

- Built-in Imagegen tạo **19 tranh WebP 1086×1448**: hai bìa và 17 trang năm khung, nét mực đen trắng với điểm nhấn ký ức màu vàng nhạt.
- Tổng asset mới **10.137.088 byte**. Mỗi trang có hash, nguồn cốt truyện, reference nhận diện và chính sách prompt trong `asset-provenance.json`.
- TCG có mục `Manga ký ức` trong điều hướng. Adventure có `Nhà Truyện Ký Ức` tại làng. Giao diện một cột trên mobile, hai cột trên desktop; hội thoại dài chia theo từng nhịp truyện có thể mở/thu.
- Toàn bộ 19 tranh đã được xem trên contact sheet; inspector xác nhận kích thước, định dạng, giải mã và hash.

Đối chiếu từng chương ở `STORY_MAPPING.md`. Chủ dự án test thiết bị vật lý, review và quyết định merge; nhánh/PR không tự merge.
