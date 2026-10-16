# Chuẩn nhân vật Soul of Meal · 5.9

Phạm vi chuẩn là bộ 5 Vị Linh khởi đầu đang tồn tại trong save. Không tạo ID mới khi đổi phong cách, không thay đổi đội hình, mức mở khóa, kỹ năng, sát thương hoặc phần thưởng.

| ID chuẩn | Nhận diện phải giữ | Chuyển động | Dấu hiệu VFX |
| --- | --- | --- | --- |
| `com-tam` | Kim sư; sư tử trắng, bờm vàng, giáp đồng, khăn đỏ, ngọc; khiên tròn và chùy muôi | Bước nặng, lấy đà, giáng chùy, dựng khiên | Trận địa đồng thấp, chấn động chân |
| `banh-mi` | Hỏa vũ; hồ ly đỏ, mõm/đuôi trắng, khăn đỏ, song đao, ngọc hình khuyết | Bước nhanh, giao đao, lướt chém, chào đao | Đường chém chéo nối tiếp |
| `pho-bo` | Long lưu; bạch long, râu trắng, sừng vàng, áo ngọc lam, trượng | Nhịp chậm, xoay trượng, phóng dòng nước | Nét thủy long uốn lượn và sừng |
| `banh-cuon` | Vân cuộn; thỏ trắng, hoa trắng, áo ngà/xanh, quạt tre và lụa | Bước nhẹ, phẩy quạt, mở lụa, cúi chào | Hai dải lụa mở và giao nhau |
| `goi-cuon-tom-thit` | Ngọc lâm; bạch lộc, sừng lá/hoa, áo xanh/ngà, trượng gỗ chạc | Trụ vững, chạm trượng, nâng sừng, ban phúc | Lá nở theo các hướng từ chân |

`goi-cuon` là alias Auto Chess có chủ đích của `goi-cuon-tom-thit`. Không sinh thêm Vị Linh hoặc sửa dữ liệu sở hữu vì alias này. Danh sách starter duy nhất nằm ở `src/game/starterCharacters.ts`; engine, pose selector, model resolver và hiệu ứng cùng tham chiếu danh tính này. Artwork TCG giữ portrait gốc để bảo toàn phong cách và bản sắc.

## Model và atlas

- Mỗi starter có atlas chiến đấu WebP riêng, 1024 × 2048, 4 cột × 8 hàng. Ô 256 × 256; chân tại (128, 240); khung trong ô tối đa 224 px. Khi đóng atlas dùng một scale duy nhất cho toàn bộ nhân vật, không phóng từng pose độc lập.
- Hàng theo thứ tự `idle`, `walk`, `attack`, `cast`, `ultimate`, `hit`, `fall`, `victory`; mỗi hàng 4 pose thực. Atlas có alpha thật, không nền checkerboard, không chữ; ảnh gốc giữ các phụ kiện nhận diện. Những vệt năng lượng đã nằm trong pose không được vẽ thêm tại cùng vị trí.
- Mỗi atlas có bản 256 × 512 với ô 64 × 64, pivot (32, 60), lấy mẫu nearest-neighbor. Đây là biến thể pixel của artwork chiến đấu, không phải tuyên bố đã vẽ tay lại toàn bộ pixel. Adventure dùng biến thể này, Auto Chess/TCG dùng bản chi tiết. Thêm biến thể mới bằng asset path/metadata, không bằng bản sao gameplay ID.
- Atlas làng riêng 768 × 448: 12 cột × 7 hàng; ô 64 px. Mỗi nhân vật có 3 frame cho mỗi hướng Down/Left/Right/Up. Hàng là người chơi, Lả, Chú Tâm, Bà Sen, Bách, Lửa Nhỏ, Lam Lam. Các hướng phải là góc nhìn thật, không thay thế hướng lên bằng lật ngang.
- Làng dùng ô vuông và `image-rendering: pixelated`; không kéo sprite theo tỷ lệ khung chứa. Bóng chân nhỏ, không glow quanh toàn nhân vật. Sắp thứ tự NPC/nhóm theo vị trí chân trên đường; giữ route và các điểm tương tác đã có.

## Animation và tuyệt kỹ

Không cross-fade giữa hai pose chiến đấu. Mỗi lần chỉ vẽ một silhouette. Bổ sung chuyển động thân nhẹ trên key pose; biên độ không che mất nhịp vũ khí. Idle/walk có chu kỳ riêng từng starter. Death dừng ở pose nằm; attack/cast/hit kết thúc trở về idle; victory có nhịp riêng.

| Pha tuyệt kỹ | Mốc thời gian | Chủ thể chính |
| --- | --- | --- |
| Preparation | 0–359 ms | Nhân vật lấy đà, chưa có va chạm |
| Casting | 360–959 ms | Pose dẫn lực, một đường dẫn tới đích |
| Impact | 960–1499 ms | Pose tiếp xúc và VFX tại mục tiêu |
| Finisher | 1500–1979 ms | Dấu hiệu riêng của nhân vật |
| Recovery | 1980–2399 ms | Rút hiệu ứng, trở về tư thế bình thường |

Toàn cảnh dùng chung clock đã tích lũy. Pause/ẩn tab không tính thời gian; skip kết thúc phần trình bày một lần. Retry lỗi lưu không recast. Nhạc/SFX lấy vị trí phát từ cùng clock, các bản thu starter có impact tại 0,96 s. Giữ thời lượng 2,4 s và dùng chế độ giảm chuyển động tĩnh.

Đối với nhân vật khác, MP4 và fallback art loại trừ nhau. Không đặt portrait/canvas độc lập trên video đã render. Bảng tên tuyệt kỹ trong trận chỉ có chữ và tối đa một dòng liên hương.

## Logic và hiển thị sát thương

Engine vẫn ghi nhận hành động và kết quả ngay tại action như trước. Lớp trình bày chỉ giữ HP/khiên/nhãn số trước va chạm rồi cập nhật tại 300 ms (đánh thường), 380 ms (kỹ năng), 960 ms (tuyệt kỹ). Không tính lại damage khi animation xong. Khi reload, dùng snapshot đã lưu; không phát lại phần thưởng.

Auto Chess lấy contact từ `action.hit`, không lấy thời gian giả định của video. TCG lấy mốc 560 ms đang có. Nếu tốc đánh thay đổi, pose tiếp xúc phải đổi theo hit; không sửa thời gian engine để khớp một atlas.

## Phân lớp và vòng đời

- Sàn 0; diễn viên theo depth 10–90; một canvas VFX 100; nhãn 110; typography trạng thái 120. Cinematic nằm trong portal riêng, chỉ một renderer sở hữu mỗi cảnh.
- VFX xếp theo serial, gộp cùng source/tick/animation, tối đa 12 cue; tối đa 5 mục tiêu, preset nhẹ 3. Effect thường sống tối đa 1100 ms, ultimate 2400 ms. Không vẽ nhiều lần cùng một impact bằng cả texture lẫn shape.
- Khi mở cinematic: xóa queue sân, tăng watermark serial; sau đóng không replay các event cũ. Đổi battle/wave/reload/reduced-motion/unmount đều dọn queue thích hợp.
- Release image lease, observer, visibility listener và subscription khi unmount. Dùng image cache với giới hạn decoded-byte hiện có. Không preload movie starter đã nghỉ dùng; preload âm và lấy atlas qua cache.
- Một clock dùng chung 30/60 FPS, không React setState mỗi frame. Chỉ cập nhật UI khi tới mốc contact hoặc đổi pha. Không sửa engine, RNG hay timestamp save bằng clock hiển thị.

## Tài nguyên, ngân sách và quy trình

Đường dẫn: `public/assets/characters/starters590/<id>.webp`, `<id>-pixel.webp`, `village-pixel.webp`. Metadata nằm ở `src/game/autochess/spriteFrames.json`; không suy ID/row bằng vị trí sắp xếp của catalog. Prompt/provenance: `artwork.json`. Script đóng atlas: `dev/tools/pack-starters590.py`.

Giữ artwork đạt chất lượng. Rà trùng bằng `(sheet,row)` và hash ảnh; phân biệt alias của cùng nhân vật với tái dùng model cho nhiều danh tính. Không đổi toàn bộ atlas chỉ vì dùng chung file. `model-audit.json` liệt kê nhóm dùng chung và danh sách artwork fallback để sản xuất nhân vật tiếp theo có mục tiêu. Fallback tĩnh vẫn dùng artwork đúng ID; không gắn model starter cho một nhân vật khác theo hệ. Không gọi một portrait tĩnh là bộ animation hoàn chỉnh.

Không tăng giới hạn phát hành để che lỗi kích thước. Bản 5.9 thay 5 MP4 bằng atlas/timeline và bỏ ảnh trạng thái đã nghỉ dùng; giữ giới hạn tĩnh và JS của master. Không thêm dependency runtime. Các ảnh QA không vào dist; không commit toàn bộ bộ ảnh QA lớn.

Quy trình cho nhân vật thứ 6: chọn ID hiện có → khóa silhouette/palette/phụ kiện với portrait → tạo 8 hàng pose → kiểm ô/pivot/alpha → đăng ký biến thể → nối animation và contact thật → viết geometry VFX riêng → nối năm pha/SFX → kiểm trong trận, pause/skip/reload, nhiều cast, viewport nhỏ/ngang → chạy typecheck/test/catalog/assets/release guard/size → ghi rõ giới hạn kiểm chứng.

Nghiệm thu cần hình chụp gameplay thật và log kiểm thử; mẫu FPS headless không thay thế kiểm tra Safari iOS/Android và đánh giá âm thanh trên thiết bị thật.
