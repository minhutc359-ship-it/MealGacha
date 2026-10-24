# Khám phá sáu vùng AW2

Chạy `pnpm dev`, mở `/dev/aw2/world.html` bằng hồ sơ chơi thử riêng. Tạo bản lưu AW2 nếu chưa có; tiếp tục bản lưu cũ bằng Đọc lại. Một nhân vật đầu đội đã lưu đại diện trên map; đội combat vẫn năm người.

Cả sáu vùng có **Bám nhân vật / Toàn cảnh**. Chạm lối đi hoặc chọn điểm đến trong danh sách; khi đã tới gần, bấm E/Tương tác và chọn thao tác. Nút điểm đến chỉ đi bộ, không tự nhận nhiệm vụ, ký ức, quà hoặc qua cửa. Nhãn ra khỏi góc nhìn được ẩn, danh sách vẫn đầy đủ. Nhà/cầu/kệ trong cảnh bao quanh hiện là phong cảnh, không phải phòng mới có thể vào.

| Vùng | Điểm đến và tiến trình |
|---|---|
| Làng Giao Ước | Bà→Nhận nhiệm vụ; bàn→Đọc mảnh khăn; Bà→Hoàn tất nhập môn để nhận5starter/30XPmột lần |
| Phố Đèn Lồng | An→Nhận nhiệm vụ; nghe3NPC để ghi nhớ; trở lại An chọn nét chỉ. Chủ Bàn Bài/Bàn Cờ mở TCG/Auto Chess luyện tập, trở về đúng hành trình, không có thưởng |
| Sân Bếp Bỏ Quên | Dì cho nhiệm vụ Mở lại bếp; cửa Kho mở khi đã nhận. Bếp mở thì tới gần Dì để nấu/chia bữa. Lối tắt Phòng Bàn chỉ mở sau kết thúc |
| Phòng Kho | Bảng dấu hơi ghi gợi ý khi đúng nhiệm vụ. Rương4Gạo/3Rau/2Nước dùng chỉ nhận một lần; trạng thái Đã nhận dựa vào biên nhận lưu, không dựa vào số đồ còn lại |
| Phòng Lửa | Theo gợi ý: Mở lối thoát→Đặt nồi→Nhóm lửa. Sai thử lại không tốn đồ. Báo Dì rồi nhận nhiệm vụ tiếp |
| Phòng Bàn | Vượt boss với đội đã lưu; lưu kết quả, đọc ghi chép, trở về Bà chọn kết thúc. Sau kết thúc có đấu lại không thưởng và đường tắt hai chiều |

Khi ghi dữ liệu thất bại, bản lưu trước và trạng thái rương được giữ; thử lại rõ ràng sau khi kho lưu hoạt động. Nếu ảnh cần thiết không tải được, map báo lỗi, khóa điểm đến và không dùng hình debug thay thế; reload khi tài nguyên đã phục hồi. Không reset dữ liệu game cũ.

Hiện6/6vùng có ảnh tham chiếu;6vùng có phong cảnh mở rộng/camera. Phòng Lửa có kiến trúc bếp quanh nền gạch; Phòng Bàn có sàn gỗ/chiếu và khu bàn ghế ở rìa. Chọn Toàn cảnh để xem trọn phòng; Bám nhân vật dành cho di chuyển.Cả8NPC có hoạt ảnh đứng yên riêng: thở nhẹ, chớp mắt và cử chỉ; chưa có đi lại tự do/bốn hướng đầy đủ. Khi mở hội thoại, hoạt ảnh dừng; chế độ giảm chuyển động giữ tư thế tĩnh. Demo90%/product≈40%(35–45%) là mẫu số hoàn thiện riêng, không tăng từ số tệp/ảnh/test.

Ảnh mới tạo bằng **imagegen tích hợp**, nguồn PNG được giữ, WebP lossless và prompt/provenance/selection ở cùng thư mục:

| Bộ | Cảnh gốc | Bộ hình gốc | Prompt |
|---|---|---|---|
| Kho | [floor-source.png](../../dev/aw2/assets/environments/kitchen-pantry/v1/floor-source.png) | [props-source.png](../../dev/aw2/assets/environments/kitchen-pantry/v1/props-source.png) | [prompts.json](../../dev/aw2/assets/environments/kitchen-pantry/v1/prompts.json) |
| Phố | [floor-source.png](../../dev/aw2/assets/environments/lantern-street/v1/floor-source.png) | [props-source.png](../../dev/aw2/assets/environments/lantern-street/v1/props-source.png) | [prompts.json](../../dev/aw2/assets/environments/lantern-street/v1/prompts.json) |
| Lửa | [landscape-source.png](../../dev/aw2/assets/environments/kitchen-hearth/v2/landscape-source.png) | Giữ bộ puzzle/sideboard/threshold cũ | [prompts.json](../../dev/aw2/assets/environments/kitchen-hearth/v2/prompts.json) |
| Bàn | [landscape-source.png](../../dev/aw2/assets/environments/kitchen-table/v2/landscape-source.png) | Giữ boss riêng/ghi chép/sideboard/threshold cũ | [prompts.json](../../dev/aw2/assets/environments/kitchen-table/v2/prompts.json) |
| Sân | [floor-source.png](../../dev/aw2/assets/environments/forgotten-kitchen-yard/v1/floor-source.png) | [props-source.png](../../dev/aw2/assets/environments/forgotten-kitchen-yard/v1/props-source.png) | [prompts.json](../../dev/aw2/assets/environments/forgotten-kitchen-yard/v1/prompts.json) |

Quyền phát hành/full environment/NPC motion vẫn mở; nghiệm thu độc lập đang gác theo D20. [Bằng chứng kỹ thuật](evidence/AW2-006HJK.md), [làng](LANG_GIAO_UOC.md), [nâng hai phòng006L](tasks/AW2-006L.md), [chuyển động8NPC006M](tasks/AW2-006M.md), [tiếp theo006N](tasks/AW2-006N.md).


Các bộ NPC dùng imagegen tích hợp, nguồn PNG giữ nguyên và WebP exactRGBA.32frame/8NPC; riêng bộ Bàn Cờ có một bản bị loại vì mép chân bàn sát biên rồi sửa qua imagegen. Prompt/provenance/selection đặt cạnh ảnh:

| NPC | Ảnh gốc được chọn | Prompt |
|---|---|---|
| Bà Giữ Chỗ | [idle-source.png](../../dev/aw2/assets/npcs/giu-cho/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/giu-cho/idle-v1/prompts.json) |
| An Vá Đèn | [idle-source.png](../../dev/aw2/assets/npcs/va-den/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/va-den/idle-v1/prompts.json) |
| Người Bán Bữa Sáng | [idle-source.png](../../dev/aw2/assets/npcs/nguoi-ban/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/nguoi-ban/idle-v1/prompts.json) |
| Thợ Sửa Ghế | [idle-source.png](../../dev/aw2/assets/npcs/sua-ghe/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/sua-ghe/idle-v1/prompts.json) |
| Em Đem Nước | [idle-source.png](../../dev/aw2/assets/npcs/dem-nuoc/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/dem-nuoc/idle-v1/prompts.json) |
| Chủ Bàn Bài | [idle-source.png](../../dev/aw2/assets/npcs/ban-bai/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/ban-bai/idle-v1/prompts.json) |
| Chủ Bàn Cờ | [idle-source.png](../../dev/aw2/assets/npcs/ban-co/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/ban-co/idle-v1/prompts.json) |
| Dì Gác Bếp | [idle-source.png](../../dev/aw2/assets/npcs/gac-bep/idle-v1/idle-source.png) | [prompts.json](../../dev/aw2/assets/npcs/gac-bep/idle-v1/prompts.json) |
