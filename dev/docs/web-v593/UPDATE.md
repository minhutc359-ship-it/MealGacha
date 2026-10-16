# Web 5.9.3 — năm đầu bếp

Đợt sản xuất P1 tiếp nối PR #54, theo `web-v591/PLAN_SOURCE.md`. Không thay năm starter trong save, chỉ số, bộ kỹ năng, sát thương, phần thưởng hay điều kiện mở khóa. Chưa tự merge chuỗi PR.

## Nhận diện

Lấy chân dung truyện đang dùng làm nguồn nhận diện. Các bộ chibi cũ và ảnh trong atlas Spirit 5.1 có sai khác về tóc, giới tính và trang phục; chúng không còn quyết định ngoại hình năm đầu bếp trong trận. Giữ tranh truyện và tranh thẻ đã phù hợp.

| ID | Nhận diện xuyên chế độ | Chuyển động / VFX riêng |
| --- | --- | --- |
| chef-bach | Bách trưởng thành, tóc điểm bạc, ria và râu ngắn, áo ngà, tạp dề đỏ nâu, sách công thức | Bước nặng, muôi và khiên mâm; sách mở thành bàn/lũy bảo vệ |
| chef-nhien | Nhiên tóc bob tối, khăn đỏ, đồ lao động xanh đậm, chảo | Bước nhanh, vung và hất chảo; cung lửa phượng và nguyên liệu |
| chef-moc | Mộc bím tóc dài, áo xanh lá, tạp dề ngà, chậu mầm và gậy rễ | Dẫn mầm, dựng rễ; vòm rễ ôm chồi xanh |
| chef-hai | Hải tóc nâu, áo đầu bếp xanh xám, đai xanh, bát và muôi | Động tác chính xác, quét dòng nước; thủy ấn và sóng quanh bát |
| chef-lien | Liên tóc bob có mái, áo ngà, tạp dề đỏ, đèn sao | Xoay và đưa đèn, dải lụa; đèn sao năm cánh dệt ánh sáng |

## Gói tài nguyên thực tế

42 tệp WebP mới trong `public/assets/characters/chefs593/`, tổng **4.599.754 byte**, gồm **425 ô/ảnh không rỗng, hash riêng**:

- 5 atlas HD 1024×2048: 160 tư thế, 256 px/ô, 4 cột × 8 hàng.
- 5 atlas chiến đấu Adventure 256×512: 160 tư thế 64 px/ô, lấy nearest từ HD. Đây là biến thể độ phân giải pixel, không phải 160 tư thế pixel vẽ lại bằng tay.
- `exploration.webp` 768×320: 60 hình pixel được tạo riêng, năm nhân vật × bốn hướng × ba bước.
- 30 ảnh biểu cảm 256×256: neutral, joy, resolve, concern, surprise, tender cho mỗi đầu bếp. Mỗi ảnh là một tệp để chỉ tải biểu cảm được dùng.
- `ultimate.webp` 1280×768: 15 khung, năm cột nhận diện × ba hàng casting/impact/finisher.
- 5 MP3 có sẵn được căn lại điểm nhấn ở 0,96 giây; không thêm bản sao âm thanh.

Prompt đầy đủ, công cụ built-in Imagegen, nguồn và đường dẫn ảnh tạo nằm trong `artwork.json` / `support-artwork.json`; crop đo thực tế trong năm tệp `.cells.json`; hash, kích thước và dung lượng từng tài nguyên trong `asset-qa.json`. Python chỉ đăng ký ô, crop alpha, đổi kích thước và nén, không vẽ nhân vật thay thế.

## Tích hợp

- `characterVisuals.ts`: thêm năm đầu bếp vào manifest chung, giữ nguyên năm starter và alias Gỏi cuốn. Mỗi đầu bếp có nhịp idle/walk/attack/cast, điểm neo, chân dung, VFX, âm thanh và timeline.
- Adventure dùng atlas 64 px, Auto Chess/TCG dùng atlas 256 px; cả ba giải cùng ID thành cùng nhân vật. TCG giữ artwork thẻ gốc phù hợp với chân dung truyện.
- Bách trong làng dùng atlas khám phá pixel mới, giữ nguyên vị trí, đường đi, đối thoại và chức năng NPC. Bốn đầu bếp còn lại đã có biến thể đi bốn hướng và API `VillageWalker`, không tự thêm NPC hoặc đổi đội đi làng.
- `CharacterPortrait`, truyện TCG và đối thoại Adventure nhận biểu cảm theo dữ liệu trình bày. Không đoán cảm xúc bằng cách phân tích từ khóa lời thoại. Bộ biểu cảm đầy đủ có thể tái sử dụng cho các đoạn truyện tiếp theo.
- Chân dung đầu bếp được giữ vuông trong nút tuyệt kỹ thấp, tránh chỉ còn trán/mắt.
- Auto Chess: bỏ lớp impact vẽ kép của đòn quái, giữ renderer impact chọn texture hoặc geometry; thu va chạm gần chân để không che mặt đầu bếp.
- Tuyệt kỹ dùng renderer native hiện có: một actor + một lớp VFX chính, năm pha 0/360/960/1500/1980/2400 ms. VFX kết thúc trước recovery, không vẽ đồng thời phim, ảnh cut-in và model.
- Gỡ 5 MP4 cũ không còn được gọi (6.901.575 byte). Không tạo phim mới chỉ để đổi hiệu ứng. Các MP4 của nhân vật khác tiếp tục tải theo yêu cầu.
- Layout của 17 atlas cũ được sinh từ lưới thay cho metadata lặp; đã đối chiếu frame và pivot với commit nền, không đổi hình hoặc hình học. Công cụ đăng ký atlas cũ tránh tái thêm các metadata/model đã chuyển sang manifest.

## Phạm vi hoàn thiện

Mỗi đầu bếp có tám trạng thái vật lý: idle, walk, attack, cast, ultimate, hit, fall/death, victory, mỗi trạng thái bốn tư thế. Summon, guard và stun tái sử dụng tư thế tương thích; đây không phải ba bộ tranh mới. Nội suy chuyển động cơ thể dùng hệ thống sẵn có; chưa có rig skeletal/mesh hoặc bộ chạy riêng. Đây là một đợt P1 tích hợp hoàn chỉnh cho năm đầu bếp, chưa hoàn tất toàn bộ roster, boss hay mọi hạng mục của roadmap 6.0.
