# Web 5.9.22 · Sáu Vị Linh Tây Bắc

Tiếp tục sau 5.9.21 trên cùng PR #77. Sáu ID đang dùng portrait tĩnh được nâng lên model chiến đấu 32 pose và VFX sơn ba pha, giữ nguyên portrait canon.

| ID | Nhận diện giữ nguyên | VFX |
|---|---|---|
| banner-tay-bac-goi-rau-don | Linh quy, mai đồng, chuỗi ngọc hổ phách, quyển thư | Khiên mai lục giác, hổ phách và dải dương xỉ |
| banner-tay-bac-com-lam | Phượng trắng-đỏ, mào vàng, áo trắng-đỏ-vàng, quyển thư | Phượng vũ trắng-đỏ và tàn lửa |
| banner-tay-bac-thang-co | Cú trắng-nâu, mắt vàng, cánh bướm hổ phách, áo đen-vàng | Điệp quang hổ phách và hạt sáng |
| banner-tay-bac-thit-trau-gac-bep | Tê tê vảy đồng, áo đen-đỏ, khăn đỏ, quyển thư | Vảy đồng và dải lụa đỏ |
| banner-tay-bac-ga-nuong-mac-khen | Rái cá nâu-kem, râu trắng, chuỗi hổ phách, quyển thư | Chuỗi kim châu và vệt gió trắng |
| banner-tay-bac-xoi-ngu-sac | Bạch lộc mắt đỏ, gạc vàng, bờm/dải tím, áo ngũ sắc | Gạc vàng, dải tím và tia ngũ sắc |

## Sản xuất và tích hợp

- Built-in Imagegen tạo 12 sheet 4×4 theo portrait gốc. Mỗi ID có bốn pose cho idle, walk, attack, cast, ultimate, hit, fall và victory: tổng 192 pose. Xuất 12 atlas HD/pixel; portrait cũ giữ nguyên ô 10–15 trong `portraits-7.webp`.
- Hai sheet VFX tạo thành một atlas 1536×768, sáu cột × ba pha: tụ lực, tác động, tan biến. Ranh giới hàng/cột nguồn được đăng ký theo phần tranh thực tế để không cắt glow hoặc lấy lẫn mảnh của ô kế bên. `vfx-provenance.json` ghi prompt, hash, kích thước và crop. Hai sheet pose Linh quy/Rái cá cũng dùng ranh giới hàng/cột đo từ nguồn để tránh lẫn dải chân/glow vào pose khác.
- Asset runtime: `public/assets/characters/northwest5922/`; compositor và cache chung hiện có, không thêm renderer hoặc dependency runtime. TCG/Adventure dùng sáu model mới; không thêm quân vào roster Auto Chess.
- Loại metadata `title` chỉ thuộc manifest hình ảnh và không có consumer. Tên thẻ, tên nhân vật và tên chiêu đang hiển thị vẫn lấy từ catalog/awakening như trước. Giữ giới hạn JS hiện tại.
- Bước làm ấm cache khi service worker đầu tiên tiếp quản nay bao gồm ảnh đã tải qua Canvas/CSS. Kiểm tra production đợi media đã vào cache và xác nhận ảnh/VFX tải lại offline không lỗi. Không đổi cách cập nhật phiên bản hoặc dữ liệu người chơi.
- Giữ nguyên ID, chỉ số, kỹ năng, độ hiếm, mở khóa, âm thanh, contact, schema, tiến trình, collection và networking. Không thêm video hoặc tăng ngân sách.

## Ảnh kiểm tra

Theo yêu cầu mới, ảnh QA được giữ cục bộ trong `.asset-work/`. 17 ảnh của 5.9.21 đã được loại khỏi cây file của PR đang mở; ảnh runtime dùng trong game vẫn được commit. Inspector và các browser harness liên quan mặc định ghi ảnh vào `.asset-work/qa/`; chỉ báo cáo chữ/JSON và provenance nằm trong Git. Quy tắc cũng được ghi trong `dev/AGENTS.md` và `.gitignore`.

Prompt và hash: `asset-provenance.json`, `identity-sources.json`, `vfx-provenance.json`. Xem `VERIFICATION.md` và `ROADMAP_STATUS.md` để biết kết quả kiểm tra và phần còn lại. Chỉ web; chủ dự án review thiết bị vật lý và quyết định merge.
