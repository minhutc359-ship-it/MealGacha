# Web 5.9.5 — nhóm Vị Linh P2 đầu tiên

Theo `../web-v591/PLAN_SOURCE.md`, tiếp nối bản 5.9.4 đã được merge vào master `444edc0`. Đợt này nâng bốn nhân vật Auto Chess giá 4–5 vàng: Bánh chưng, Chả cá Lã Vọng, Bún thang, Bánh cốm Hàng Than. Giữ nguyên Character ID, party starter, bộ sưu tập, tiến trình, chỉ số, skill, độ hiếm, điều kiện mở khóa và kết quả chiến đấu.

## Nhận diện đã đối chiếu

Catalog và model gốc rosterD/F/G cùng chỉ về một thiết kế, trong khi chân dung Spirit 5.1 cũ lần lượt là mèo, rùa, chim dạng thú và hươu. Bốn portrait đó không còn quyết định ngoại hình runtime của các ID này. Giữ artwork món ăn/tranh thẻ đã phù hợp và atlas cũ phục vụ các nhân vật còn lại.

| Character ID | Thiết kế giữ lại và hoàn thiện | Gesture / VFX riêng |
| --- | --- | --- |
| banh-chung | Linh quy xanh, kiện lá vuông lớn buộc lạt đỏ, giáp hạt gạo, khiên trống đồng và đoản côn | Bước nặng, nâng/đẩy khiên; kết giới lá vuông, lạt đỏ và viền đồng |
| cha-ca-la-vong | Lão cá chép xanh, râu trắng, áo dài chàm viền vàng, mũ học giả và gậy chảo | Bước chậm, dẫn gậy chảo; xoáy chảo vàng, thủy lưu và thì là |
| bun-thang | Thiếu nữ hạc dạng người, tóc trắng dài, áo dài vàng ngà, cánh lông trắng, gậy bát | Chuyển động nhẹ, mở tay/cánh, dẫn bát; ba dải chỉ vàng và nét hạc trắng |
| banh-com-hang-than | Tiên yến dạng người, tóc bob tím, áo dài mint/tím, phù hiệu bánh vuông, cánh và dải lụa | Xoay bước, dệt lụa bằng tay; nút ngọc, vòng tơ mint/tím và đuôi yến |

Không đổi Bún thang/Bánh cốm thành thú đầu chim chỉ vì tên catalog có chữ hạc/yến; giữ gương mặt và trang phục của model đang dùng. Không thêm aura lớn che bảng đấu để biểu thị độ hiếm; các chỉ dấu cấp bậc trên UI tiếp tục dùng hệ thống hiện có.

## Phần đã tích hợp

- Mỗi nhân vật: tám trạng thái vật lý × bốn pose — idle, walk, attack, cast, ultimate, hit, death/fall, victory. Summon/guard/stun tái sử dụng pose tương thích và không được tính là ba bộ tranh mới.
- Adventure combat dùng bản pixel 256×512 / ô 64 px; Auto Chess và TCG dùng HD 1024×2048 / ô 256 px. Manifest dùng chung identity, portrait, sound, contact, anchor và timing. Không tự thêm NPC hoặc đổi party khám phá trên map.
- Bốn portrait standalone 512×512 đi qua `SpiritArt` hiện có. Mỗi ultimate có ba frame VFX riêng: gather, impact, finisher. Atlas nguồn 3×4 được đăng ký thành 4 cột nhân vật × 3 hàng giai đoạn ở runtime.
- Nguồn pose chia hai sheet 4×4 để tăng không gian cho trang phục/vũ khí. Công cụ hỗ trợ nhiều nguồn bổ sung trong cùng sidecar và báo lỗi nếu thiếu pose; vẫn xuất đúng atlas thống nhất. Crop mở rộng kèm chọn component actor để giữ đầu gậy vượt lưới nhưng không lấy nhân vật kế bên. Tư thế nằm cuối được vẽ sửa riêng; không dùng phiên bản bị cắt vũ khí.
- Renderer chung dùng pixel đã có trong trận khi HD chưa sẵn sàng, chuyển sang HD sau load mà không vẽ hai actor. Ảnh tải lỗi được bỏ khỏi cache khi consumer cuối giải phóng để lần tung chiêu sau có thể thử lại khi có mạng; không giữ ảnh lỗi trong cache mãi.
- Model không mang sẵn hào quang/particle. Một actor và một VFX chính qua renderer native hiện có; texture hoặc geometry được chọn độc quyền, không vẽ chồng fallback/phim/cut-in. Các impact VFX được đăng ký theo component chính để bỏ mảnh ô lân cận.
- Timeline 0/360/960/1500/1980/2400 ms; SFX hiện có căn impact 960 ms. Thời điểm tính toán reducer giữ nguyên, contact do lớp trình bày đồng bộ. Pause, reduced motion, skip và cleanup kế thừa hệ thống chung.
- Gỡ bốn MP4 đã hết consumer, **5.887.986 byte**; không tạo bản sao phim. Các nhân vật còn dùng video tiếp tục lazy load. Không tăng giới hạn JS, tổng build hoặc cache.

## Asset bổ sung

Thư mục `public/assets/characters/rare595/`:

| ID | HD | Pixel | Chân dung |
| --- | --- | --- | --- |
| banh-chung | banh-chung.webp | banh-chung-pixel.webp | banh-chung-portrait.webp |
| cha-ca-la-vong | cha-ca-la-vong.webp | cha-ca-la-vong-pixel.webp | cha-ca-la-vong-portrait.webp |
| bun-thang | bun-thang.webp | bun-thang-pixel.webp | bun-thang-portrait.webp |
| banh-com-hang-than | banh-com-hang-than.webp | banh-com-hang-than-pixel.webp | banh-com-hang-than-portrait.webp |

Thêm `ultimate.webp` 12 ô VFX. Tổng 13 WebP / 272 ô và ảnh: 128 HD, 128 pixel, bốn portrait, 12 VFX. Bốn MP3 được cập nhật ở đường dẫn cũ. Byte, hash và kích thước có trong `asset-qa.json`; prompt, nguồn, SHA-256 và đăng ký ô ở các JSON cùng thư mục. Asset dùng Imagegen tích hợp, không dùng CLI/API ngoài.

## Còn lại trong roadmap

Chưa nghiệm thu toàn bộ Web 6.0. Cần chơi thử điện thoại/máy yếu và tiếp tục các nhóm P2 còn lại, quái/tinh anh/boss P3. Tám trạng thái hiện dùng pose và nội suy cơ thể; chưa có rig skeletal/mesh, chạy riêng, turn-in-place hay lip-sync. Pixel combat là bản nearest của cùng thiết kế; chỉ tạo bộ đi bốn hướng riêng khi có consumer khám phá thực tế.

Những thẻ chưa có bộ chuyển động đầy đủ vẫn được liệt kê trong audit. Hash khác nhau không chứng minh artwork khác nhau về mỹ thuật. Mười ba chứng cứ quyền của asset cũ vẫn pending; không tự coi đã được giải quyết. Kết quả thực đo và giới hạn kiểm thử ở `VERIFICATION.md`, danh sách file/module ở `CHANGED_FILES.md`.
