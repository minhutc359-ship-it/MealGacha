# Kiểm chứng Web 5.9.16

## Nội dung và dữ liệu

- **754/754 Vitest trong 70 file**, bốn Node guard, typecheck app/dev đạt. Sáu test mới kiểm tra đủ trang cho 17 chương, mọi câu thoại canon theo đúng thứ tự, hai kết thúc TCG, sáu quyết định hậu truyện, hai nhánh của cả tám vùng Adventure, nhãn người nói và điều kiện mở khóa.
- Bản sinh JSON khớp nguồn: `pnpm validate:manga`. **182 trang cơ bản**, TCG 11–16 trang/chương, Adventure tám trang trước hậu quả lựa chọn. Chọn nhánh tương ứng thêm các trang riêng; không đưa hai kết thúc vào cùng một bản đọc.
- Cảnh bổ sung về Liên được đặt sau lời thú nhận của Bách ở màn hai. Giữ riêng tuyến Mai và tuyến Vân, không hồi sinh Mai, không chọn hộ kết thúc hay ép Vân quay về.
- Không thay save schema, gameplay, chỉ số, collection, phần thưởng hoặc dữ liệu sở hữu. Đọc truyện trong production xác nhận chuỗi JSON save trước/sau không thay đổi.

## Tranh

- **17/17 sheet mới**, 1536×1024, tổng **10.526.072 byte**, 68 cảnh. Giải mã, kích thước, nguồn, hash và reference được ghi trong `asset-provenance.json`; tất cả prompt ở `art-prompts.json`.
- Bộ 19 tranh cũ giữ nguyên. Bản đọc tách khung theo ranh tranh; các trang nhiều thoại có thể dùng lại khung. Các panel chéo được lấy đủ bounding box. Chế độ Tranh gốc luôn hiển thị toàn ảnh, giữ tỷ lệ.
- Đo ranh thật của grid mới thay vì chia cứng 50%: một số sheet có hàng đầu thấp hơn nửa ảnh. Không vẽ lại hoặc cắt mất phần đầu của hàng kế tiếp.
- Đăng ký **718 asset** và kiểm tra catalog/asset/release-records đạt. File manga được checkout thành WebP thật, không cần tải Git LFS riêng.

## Trình duyệt

Chromium headless **153.0.8010.0**: **26 ca** ở `browser-qa.json`, gồm tám lượt đọc tại 320×568, 390×844, 844×390, 1440×900; giải mã hai sheet của từng chương; và lỗi fetch → Thử lại → phục hồi. Không lỗi JS hoặc response ảnh lỗi trong các lượt hoàn tất.

- Chương khóa không phát request JSON/tranh. Mở chương hiện native modal; header, toolbar và điều khiển nằm trong viewport, vùng nội dung cuộn riêng.
- Lật/chọn trang, Home/End, chữ lớn, phóng to, toàn bộ tranh gốc, đọc cuộn tới cuối, Tab/Shift+Tab, Escape và chuyển chương đạt. Đóng sau chuyển chương trả focus về nút đã mở truyện.
- Tỷ lệ SVG và tỷ lệ tự nhiên của ảnh gốc được kiểm tra; mặc định không tràn ngang. Chữ đặt trong balloon của trang, nằm ngoài vùng khuôn mặt trong tranh.
- Ảnh kiểm chứng tám viewport/mode ở `evidence/`.

Production: **ba ca** ở `production-qa.json`: vào Manga ký ức từ TCG, vào Đọc manga từ làng Adventure, và mở Auto Chess sau thay đổi cách gom chunk. Adventure kiểm trên viewport điện thoại, cuộn được danh sách tới chương cuối trong shell, hiện đúng nhánh lựa chọn 1. TCG/Adventure giữ nguyên save trước/sau đọc. Cả ba không có lỗi JS/asset.

## Build và tải đầu

- Build sạch **153.976.068 byte / 788 file**; JS gzip **673.095 / 675.000 byte**; CSS gzip **104.402 byte**. Không tăng ngân sách, không thêm dependency runtime hoặc video. Release guard và cú pháp service worker đạt.
- `initial-load.json` đo ba route bằng context mới, gồm cài/warm service worker và body HTTP chưa nén: khoảng **3,21–4,38 MB**, dưới mục tiêu tám MB. Cả ba reload offline được, không request MP4.
- Nội dung chương là JSON tĩnh tải khi đọc; không đưa mọi nhánh thoại manga vào JS khởi động. Mỗi chương chỉ dùng hai sheet dùng chung cho các trang, không tải một bitmap riêng cho mỗi câu thoại.

Kiểm tra này chạy bằng trình duyệt headless. Test Safari/iPhone, cảm giác đọc trên thiết bị vật lý và review/merge do chủ dự án thực hiện theo yêu cầu đã có. Không coi các kết quả này là nghiệm thu thiết bị thật.
