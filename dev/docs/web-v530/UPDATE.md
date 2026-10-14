# Web 5.3 · Giao ước thức tỉnh

Trước đây chỉ cần sở hữu một bản TCG là có Vị Linh RPG, còn các bộ kỹ năng lặp theo vai trò/hệ. Bản này dùng thẻ từ **Rương vị giác** để mở nhân vật mới, thêm bộ kỹ năng theo từng giao ước và phát video tuyệt kỹ riêng. Giữ mọi Vị Linh đang sở hữu, UID, cấp/XP, kỹ năng, trang bị, đội hình, tiến trình, tài nguyên và bộ sưu tập hiện có.

## Rương → thẻ → hội ngộ

| Độ hiếm | Thẻ cùng nhân vật cần thu thập | HP / công cơ bản |
|---|---:|---:|
| Thường | 15 | 100% |
| Hiếm | 25 | 104% |
| Sử thi | 35 | 108% |
| Huyền thoại | 45 | 112% |

Mỗi rương giữ phần thưởng món ăn cũ và nhận thêm **một thẻ Vị Linh**, không thu thêm chìa. Thẻ này hiển thị riêng với minh họa, tên, độ hiếm, số lượng / mốc mở khóa và liên kết hồ sơ. Danh sách rút có đủ **139 nhân vật**, gồm cả người giữ vị và đoàn lữ hành, không phụ thuộc món/khung giờ/banner đang mở. Lượt ngẫu nhiên: Thường 71%, Hiếm 22%, Sử thi 6%, Huyền thoại 1%; chia đều trong mỗi nhóm.

**Ước hẹn**: chọn người muốn thu thập trong hồ sơ. Cứ lần mở rương thứ năm sẽ bảo đảm thẻ người đó, thay lượt ngẫu nhiên; các lượt còn lại dùng tỉ lệ trên. Nhịp 0–4 lưu chung, đổi người không đặt lại nhịp, không có phí lựa chọn. Do đó không phải trông chờ xác suất rất nhỏ của từng nhân vật huyền thoại để đạt 45 thẻ. Rương vô hạn sau hoàn thành bộ sưu tập món ăn vẫn giữ điều kiện cũ.

Sổ thẻ `user.spiritCards` độc lập với mảnh món ăn có thể tiêu. Ghi thẻ + phần thưởng + chìa + nhịp Ước hẹn trong cùng giao dịch lưu user. Thẻ không bị trừ khi hội ngộ; RPG đồng bộ mở một lần khi đủ mốc. Fusion, gói TCG và phần thưởng PvP không tăng sổ này. Thẻ rương trước 5.3 được tính từ lịch sử `source=chest`, kể cả món đã dùng; không lấy số dư mảnh món hoặc số bản TCG để suy đoán. Giữ năm Vị Linh đồng hành ban đầu và mọi nhân vật cũ; hồ sơ ghi rõ trường hợp đã sở hữu nhưng chưa đủ mốc thẻ mới.

Hồ sơ cho xem cả nhân vật chưa mở: 139 minh họa Vị Linh của 5.1, tiến độ thẻ, độ hiếm, bốn kỹ năng, điều kiện cấp/bậc, Chân ước và xem trước video. Người chưa hội ngộ không thể xếp đội/nâng cấp. Sau đủ mốc vẫn bắt đầu cấp 1 và phải dùng kinh nghiệm, sách, quặng, xu, tinh hương; hệ nâng cấp cấp 50 / kỹ năng 10 / bậc 5 / trang bị 10 được giữ.

## Bộ kỹ năng và đối phó

139 bản ghi cố định có **139 tổ hợp cơ chế khác nhau**, kết hợp 25 kỹ năng chính, 16 kỹ năng hỗ trợ, 20 nền tuyệt kỹ, 12 nội tại và 6 lời ước. Tên/chủ đề gắn với từng nhân vật, không dùng hash ID để đổi tên cùng một bộ vai trò. Dùng chung các nguyên lý để giữ khả năng đọc và kiểm thử; không tuyên bố 556 luật hoàn toàn độc lập.

- Kỹ năng chính có nhịp riêng 6–9 giây; hỗ trợ 10–12 giây, mở ở cấp 5; nội tại mở bậc 2. Cấp kỹ năng tăng hiệu lực công/hồi/khiên 9%, vẫn bị chặn bởi cấp nhân vật.
- Mục tiêu và điều kiện khác nhau: liên kích, nảy đạn, xuyên sau, quét hàng, xử lý khiên, ưu tiên thợ hồi phục, truy kích thấp HP, chuyển năng lượng, rút hồi kỹ năng, thanh tẩy, khiên khẩn cấp.
- Tái sinh, thu hút đòn thường, né giảm 60% sát thương, phản đòn, giảm giáp 35%, tổn thương nhận thêm 15%, kết giới giảm 18% sát thương tạo phối hợp với Bỏng/Choáng/Làm yếu/Khóa hồi phục. Hồi thông thường ở luật 530 không tự thanh tẩy bỏng; kỹ năng thanh tẩy có giá trị riêng.
- Dấu nguyên tố và Liên hương giữ cơ chế đã có. Mốc ba giây tính theo đồng hồ chiến đấu và dừng cùng video. Hướng Phá sương/Dưỡng linh mở cấp 10 được giữ.
- Sử thi/Huyền thoại thêm 5 năng lượng cho đồng đội khác khi nối Liên hương. Huyền thoại mở thêm **Chân ước** khi đủ **cấp 10 + bậc 2 + tuyệt kỹ cấp 3**: kết giới, thêm đòn vào địch bỏng, tiếp năng lượng, thanh tẩy/hồi, tái sinh hoặc hút năng lượng tùy lời ước. Không chỉ rút được thẻ là có ngay toàn bộ sức mạnh.

Luật 530 cho địch dùng năng lượng thực: quân thường/tinh anh cần 60, boss cần 80; hồi 1 mỗi tick 0.25s, thêm từ đòn đánh/nhận đòn. Chỉ trừ năng lượng sau thi triển thành công. Hút trước lúc tụ lực có thể trì hoãn, hút khi cảnh báo đang chạy có thể ngắt chiêu nếu xuống dưới mốc. Choáng vẫn ngắt tụ lực; boss chịu nửa thời gian choáng từ kỹ năng 5.3. Cửa sổ hồi chiêu, báo trước, skill riêng của năm boss và bốn kiểu địch từ 5.2 vẫn có tác dụng.

Giữ 4 vùng × (5 màn + boss), truyện/lựa chọn, 3 đợt màn thường / 4 đợt boss, 4–6 quân/đợt và dungeon trung bình cấp đội hình từ 5.2. Không kéo dài bằng chờ giả. [Balance QA](balance-qa.json) đo thời gian mô phỏng không tính thời gian video, dùng focus/che chắn thật.

## Video, âm thanh, khung hình

**139 MP4 H264, 512×288, 24 fps, khoảng 2.4 giây** và **139 MP3 riêng**. Mỗi phim có minh họa nhân vật, động tác thi triển từ pose của dự án, pháp ấn riêng, cảnh giới theo hệ, hiệu ứng/nhịp theo tuyệt kỹ và chòm sáng của nhân vật. Tái sử dụng pose để dành dung lượng cho độ đa dạng: 20 ngôn ngữ hiệu ứng được phối riêng, không phải 139 bộ body animation vẽ tay mới. Hai atlas original sinh bằng built-in image_gen; atlas cảnh giới nằm ở dev làm nguồn dựng phim, không tải thừa trong sản phẩm.

Video trận phủ màn hình bằng portal, có dừng/tiếp tục, Bỏ qua, Escape và giữ focus trong các nút của đoạn phim. Không bị ngữ cảnh xếp lớp sân / thanh thẻ che. Đồng hồ và các nhân vật khác tạm dừng. Âm riêng đi qua mixer hiệu ứng hiện có, tôn trọng mute/volume, dừng khi pause/ẩn trang. BGM hiện có tiếp tục. Mỗi chiêu commit sát thương/năng lượng **một lần trước phim**; chỉ sau hoàn tất mới chuyển đợt/kết quả. Reload phát lại phần trình bày của chiêu đã commit, không trừ hoặc gây sát thương lần hai. AUTO dừng tại phim đầu tiên, không tung cả năm chiêu trong một tick. Nếu ghi kết thúc phim thất bại, có Thử lại và đường tới sao lưu/lưu trữ, không khóa nút hoặc tính chiêu lại.

Có công tắc Video ON/OFF lưu cho các trận mới; OFF vẫn dùng âm thanh của nhân vật và FX Canvas. Giảm chuyển động dùng khung tĩnh; lỗi tải/giải mã có fallback và giới hạn chờ, không kẹt trận. Chỉ làm nóng video/âm của tối đa năm người trong đội; một video đang giải mã, giải phóng src khi đóng. Đánh thường tiếp tục dùng projectile/slash/impact của TCG; kỹ năng 530 chọn hình niệm/va chạm theo loại chiêu và motif riêng.

Cảm hứng cơ chế: [Cygames / Princess Connect help](https://dmg.priconne-redive.jp/help/) (TP, thao tác Union Burst, dừng thời gian trong lúc thi triển, lựa chọn giảm trình bày). Tài liệu kỹ thuật: [MDN video](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video), [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Không dùng hình, âm, nhân vật hoặc footage của trò chơi tham khảo.

## Bảo toàn, phạm vi, bằng chứng

Chỉ trận mới nhận luật **530**. Snapshot undefined/510/520 vẫn dùng stats, skill, AI và phần thưởng cũ; tầng kế tiếp của dungeon cũ giữ đúng phiên bản. Save/key gốc không đổi, các trường mới optional, sổ thẻ đi cùng backup user. Nới chỗ roster để giữ cả UID cũ có cùng nhân vật lẫn nhân vật mới. Không đổi luật, transport, kinh tế hay che bài của PvP. Chỉ web; không sửa/build/sync Android hoặc iOS. Không thêm runtime dependency.

Dữ liệu mô tả kỹ năng tách thành JSON, tải/cache khi xem hồ sơ và có thử lại khi lỗi; rút mô tả hồ sơ cũ không còn hiển thị khỏi JS. Gộp phần luật và helper dùng chung để giữ trần JS gzip 650 KB; Pixi vẫn tải theo nhu cầu và đã kiểm trên build sản xuất.

Xem [VERIFICATION.md](VERIFICATION.md), [BUDGET.md](BUDGET.md), [browser-qa.json](browser-qa.json), [media-qa.json](media-qa.json), [asset/prompt](artwork.json). Tất cả media được giải mã kiểm tra và ghi hash. Chưa đo FPS trên điện thoại thật hoặc xác nhận Safari. Vercel connector hiện không có quyền team `minmin-s-app`; preview trực tiếp chưa xác minh được, kiểm thử production chạy cục bộ.

PR này tiếp sau #43 (5.2), không tự merge. Tại lần đọc GitHub ngày 14/10/2026: #39/#40 đã merge, #43 vẫn mở. Trạng thái phát hành là thời điểm kiểm tra, không phải bảo đảm luôn đúng.
