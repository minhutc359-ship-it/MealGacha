# Web 5.9.8 — Tinh anh và boss hậu truyện

Tiếp nối 5.9.7 (`c79100d7223e04e3af45d466fc1d556f1971e3eb`, PR #58). Nhánh riêng `feat/web-v598-campaign-bosses`; không tự merge. Đợt này hoàn thiện nhóm P3 của bốn vùng hậu truyện, chưa phải nghiệm thu toàn bộ roadmap Web 6.0.

## Hình ảnh và chuyển động

Tám nhân vật giữ nguyên ID, nhận diện và trang bị từ atlas campaignA/B: Trà Sư Vân / Ấm Trà Vân Thiên; Luyện Sư Muối / Cự Tượng Muối Lò; Tư Tế Nguyệt / Nguyệt Hạc Trấn Đầm; Nhạc Trưởng Hương / Nhiếp Chính Vạn Hương.

Mỗi nhân vật có 32 pose vẽ riêng: idle, walk, attack, cast, phase/special, hit, fall và victory, mỗi trạng thái bốn pose. Bản HD 1024×2048 và bản pixel 256×512 cùng pivot chân, scale cố định trên toàn bộ pose. Chân dung lấy trực tiếp từ idle của chính nhân vật. Đây là atlas pose, chưa phải skeletal rig, run/turn bốn hướng hay lip-sync. 16 nguồn Imagegen mới, tham chiếu đúng hình gốc; prompt, hash nguồn, biên đăng ký và hash output được ghi trong `asset-provenance.json`. Bảng kiểm hình ở `qa/pose-contact.webp`.

Manifest đối thủ tách khỏi manifest Vị Linh để không gọi nhầm awakening/SFX của hero. CharacterSprite, resolver và Auto actorPose cùng đọc bộ pose này. Adventure dùng bản pixel. Auto Chess và TCG giữ nguyên pool, luật và điều kiện xuất hiện; không thêm tám boss vào mode vốn không có chúng. Resolver/portrait chung sẵn sàng cho consumer hiện hữu.

## Độ rõ chiến đấu

- Vùng báo chiêu hiện quanh đúng người có thể bị ảnh hưởng, có fallback khi hàng được báo không còn ai. Hỗ trợ dùng dấu cộng và màu xanh; mục tiêu địch dùng hình thoi. Khi boss Nguyệt Hạc/Nhiếp Chính chuyển sang đánh toàn đội, cả HUD và vùng báo đều phản ánh phạm vi đó. Bao gồm hồi/khiên và các tác động phụ ở Hard/Extreme.
- Boss còn sống phát pose chiến thắng khi đội người chơi gục; đồng minh gục vẫn dùng pose fall. Pose channel giữ trạng thái tụ lực cho tới khi reducer giải quyết hoặc ngắt chiêu. Báo chiêu/halo mất khi nguồn gục, choáng, không đủ năng lượng, hết hạn hoặc trận kết thúc; bản lưu cũ vẫn dùng điều kiện năng lượng cũ.
- Bốn motif riêng: vòng trà mây, tinh thể muối, cánh/nguyệt và vòng hương bốn màu. Impact dùng mục tiêu thực của sự kiện và contact 380 ms; chuyển pha dùng sự kiện boss một lần tại nguồn. Không phát VFX cảnh báo như thể đã gây sát thương.
- Dùng đồng hồ canvas có sẵn, không thêm React state mỗi frame hay dependency runtime. Pause, ẩn tab, reduced motion và render nhẹ được giữ. VFX chờ pha vào sân kết thúc trước khi phát; snapshot đang pause không làm cue hết hạn ngầm.

## Bảo toàn gameplay

Không thay engine, chỉ số, damage, skill, cooldown, năng lượng, phần thưởng, mở khóa, roster, collection hoặc save schema/version. Các atlas campaignA/B còn lại vẫn được giữ cho tám quái thường chưa nâng cấp và các bản lưu tương thích. Bộ test mới kiểm tra mapping, pose contact, ngắt chiêu, phase một lần, phạm vi toàn đội/fallback và tính bất biến của snapshot khi đọc presentation.

24 WebP mới tổng **5.235.260 byte**. Không thêm âm thanh/video. Bản dựng và tải ban đầu đo riêng trong `metrics.json` và `initial-load.json`; không tăng ngân sách đã duyệt. Chi tiết kiểm chứng và giới hạn ở `VERIFICATION.md`; toàn bộ việc còn lại được ghi ở `ROADMAP_STATUS.md`.
