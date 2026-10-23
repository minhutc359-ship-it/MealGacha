# Vân — thử kit hybrid

AW2-007K · source `3a77154bdbf1eb8a654833c3f5354889b5377a1c` · development, chưa phải cân bằng cuối hoặc nghiệm thu nhân vật đầy đủ.

Chạy `pnpm dev`, mở `/dev/aw2/battle.html?team=van`. Đội tạm có năm người, thay Mộc Non bằng Vân; không nhận nhân vật hoặc ghi save. Có thể chọn nhấn Bảo hộ/Tấn công cho **trận mới** rồi bấm **Tạo lại trận**. Nhấn đang dùng luôn hiện riêng, cố định suốt trận; URL `&emphasis=attack` khởi tạo nhấn tấn công. Cấp thử nghiệm1/5/10/20 chỉ áp dụng khi tạo lại.

- **Mảnh Âm:** một đạn thường, tác động sau hai nhịp; không tự hồi máu hoặc đặt dấu.
- **Nối Hai Đầu:** bảo vệ một đồng minh trong24 đang có đòn/vùng/cast/boss intent đe dọa, đồng thời nối một địch không miễn debuff trong tầm38. Hai nửa chọn riêng, khóa mục tiêu trước cam kết và kiểm tra lại độc lập; không đổi sang người khác. Ưu tiên số đe dọa, tỷ lệ HP, khoảng cách, slot/ID. Khiên round(.55ATK+8)/4nhịp dùng trần45%maxHP; dấu4nhịp giảm công10%, lấy mức giảm mạnh nhất cùng Muối/weaken, không nhân chồng.
- **Nhớ Một Phần:** dấu hết hạn, địch mang dấu gục hoặc bị tẩy chỉ có thể hồi người đã thực nhận khiên. Hồi tối đa min(round(.25ATK+4), lượng khiên thực cấp, HP thiếu), cần người nhận còn sống/trong24 và hồi chiêu8nhịp sẵn sàng. Không có khiên thực, không có hồi máu. Thay dấu/nguồn gục/kết trận hủy không hồi; không tạo vòng lặp, năng lượng hoặc khiên mới.
- **Bữa Ăn Chưa Gọi Tên:** cùng một slot/100năng lượng/hai nhịp chuẩn bị. Nhấn Bảo hộ cấp round(.8ATK+12) khiên/5nhịp cho đồng minh sống không triệu hồi trong24 gồm bản thân. Nhấn Tấn công cần địch được chọn còn trong tầm ở cả lúc yêu cầu/cam kết; một vùng0.9ATK/bán kính8/tối đa3địch, không bảo hộ. Không đổi mục tiêu hoặc nhấn giữa trận; ngắt trước cam kết vẫn mất năng lượng và không nhận kết quả.

Dùng Tạm dừng/Bước1nhịp để quan sát state và sự kiện thật. Đối thủ ngắt Vân hoặc tẩy dấu trên địch đang chọn qua luật core; tẩy dấu có thể cho hồi máu đã kiếm được, không tự sinh lợi ích. Âm thanh mặc định tắt; chỉ kết quả đã xác nhận dùng atlas/cue riêng. Khiên đầy không nhận thêm hoặc kéo dài từ một lần cấp0. Dấu, lá chắn, hồi máu và các nhấn dùng dữ liệu chiến đấu; renderer không quyết định luật.

aw2-van/UR/Bữa ăn thất lạc/Hybrid và bốn tên kỹ năng giữ canon. Không xác nhận Vân là người mất tích. Tham chiếu004P được tái dùng, không có lần tạo hình/âm thanh mới. Collection/đội lưu ngoài starter, art độc lập/listening/thiết bị/rights và full DoD còn mở. [Task](tasks/AW2-007K.md), [bằng chứng](evidence/AW2-007K.md).
