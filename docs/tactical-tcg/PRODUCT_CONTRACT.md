# Product contract

## Bề mặt

Sản phẩm chỉ gồm Tactical TCG, Manga, Chest và legal. PvP ở `/?tab=play&queue=pvp` là phòng thử nghiệm cục bộ, không xếp hạng và không cấp thưởng PvE.

Sảnh, bộ bài, bộ sưu tập, mở gói, campaign và hướng dẫn là tính năng của TCG. Root mở sảnh; trận production luôn nhận bộ bài người chơi đã trang bị, không tạo sẵn quân người chơi.

TCG-010 thay trình bày16 ô bằng hai hàng bài đối diện, tối đa5 Vị Linh mỗi bên; tọa độ checkpoint cũ vẫn giữ để xét Tiền/Hậu tuyến. Chọn tuyến qua2 nút khi gọi/di chuyển, chồng bản sao lên đúng quân để nâng sao. Splash art của đúng Vị Linh được crop trong bề mặt vuông, không kéo méo; không cần model hoạt họa trên bàn. Chủ tướng có chân dung/Ý chí/Lửa/lời chỉ huy và bẫy úp riêng. Tay compact phân trang4, desktop8, inspector/modal để đọc rõ. Người chơi chọn đòn/mục tiêu, xen kẽ bài và Tuyệt kỹ. Kết lượt mới đến AI; mỗi hành động AI lưu trước hiệu ứng và dừng khi cần quyết định bẫy. Màn đọc thẻ/luật/nhật ký có thể cuộn; bàn chính không cần cuộn. FX đặt/lật/đánh/đường đạn/khống chế/hồi phục theo kết quả engine, không tự tăng sát thương. Metadata impacts bổ sung ghi riêng sát thương HP/khiên sau bẫy, tránh mất dấu đòn khi cấp khiên rồi bị đánh trong cùng hành động.

TCG-010 trạng thái thật: Dây Lá Giữ Chân vẫn gây20 damage/khống chế đến hết vòng kế, thêm marker Trói chân và chặn di chuyển. Khăn Ấm/thawer giải cả hai marker, không trả đòn đã dùng. Vòng Than Phản Công vẫn gây12 lên địch chưa đánh và thêm Thiêu đốt4×2 lần cuối vòng; khiên hấp thụ trước, áp lại thay thời hạn thay vì cộng dồn. Tick chỉ khi AI hết hành động, trước rút bài/vòng mới; replay command không tick lại. Hạ quân ghi ký ức/nội tại một lần; hồi sinh xóa trạng thái cũ. Checkpoint cũ không có các trường này vẫn đọc được. Đây là thay đổi cân bằng bẫy cần playtest, không áp vào legacy auto fixture.

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

Current TCG-010 retains TCG-009 directed turns and supersedes the old automatic combat/trap rules below: production uses additive `cardGame.directed.version=2` with manual player/enemy turns and persisted reaction intent. Legacy automatic helpers are retained only for existing fixtures/dev compatibility.

- Choose front guardians first; without guardians, mages can select rear targets, other roles clear front first. Commander is targetable only when no enemy unit remains. One basic/unit/round; ultimates require100 energy and may follow a basic. New summons wait except rush. Freeze blocks attacks/ultimates; thaw never refunds a spent attack.
- Eight native traps retain separate functions: lid blocks commander hit; mirror blocks/reflects commander damage cap4; embers12 plus non-stacking4×2burn to ready enemies before attack; root20/root/control after summon cost>=3; seal negates cost>=2 spell with full card/mana cost and no passive/recipe; ward20 shield all before unit hit; recall exact fallen cost<=4 with20HP, no entry/fresh attack; pantry3 commander heal/draw2 after cost>=4 summon. Tactical-scaled powers differ from legacy balance. Each side has one global trap slot, replacing the old column restriction.
- Before/after reaction windows persist action/slot IDs; player activates or holds without timeout, reload resumes. Enemy traps activate automatically. Reveal preserves a trap; disarm removes it. Commands, including enemy-step IDs, are idempotent. Each enemy step saves before presentation; after AI ends its turn, increase round/draw/refill mana/+20 energy. Unmount and stale-tab guards remain.
- Attack trails/impact rings/trap-negation sigils/readiness/control/turn banners augment splash-art cards and old VFX. Actual HP/shield changes wait for contact. Quiet/reduced motion skips animated waits. No new artwork or fabricated unique poses.
- Eight deck recipes now include three advanced strategies: Nhịp Phép Bên Bếp, Bàn Cờ Úp Hương, Ký Ức Chưa Tắt. All have plans/openings/weaknesses. The three free intro receipts/grants and existing saved decks remain unchanged; five advanced recipes require owned cards.

TCG-010 visual contract replaces TCG-008's animated battlefield actors with each unit's own rendered splash portrait. The retained resolver covers77 authored atlases/62 own static portraits for compatibility, with the same exact manifest-backed asset/package/security gates. No dish photo/generic borrowed unit. Spell/trap art remains skill art; card IDs/lore/ownership/source files unchanged. Shared old VFX, authoritative deltas/impacts, casualty ghosts and real combo banners remain; contact560ms basic/spell,960ms ultimate. Presentation adds no gameplay damage. Saves commit each manual/AI action before its visual playback; quiet/reduced motion skips waits and animated VFX.

Tọa độ engine vẫn4×2 mỗi bên để đọc save cũ, tối đa5 Vị Linh; UI chỉ hiện hai hàng bài đối diện. Engine reducer thuần, action idempotent. Target production theo Hộ vệ/Pháp sư/tiền-hậu tuyến như trên; ưu tiên cùng cột/gần nhất chỉ còn trong auto fixture. Các phase lưu được: planning, clash, reaction, ultimate, round-end, result.

- Trong trận thẻ bài, chơi bản sao thứ hai lên đúng quân để lên 2 sao (+40% công/HP tối đa), giữ lượng HP đã mất. Không cần sở hữu ba bản để dùng tính năng. Reducer merge 3 bản cũ chỉ còn cho fixture đội hình, không là đường chơi production.
- Legacy fixture-only traps: Mành Tre20 khiên, Hơi Nóng12 phản, Nước Dùng18 hồi; production uses eight native traps above.
- Production permits manual ultimates in the player's turn; legacy fixtures retain their after-clash reaction phase.
- Boss campaign có Pha 1/2/3 theo ngưỡng sinh lực 100%/66%/33%; Pha 2 và 3 tăng khiên, sức đánh, năng lượng và ghi log hiển thị.
- Chỉ huy có 30 Ý chí; sân trống chưa kết thúc trận. Đòn vào Chỉ huy gây sát thương quân chia 10, làm tròn lên. Thắng khi Ý chí địch về 0. Hết bộ chịu kiệt sức; Lửa Lớn từ vòng 8 kết thúc thế kéo dài.
- Traps phải được rút và trả Lửa Bếp; không có nút gài miễn phí. Global trap slot is inspectable; hidden enemy identity stays hidden until reveal/activation.
- Production attacks are manually chosen once/unit/round. Legacy fixture auto-combat keeps its alternating attack-order tie rule.
- Công thức Đồng Vị: hai lá liên tiếp cùng hệ trong một vòng → +5 khiên toàn đội, tối đa một lần/vòng. Mâm Chung từ ba hệ → +3 công; mốc bốn cùng trait → +6 công thay cho +3.

## Cốt truyện

Bốn hồi: Làng Giao Ước → Phố Đèn Giữ Vị → Sân Bếp Trăm Nhà → Bếp Vô Danh. Mục tiêu là tìm lại tên những người trong công thức bị Sương Nhạt xóa và mời Vô Danh trở lại bàn ăn. Tất cả tám nút có mục tiêu/cảnh trước-sau, lời hẹn ở nút 7 mở một trong hai đoạn kết. Manga dùng artwork cũ, được nối đúng chương bằng tiến trình Tactical; không tuyên bố đã vẽ lại trang truyện.
