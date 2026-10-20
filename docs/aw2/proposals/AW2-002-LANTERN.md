# AW2-002 · Một chỗ bên bếp — PROPOSED

Ngày 2026-10-20. Toàn bộ nội dung bổ sung dưới đây là **PROPOSED / CHƯA OWNER DUYỆT**, không phải canon runtime. Điểm xuất phát duy nhất từ CANON working draft: ký ức bữa ăn, Sương Nhạt, Làng Giao Ước → Phố Đèn Lồng → bếp bị quên. Tên/thoại/NPC/mục tiêu mới là sáng tác gốc cho AW2; món ăn là cảm hứng, không dùng tài liệu này làm khẳng định lịch sử hoặc đại diện cho mọi thực hành văn hóa Việt Nam.

## Trục truyện

Một chiếc bàn trong làng luôn được dọn thêm chỗ, nhưng không ai nhớ người sẽ ngồi ở đó. Người chơi nhận lời mang một mảnh khăn bàn đến Phố Đèn Lồng để tìm người biết sửa nó. Sương Nhạt không chỉ xóa tên: nó khiến những người từng ăn cùng nhau tin rằng mình luôn ở một mình. Người chơi nối lại một bữa ăn bằng cách nghe các ký ức khác nhau, không phải tìm một công thức “đúng duy nhất”.

Kết thúc slice: bếp mở lại, người dân nhớ rằng đã từng dành chỗ cho một người vắng mặt; danh tính người ấy còn bỏ ngỏ cho chương sau. Không khẳng định người đó là Vân hoặc một ứng viên cụ thể. Không giết/đổi thân phận các nhân vật legacy bằng suy diễn. Các Vị Linh trong AW2-003 chỉ có thể xuất hiện sau review identity.

## Zone và đường nối

Mỗi đường nối là hai chiều. Các vị trí là spawn ngữ nghĩa cho world owner hiện thực; chưa phải tọa độ/collision đã kiểm tra.

| Zone ID đề xuất | Tên | Nội dung / điểm vào an toàn | Đường nối |
| --- | --- | --- | --- |
| aw2-zone-covenant-village | Làng Giao Ước | Bàn chung, giếng, sân luyện; spawn `aw2-spawn-village-table` | Cổng đông ↔ cổng tây Phố; không khóa bằng quest |
| aw2-zone-lantern-street | Phố Đèn Lồng | Thợ vá, quầy bếp, hai bàn trò chơi; spawn `aw2-spawn-street-west` | Tây ↔ Làng; bắc ↔ sân Bếp |
| aw2-zone-forgotten-kitchen-yard | Sân Bếp Bỏ Quên | Điểm nghỉ, cửa dungeon, lối rút; spawn `aw2-spawn-kitchen-yard` | Nam ↔ Phố; cửa ↔ Phòng Kho; lối tắt ↔ Phòng Bàn sau kết thúc |
| aw2-zone-kitchen-pantry | Phòng Kho (dungeon 1) | Tìm ký hiệu, rương, lối ra luôn hoạt động; spawn `aw2-spawn-pantry-door` | Cửa ngoài ↔ Sân; trong ↔ Phòng Lửa |
| aw2-zone-kitchen-hearth | Phòng Lửa (dungeon 2) | Puzzle ba nguồn hơi; spawn `aw2-spawn-hearth-west` | Tây ↔ Kho; đông ↔ Phòng Bàn sau puzzle |
| aw2-zone-kitchen-table | Phòng Bàn (dungeon 3) | Gặp boss, sau trận đọc mảnh ghi chép; spawn `aw2-spawn-table-west` | Tây ↔ Phòng Lửa; sau kết thúc có lối tắt ↔ Sân |

Không chuyển zone khi một trận đang chạy. Khi rút khỏi dungeon ở trạng thái khám phá, lưu checkpoint trước cửa zone đích; khi trở lại, đặt player ở safe spawn ngoài vùng va chạm. Không tự hồi sinh trong hitbox boss hoặc phía sau cửa chưa mở. Puzzle mở cửa trong, không khóa người chơi khỏi đường đã đi. Tọa độ thực, chặn collision, camera và input thuộc AW2-006.

Đường rút: Phòng Bàn → Phòng Lửa → Kho → Sân → Phố → Làng luôn còn dùng được ngoài trận. Thua trận trả về Sân, không xóa collection/quest flags và không nhận thưởng boss. Teleport quick-entry giữ điểm trở về hợp lệ, không đặt lại quest hoặc cho phép bỏ qua cửa puzzle.

## NPC và thoại gốc

Các ID là NPC riêng, không gán ngầm danh tính spirit cho NPC.

| NPC ID | Tên / vị trí | Chức năng | Thoại mở / sau chuyển trạng thái |
| --- | --- | --- | --- |
| aw2-npc-giu-cho | Bà Giữ Chỗ / bàn làng | Trao mảnh khăn, nhận kết quả | “Bà nhớ đã để dành chiếc ghế này. Chỉ không nhớ đã hẹn ai.” / “Chưa nhớ được tên cũng không sao. Con đã giúp bà giữ lời mời.” |
| aw2-npc-va-den | An Vá Đèn / Phố | Sửa khăn bằng các câu chuyện được nghe | “Đèn tắt thì thay tim. Còn người quên nhau, phải tìm xem ai đang chờ.” / “Ba nét chỉ khác nhau vẫn có thể giữ cùng một mép khăn.” |
| aw2-npc-gac-bep | Dì Gác Bếp / Sân | Dạy puzzle, điểm nghỉ, mở dungeon theo quest | “Đường về ở ngay sau lưng con. Nếu chưa sẵn sàng, cứ quay lại.” / “Bếp sáng rồi. Chừa cửa cho người đến sau nhé.” |
| aw2-npc-nguoi-ban | Người Bán Bữa Sáng / Phố | Mẩu ký ức thứ nhất | “Tôi nhớ một người luôn xin gói phần ngon nhất mang về. Không nhớ gói cho ai.” |
| aw2-npc-sua-ghe | Thợ Sửa Ghế / Phố | Mẩu ký ức thứ hai | “Chiếc ghế thấp này từng được kê thêm đệm. Tôi vẫn giữ phần đệm ấy.” |
| aw2-npc-dem-nuoc | Em Đem Nước / Phố | Mẩu ký ức thứ ba | “Em chỉ nhớ phải đặt thêm một chén. Đặt thêm vẫn tốt hơn để ai đó thiếu.” |
| aw2-npc-ban-bai | Chủ Bàn Bài / Phố | Portal TCG | “Một ván cũng được. Khi đứng dậy, câu chuyện của bạn vẫn đợi ở đây.” |
| aw2-npc-ban-co | Chủ Bàn Cờ / Phố | Portal Auto Chess | “Xếp đội thử trước nhé. Không phải đặt cược điều gì để được ngồi xuống.” |

Lựa chọn hội thoại luôn có “Để sau”; đóng dialog không được coi là hoàn thành hoặc chọn thay người chơi. Không bắt buộc thoại một lần duy nhất: các đoạn then chốt có thể đọc lại, nhưng grant chỉ một lần.

## State machine và event contract đề xuất

Mỗi quest: `locked → available → active → ready → completed`. `available` chỉ cần thỏa prerequisite; accept là thao tác rõ ràng, không tự ép quest khi đi qua NPC. `ready` nghĩa là đủ mục tiêu, chưa nhận kết quả từ NPC. Chuyển `completed` cùng world flags và grant receipt trong một transaction save. Không dùng việc mở dialog hay phát animation làm chứng cứ grant.

ID event thuộc namespace `aw2-event-*`. Engine sau này phát event đã được xác thực từ gameplay, không nhận completion/reward trực tiếp từ renderer. Sự kiện mục tiêu chỉ được tính khi quest active; trò chuyện trước khi nhận không tăng đếm, mọi NPC cho đọc lại sau khi nhận. Grant đề xuất `aw2-grant-*` có receipt duy nhất theo profile/quest, không lặp theo lượt mở UI. Số lượng XP/item, combat balance và schema journal chưa được duyệt.

| Quest ID / prerequisite | Trigger → objective | Choice → state / world effect | Retry, reload, grant |
| --- | --- | --- | --- |
| aw2-quest-kept-seat / new AW2 profile | Accept tại Bà → tương tác bàn và đọc mảnh khăn (`aw2-event-table-read`) → trở lại Bà | “Con sẽ đi hỏi” hoặc “Con muốn nghe thêm”; cả hai tới `completed`, khác một đoạn lời dẫn, không mất route | Đóng thoại giữ `active`; mảnh khăn là quest flag, không chiếm kho có thể bán. `aw2-grant-kept-seat` chỉ sau hoàn tất; chưa chốt vật phẩm |
| aw2-quest-three-memories / kept-seat completed | Accept tại An → nghe Người Bán, Thợ Ghế, Em Nước (`aw2-event-memory-vendor`, `aw2-event-memory-chair`, `aw2-event-memory-bowl`) theo bất kỳ thứ tự → báo An | Chọn đặt nét chỉ “người chờ” hoặc “người trở lại” (`aw2-choice-thread-wait`, `aw2-choice-thread-return`); đổi lời kết/màu motif đề xuất, không khóa reward/zone | Lưu set ba event duy nhất; event lặp không tăng đếm. Reload giữ số mẩu đã nghe. `aw2-grant-three-memories` một lần; choice chỉ chốt khi xác nhận |
| aw2-quest-open-hearth / three-memories completed | Accept tại Dì → khám phá Kho, đọc bảng dấu hơi (`aw2-event-hearth-hint-read`) → giải puzzle (`aw2-event-hearth-solved`) → báo Dì | “Cùng nhóm lửa” hoặc “Dì chỉ con lần nữa”; lựa chọn thứ hai đọc lại gợi ý rồi vẫn có thể hoàn thành | Cửa dungeon được Dì mở khi quest active; rời dungeon/reload không mất quest hoặc puzzle solved. `aw2-grant-open-hearth` một lần, không yêu cầu tiêu vật phẩm/gacha |
| aw2-quest-one-more-bowl / open-hearth completed | Accept tại Dì → tương tác bàn ở Phòng Bàn → boss challenge; thắng `aw2-event-kitchen-keeper-defeated` → đọc ghi chép `aw2-event-table-note-read` → trở về Bà | “Để ghế trống chờ” hoặc “Mời cả làng dùng bữa” (`aw2-choice-seat-wait`, `aw2-choice-seat-share`); cùng mở bếp, khác đoạn kết, không loại vĩnh viễn spirit | Thua không bật defeated flag; thắng chưa báo Bà giữ `ready`. Receipt `aw2-grant-one-more-bowl` chốt cùng quest completed; không nhận lại qua boss replay |

Các quest có một đáp án tiến trình chung; lựa chọn tạo sắc thái, không xóa nhánh còn lại khỏi khả năng hoàn tất main story. NPC có marker dựa state thật. Objective hiện rõ trên journal; hỗ trợ đọc lại gợi ý, không buộc nghe audio/nhìn màu để hiểu.

### Dungeon, puzzle, rương và boss

Puzzle `aw2-puzzle-steam-path`: bảng dấu hơi ở Kho nêu thứ tự **mở lối thoát → đặt nồi → nhóm lửa**. Ba tương tác có nhãn văn bản/hình khác nhau, không chỉ khác màu. Thứ tự sai đóng van tạm và cho thử lại ngay; không trừ tài nguyên, không softlock. Interaction cuối phát solved event khi engine xác nhận cả ba bước. Save một trạng thái có kiểm chứng; tránh lưu giữa hai bước mutation. Có nút “Làm lại puzzle” chỉ reset puzzle chưa giải, không reset save game. Sau solved, cửa luôn mở khi quay lại.

Rương `aw2-chest-pantry`: tùy chọn, đặt ở nhánh bên Kho, không chứa vật phẩm bắt buộc mở đường. Claim `aw2-grant-chest-pantry` chỉ một lần; atomic claim/receipt thuộc AW2-008/SAVE-02. Animation có thể phát lại theo accessibility nhưng không gọi grant lần nữa. Lỗi ghi giữ rương chưa nhận và không cập nhật inventory trong UI trước commit.

Boss đề xuất `aw2-enemy-forgotten-host` — Người Giữ Bàn Quên: thực thể ký ức hư cấu, chưa gán spirit/rarity. Đòn “Mời hụt” báo trước bằng vùng quét có viền và nhịp gõ; “Tắt bếp” báo bằng ba tiếng chạm và biểu tượng ngọn lửa giảm dần; “Ghế trống” dựng một lớp bảo vệ có thanh trạng thái cần phá bằng nhiều đòn thường. Chủ đích dạy ultimate đúng thời điểm, không đòi UR hoặc kiểm tra DPS bằng chỉ số chưa cân bằng. Thời gian báo đòn/sát thương/counter cụ thể do mechanic mô phỏng và tester xác minh; âm/VFX là specification, chưa có asset.

Team vẫn 5 auto attack/auto skill; player chọn timed ultimate. Không đổi sang turn-based combat hoặc điều khiển một nhân vật thay cả đội. Sau thắng, chuyển về đúng Phòng Bàn và safe spawn; mất kết nối/đóng trang giữa battle phải theo save policy AW2-007, không tự kết luận thắng.

## TCG / Auto Chess và quick-entry

Hai bàn đặt tại Phố, nhưng portal UI có thể tạm ghi “Chưa triển khai” cho tới AW2-009; không giả lập một chế độ đã chạy. Mở mode tạo return context gồm zone + safe spawn + trạng thái exploration hợp lệ. Quick-entry từ menu dùng cùng transition service. Không cho vào mode khác khi battle/run chưa có chính sách pause/resume an toàn. Thoát mode quay về điểm hợp lệ, không spawn trong vật cản hoặc quest trigger nhận thưởng. Thua mini-game không khóa truyện/RPG và không mất quest item; không đem save development AW2 nhập vào legacy mode một cách ngầm định.

## Dependency và review

| Owner / task | Cần chốt trước implementation |
| --- | --- |
| Owner + story + BA | Duyệt trục truyện, tên 6 zone/8 NPC, lời thoại, lựa chọn kết và boss hư cấu; tất cả hiện PROPOSED |
| Character / AW2-003 | Duyệt việc các spirit có xuất hiện trong chapter; hiện không gắn quest bắt buộc với một ID chưa duyệt |
| Mechanic / AW2-007/008 | Event authentication, quest/grant transaction, retry battle, puzzle state, reward budget; chưa chọn con số |
| Animation / AW2-004/006 | World props/NPC 4 hướng, portal, puzzle, dungeon/boss VFX/audio manifest + provenance; NOT_IMPLEMENTED |
| World / AW2-006 | Tọa độ/collision, sáu zone + transfers/spawn, tương tác có khoảng cách, safe checkpoint |
| Modes / AW2-009 | Return context, quick-entry và guard paused battle |
| Tester / AW2-010 | Vertical slice chỉ playable khi đầy đủ runtime + assets + flow QA, không suy từ story bible |

Các quyết định cần owner: có giữ arc “giữ chỗ cho người vắng mặt”, NPC/tên zone, hai lựa chọn motif và hai kết không loại trừ; có cho giải puzzle không tiêu tài nguyên; boss giữ vai trò ký ức, không tiết lộ danh tính UR. Duyệt story không đồng nghĩa duyệt roster, rates hoặc art.

## Test impact đề xuất — gameplay NOT_RUN

WORLD-01: đi hai chiều, đúng safe spawn, không kẹt cửa/collision; không chuyển zone trong battle. WORLD-02: nhận/từ chối/đọc lại thoại, ba mẩu ký ức mọi hoán vị, không tăng đếm khi lặp, quest markers đúng state.

DUNGEON-01: ba phòng + puzzle sai/đúng/rời/reload + rương nhận một lần + thua/thắng/retry boss. SAVE-02: inject write failure tại transaction quest/receipt, reload không double grant, hai tab tranh cùng rương. BATTLE-02: thắng chưa báo NPC rồi reload, thua không mở flag, đóng trang giữa battle không thành thắng. MODE-01: world portal và quick-entry cùng guards, trở lại đúng spawn, mini-game thất bại không xóa main quest.

Kiểm tra tĩnh có thể thực hiện ngay: đếm 6 zone/8 NPC/4 quest, đối chiếu namespace/reference, đường rút không khóa, mỗi quest có trigger/objective/choice/state/retry/grant và giữ nội dung PROPOSED. Chưa có map để chạy navigation, battle, grant hoặc browser gameplay checks.
