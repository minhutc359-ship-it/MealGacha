# Đi lại trong Phòng Bàn

Mở `world.html`, nhận **Thêm một chén** tại Dì rồi đi qua Phòng Kho → Phòng Lửa → Phòng Bàn. Nếu đã có kết thúc lưu, dùng lối tắt từ Sân hoặc đường cũ.

Dưới bản đồ có bốn nút điểm đến: Người Giữ Bàn Quên, Ghi chép bên chén, về Phòng Lửa và lối tắt về Sân. Chọn một nút để đội đi bộ theo đường hợp lệ; khi đến gần, dùng **E** hoặc **Tương tác** rồi chọn hành động trong hội thoại. Đi tới boss không tự bắt đầu trận; đi tới ghi chép không tự đọc. Lối tắt chỉ mở sau khi hoàn thành câu chuyện. Sau kết thúc, boss cho đấu lại không nhận thưởng.

Phòng có nền gỗ/thảm và bàn nhỏ riêng. Bàn mờ khi che người đi phía sau; người đi phía trước được vẽ trên bàn. Boss hiện có bốn tư thế đứng chibi riêng và quay về phía nhân vật đại diện; chưa có hoạt ảnh đi/đánh. 006C thêm ghi chép/chén và hai thảm dấu lối; chữ trạng thái nằm dưới hình. Ghi chép mờ trước chiến thắng, lối tắt mờ trước ending. Năm vùng khác vẫn dùng địa hình debug. Đây là môi trường tham chiếu, chưa phải bản đồ/nhân vật được nghiệm thu đầy đủ.

Nếu ảnh bắt buộc tải lỗi, bản đồ hiện thông báo và khóa các nút điểm đến. Sau khi kết nối/tài nguyên phục hồi, tải lại trang để thử lại. Không cần reset save để xem hình mới.

Hai ảnh môi trường006B được tạo bằng built-in imagegen: [nền](../../dev/aw2/assets/environments/kitchen-table/v1/floor-source.png), [bàn nền trong suốt](../../dev/aw2/assets/environments/kitchen-table/v1/sideboard-source.png). [Prompts nguyên văn](../../dev/aw2/assets/environments/kitchen-table/v1/prompts.json), [provenance](../../dev/aw2/assets/environments/kitchen-table/v1/provenance.json), [đặc tả](PHONG_BAN_SCENE_SPEC.md), [kiểm chứng006B](evidence/AW2-006B.md). Rights REVIEW_REQUIRED; commercial NOT_CLEARED.

006C: [ghi chép/chén](../../dev/aw2/assets/environments/kitchen-table/interaction-v1/note-source.png), [dấu lối](../../dev/aw2/assets/environments/kitchen-table/interaction-v1/threshold-source.png), [prompts](../../dev/aw2/assets/environments/kitchen-table/interaction-v1/prompts.json), [provenance](../../dev/aw2/assets/environments/kitchen-table/interaction-v1/provenance.json), [kiểm chứng](evidence/AW2-006C.md). Hai lối ra dùng cùng một hình thảm phẳng, tên đích và trạng thái do giao diện/save cung cấp.

D17/006E: map chỉ vẽ nhân vật đầu đội đã lưu; đủ năm người vẫn vào trận. Đổi Vị trí đội1 rồi Lưu đội hình để đổi đại diện. Bàn mờ khi che chính nhân vật đại diện, không còn đoàn followers. [Đội hình](COLLECTION.md).

006D: [atlas boss bốn idle hướng](../../dev/aw2/assets/forgotten-host/world-v1/world-source.png), [prompt](../../dev/aw2/assets/forgotten-host/world-v1/prompts.json), [provenance](../../dev/aw2/assets/forgotten-host/world-v1/provenance.json), [kiểm chứng](evidence/AW2-006D.md). Hình HD/FX chỉ dùng trong trận như trước; boss world vẫn đứng cố định và không tự mở hội thoại/trận.

Phòng Lửa liền kề đã có art/ba puzzle props và năm waypoint riêng trong006F. [Cách đi tuyến hai phòng](PHONG_LUA.md). Bốn vùng trước còn debug; độc lập world/UX acceptance chưa chạy.
