# Web 5.9.24 · Sáu Vị Linh Nhật Bản

Sáu Vị Linh trước đây chỉ dùng portrait nay có model chiến đấu riêng 32 pose trong TCG, Adventure và mọi nơi dùng chung character manifest.

| ID | Nhận diện canon giữ nguyên | VFX trong đợt này |
|---|---|---|
| shoyu-ramen | Hồ ly cam-kem, tai lớn, trang sức sừng đen, nhiều đuôi và trượng nguyệt | Fallback atlas theo hệ |
| unagi-don | Ngọc thố trắng, tai dài, kimono trắng-đỏ-đen-vàng và trượng nguyệt | Fallback atlas theo hệ |
| omakase | Bạch sư bờm lớn, vương miện gạc, lễ phục đen-đỏ-vàng và trượng nhật | Fallback atlas theo hệ |
| tonkotsu-ramen | Hạc mào đỏ, lông đen-trắng, áo lam-ngọc-vàng và khiên sóng pha lê | Fallback atlas theo hệ |
| takoyaki | Hổ cam vằn đen, khăn lam, giáp đồng, hồng cầu và đèn lam | Fallback atlas theo hệ |
| okonomiyaki | Cẩm lý đỏ-trắng, kimono đen-đỏ, nón tròn và đèn lồng đỏ | Fallback atlas theo hệ |

Mỗi model có bốn pose cho idle, walk/glide, attack, cast, ultimate, hit, fall và victory; tổng 192 pose. Mỗi ID xuất atlas HD 1024×2048 và pixel 256×512. Portrait gốc không bị thay hoặc vẽ lại; manifest tiếp tục trỏ đúng các ô canon tại `portraits-3.webp` đến `portraits-5.webp`.

Theo ưu tiên hiện tại, đợt này chỉ làm model. Cả sáu ID có `effect: null` và `signature: none`: renderer không vẽ VFX nhận diện hình học; TCG, Adventure và Auto Chess tiếp tục dùng projectile/impact sơn sẵn theo hệ. VFX riêng có thể bổ sung ở cohort sau mà không đổi model hay save.

Asset runtime nằm trong `public/assets/characters/japan5924/`. Prompt cuối, hash nguồn, crop và output được ghi trong `asset-provenance.json`; portrait canon và hash atlas được ghi trong `identity-sources.json`. Sheet Shoyu Ramen support được tạo lại với gutter rộng sau khi packer phát hiện hai pose chạm ranh giới ô.

Không đổi kỹ năng, chỉ số, độ hiếm, unlock, ID, save/progress/collection, roster Auto Chess, tầm đánh Adventure hoặc networking. Bảng cohort được suy ra từ các dải manifest liên tiếp để bù dung lượng ID lặp, và `compatibility.json` xác nhận cả 77 manifest cũ giữ nguyên đệ quy mọi trường.

Chỉ web; chủ dự án review và quyết định merge.
