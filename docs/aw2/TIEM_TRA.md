# Tiệm trà · Làng Giao Ước

AW2-016F mở một phòng con tùy chọn của Làng, dùng chung ở `/dev/aw2/game.html` và `/dev/aw2/world.html`.

1. Tại Làng, tới **Cửa tiệm trà** ở hiên phía bắc (điểm tiếp cận300,80). Nhấn E / Tương tác → **Vào tiệm trà**.
2. Tới **Bàn đội đồng hành**: xem bộ sưu tập, chọn năm người đã sở hữu và lưu đội. Trên map vẫn chỉ có một đại diện. Đóng khi chưa lưu bỏ bản chọn nháp.
3. Tới **Góc nhật ký và công thức**: đọc nhiệm vụ hoặc định lượng Chén cơm ấm từ túi thật. Đọc và lật trang không ghi save hay tự nấu.
4. **Lưu vị trí** ghi vị trí trong phòng. Tải lại vẫn đứng đúng nơi. Ghé nhanh TCG/Auto Chess rồi trở về cũng giữ vị trí này.
5. Tới **Ra hiên**, tự tương tác để về đúng vị trí/hướng ngoài cửa lúc vào. Chỉ đường nhiệm vụ trong phòng đưa tới cửa trước; không tự chuyển cảnh.

Ảnh/cảnh đích được dựng xong trước khi ghi save. Có thể hủy lúc tải/dựng. Nếu lỗi ảnh hoặc ghi dữ liệu, cảnh nguồn và bản lưu trước được giữ để thử lại. Tab cũ phải Đọc lại. Lỗi GPU sau khi ghi thành công dùng thông báo lỗi bản đồ/Đọc lại theo hợp đồng016D.

Save mới dùng schema6: `interior` lưu vị trí trong phòng, còn zone/x/y/facing giữ điểm ngoài hiên. Save1–5 được đọc trong bộ nhớ; không ghi đè cho tới thao tác lưu rõ ràng tiếp theo. Không reset, thêm quest/NPC/phần thưởng/mua bán hoặc thay đổi gacha.

## Tài nguyên và provenance

Ảnh nguồn nguyên bản, tạo bằng OpenAI image_gen, giữ nguyên PNG đã chọn và đóng WebP lossless exact-RGBA:

- `dev/aw2/assets/environments/village-tea/v1/floor-source.png` → `floor.webp` (1536×1024).
- `dev/aw2/assets/environments/village-tea/v1/props-source.png` → `props.webp` (1536×1024, alpha thật; bàn đội/bàn sách/ngưỡng cửa).
- [Prompt chính xác và tham chiếu](../../dev/aw2/assets/environments/village-tea/v1/prompts.json).
- [Manifest/hash/frame/budget](../../src/aw2/assets/village-tea.environment-v1.json); builder `dev/tools/build-aw2-tea-room.py`.

Hai ảnh runtime mới3.403.990bytes; decoded RGBA12.582.912bytes, cộng leader lớn nhất vẫn dưới24MB. Chỉ tải ảnh của phòng đang vào, không tải trước các vùng khác. Quyền thương mại vẫn REVIEW_REQUIRED; đây là nội thất tham chiếu cho phát triển, chưa cấp fullEnvironmentComplete hoặc nghiệm thu thiết bị.

Demo90% / product≈40%(35–45%) giữ nguyên. [Hợp đồng](tasks/AW2-016F.md) · [Bằng chứng](evidence/AW2-016F.md).
