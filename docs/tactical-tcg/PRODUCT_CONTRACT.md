# Product contract

## Bề mặt

Sản phẩm chỉ gồm Tactical TCG, Manga, Chest và legal. PvP ở `/?tab=play&queue=pvp` là phòng thử nghiệm cục bộ, không xếp hạng và không cấp thưởng PvE.

Sảnh, bộ bài, bộ sưu tập, mở gói, campaign và hướng dẫn là tính năng của TCG. Root mở sảnh; trận production luôn nhận bộ bài người chơi đã trang bị, không tạo sẵn quân người chơi.

TCG-007: bàn sản phẩm dùng viewport riêng, giữ đủ 16 ô/tay bài/thanh hành động; compact hand phân trang thay cuộn. Thẻ chọn đọc trong inspector/modal, bẫy theo cột và Tuyệt kỹ có nút riêng. Giao chiến trình diễn snapshot sau khi commit kết quả cuối; hiệu ứng không đổi luật/kết quả. Màn đọc luật/nhật ký có thể cuộn khi nội dung dài, bàn chơi chính không cần cuộn.

## Bộ bài và gói thẻ

- Giữ 181 ID, art và lore của catalog cũ; luật mô tả trên thẻ là luật Tactical đang chạy, không giả định mọi hiệu ứng legacy có cách tính không đổi.
- Bộ 24 lá, tối đa 2 bản mỗi lá đã sở hữu, ít nhất 8 Vị Linh. Bộ cũ chưa đủ 24 giữ nguyên để sửa; tài khoản được thêm bộ hợp lệ có Nhiên và Bẫy Hương.
- Tay đầu 4 lá, đổi tay một lần trước khi chơi thẻ. Đầu vòng mới rút 1, tăng giới hạn Lửa Bếp từ 3 đến tối đa 10 và hồi đầy. Tay tối đa 8; lá dư vào ký ức.
- Mở gói riêng trong TCG theo yêu cầu chủ sản phẩm ngày 04/11: 5 lá/1 vé hoặc 80 Tinh Vị. Đây là thay đổi so với master plan cũ chỉ mở combat card bằng campaign/craft. Không có thanh toán.
- Base odds: Thường 63%, Hiếm 25%, Sử thi 10%, Huyền thoại 2%; mỗi gói ít nhất Hiếm; gói thứ 8 liên tiếp chưa có Sử thi/Huyền thoại bảo đảm Sử thi. Tỷ lệ hiện trước khi mở.
- Bản dư thứ 3 trở đi: +5/+15/+40/+100 Tinh Vị. Craft chính xác: 50/140/360/800 theo cùng thứ tự bậc hiếm.
- Hai vé khởi đầu; quà ngày theo giờ Việt Nam: 1 vé +30 Tinh Vị. Reward trận có biên nhận một lần và một vé; đấu lại không tạo lại phần thưởng đã nhận.
- Gói nhập môn bộ bài v1 (TCG-007) thêm một lần các bản còn thiếu tới 2 để chơi Đường Than Hồng, Thư Từ Bến Nước, Khu Vườn Bên Bếp. Thêm 3 bộ nếu còn slot, giữ active cũ/max12. Không tặng dư để sinh Tinh Vị. Hai công thức Mâm Chung Năm Vị/Bình Minh Dưới Trăng cần sưu tầm/craft đủ, không cấp quân miễn phí trong trận.

## Dữ liệu

- Migration chạy trước khi tải Tactical UI, giữ raw backup và rollback khi lỗi.
- Catalog canonical nối alias TCG, Chest, Auto Chess và 12 Vị Linh AW2 để bảo toàn dữ liệu cũ.
- `soul-of-meal.tactical-tcg.progress.v1` lưu Tinh Vị, thẻ, nút campaign, Manga và receipt đã nhận.
- Mỗi reward receipt chỉ commit một lần; ghi có journal, readback, rollback và kiểm tra thay đổi từ tab khác.
- Chest mới tạo receipt `chest:<reward-id>`: bản đầu cấp collectible canonical, bản trùng đổi thành Tinh Vị theo độ hiếm. Reward Chest cũ vẫn được giữ nguyên; tiến trình trước thời điểm migration không bị phát lại.
- Không chuyển power bonus/rating cũ sang PvP.
- Collection, deck, TCG ticket/dust cũ giữ trong profile gốc và được khôi phục bổ sung một lần. Không xóa raw save gốc.
- Trận TCG lưu checkpoint trước khi UI cập nhật; checkpoint hỏng bị từ chối, giữ raw bytes. Mở/craft/lưu bộ/checkpoint trong browser dùng Web Locks khi có; fallback optimistic check không phải khóa nhiều thiết bị.
- TCG-006: sảnh tiếp tục đúng trận đang lưu; đổi trận chưa xong cần xác nhận. Checkpoint chỉ ghi nếu khớp bản component đã đọc, tab cũ phải đọc lại. Backup JSON có preview/confirm, giữ raw bản trước để hoàn tác một lần, journal/readback/rollback và recovery trước migration. Nhập/hoàn tác tải lại game; không phải cloud save hoặc cộng gộp tiến trình.

## Battle

TCG-008 visual contract: unit cards use their own rendered spirit portrait, board uses their own authored sprite atlas when available (77) or own static portrait (62). No dish photo/generic borrowed unit. Spell/trap art remains skill art; card IDs/lore/ownership/source files unchanged. Legacy character renderer/shared clock/pose/VFX are reused. Animation, floating numbers, casualty ghosts and combo banners derive authoritative before/after snapshots; contact560ms basic/spell,960ms ultimate. Presentation adds no gameplay damage. Saves commit final automatic outcome before stepped visuals; quiet/reduced motion skips waits and animated VFX. Dist includes exact manifest-backed model assets with existing package/security gates.

Bàn mỗi bên 4×2, tối đa 5 Vị Linh. Engine reducer thuần, action idempotent, target ưu tiên hàng trước cùng cột, rồi hàng trước gần nhất, hàng sau, cuối cùng commander. Các phase: planning, clash, reaction, ultimate, round-end, result.

- Trong trận thẻ bài, chơi bản sao thứ hai lên đúng quân để lên 2 sao (+40% công/HP tối đa), giữ lượng HP đã mất. Không cần sở hữu ba bản để dùng tính năng. Reducer merge 3 bản cũ chỉ còn cho fixture đội hình, không là đường chơi production.
- Mỗi bên chỉ có một bẫy đang kích hoạt. Mành Tre tạo 20 khiên, Hơi Nóng phản 12 sát thương, Nước Dùng hồi tối đa 18 khi mục tiêu còn không quá nửa sinh lực.
- Sau clash, cửa sổ reaction giữ trận mở để dùng Tuyệt kỹ trước khi kết thúc vòng.
- Boss campaign có Pha 1/2/3 theo ngưỡng sinh lực 100%/66%/33%; Pha 2 và 3 tăng khiên, sức đánh, năng lượng và ghi log hiển thị.
- Chỉ huy có 30 Ý chí; sân trống chưa kết thúc trận. Đòn vào Chỉ huy gây sát thương quân chia 10, làm tròn lên. Thắng khi Ý chí địch về 0. Hết bộ chịu kiệt sức; Lửa Lớn từ vòng 8 kết thúc thế kéo dài.
- Traps phải được rút và trả giá Lửa Bếp; không có nút gài bẫy miễn phí trong trận TCG.
- Quân tự đánh một lần/vòng, có nội tại và mục tiêu xác định. Hòa công luân phiên ưu tiên hai phe theo vòng.
- Công thức Đồng Vị: hai lá liên tiếp cùng hệ trong một vòng → +5 khiên toàn đội, tối đa một lần/vòng. Mâm Chung từ ba hệ → +3 công; mốc bốn cùng trait → +6 công thay cho +3.

## Cốt truyện

Bốn hồi: Làng Giao Ước → Phố Đèn Giữ Vị → Sân Bếp Trăm Nhà → Bếp Vô Danh. Mục tiêu là tìm lại tên những người trong công thức bị Sương Nhạt xóa và mời Vô Danh trở lại bàn ăn. Tất cả tám nút có mục tiêu/cảnh trước-sau, lời hẹn ở nút 7 mở một trong hai đoạn kết. Manga dùng artwork cũ, được nối đúng chương bằng tiến trình Tactical; không tuyên bố đã vẽ lại trang truyện.
