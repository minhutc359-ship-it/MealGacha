# Web 5.9.9 — Tám quái thường hậu truyện

Tiếp nối 5.9.8 tại `48745288435b91ba2bb96d0fe00f3ebb5fa02f37` (PR #59). Nhánh `feat/web-v599-campaign-creatures`; chỉ web, không tự merge. Theo yêu cầu của bạn, test trên thiết bị vật lý và review PR do bạn thực hiện; tài liệu `HUMAN_QA.md` giúp nghiệm thu.

## Đã triển khai

| Vùng | Nhân vật giữ nguyên ID |
|---|---|
| Đỉnh Trà Mây | Bướm Trà Ngọc (`tea-moth`), Vệ Binh Ngọc (`jade-sentinel`) |
| Lò Muối Đỏ | Bọ Muối Đỏ (`salt-scarab`), Kỵ Sĩ Lò (`kiln-knight`) |
| Đầm Sen Nguyệt | Sứa Nguyệt (`moon-jelly`), Bọ Ngựa Sen (`lotus-mantis`) |
| Điện Vạn Hương | Diều Gia Vị (`spice-kite`), Hộ Vệ Hương (`bronze-warden`) |

Mỗi loài có 32 pose mới từ Imagegen: idle, locomotion, attack, cast, special/brace, hit, fall và victory; bốn pose mỗi trạng thái. HD 1024×2048, pixel 256×512, cùng pivot chân và một scale xuyên suốt. Di chuyển dùng cánh, chân hoặc xúc tu theo đúng loài. Giữ nguyên giáp, khiên, kiếm/thương và nhận diện từ campaignA/B. Đây là pose atlas, chưa phải rig hay run/turn nhiều hướng. Hàng special không tạo thêm kỹ năng hoặc pha boss cho quái thường.

Tám motif VFX riêng: lá trà, hộ ấn ngọc, tinh thể muối, vệt nhiệt lò, xúc tu/nguyệt, lưỡi cánh sen, lông diều và hoa văn khiên đồng. Đòn thường dùng contact 300 ms; kỹ năng dùng 380 ms, bám mục tiêu thật trong event. Ba quái phòng thủ có pose guard theo kỹ năng khiên thật; giảm chuyển động giữ pose chống đỡ 18. Không dùng kit/âm thanh hero cho quái.

24 WebP mới tổng **4.208.768 byte**, gồm 16 atlas và tám portrait lấy từ idle. Cộng với 5.9.8, cả **16 đối thủ của bốn vùng hậu truyện** đã có bộ pose HD/pixel mới. Tài nguyên campaignA/B cũ vẫn được giữ. Prompt, hash và biên đăng ký ở `asset-provenance.json`; dùng built-in Imagegen, không dùng CLI/API bên ngoài. Asset runtime được lưu dưới `public/assets/characters/campaign599/`.

## Bảo toàn gameplay

Không sửa engine, skill, damage, chỉ số, cooldown, năng lượng, mở khóa, phần thưởng, roster, collection hoặc save schema/version. Không thêm tám quái vào pool Auto/TCG. Không thêm dependency runtime, video hoặc preload cả roster. Manifest/resolver/CharacterSprite dùng chung bộ pose đã có; các atlas boss/hero trước được giữ nguyên.

Các kiểm tra trong môi trường phát triển được ghi ở `VERIFICATION.md`, dung lượng ở `metrics.json` và `initial-load.json`. `ROADMAP_STATUS.md` nêu rõ phạm vi còn lại của Web 6.0.
