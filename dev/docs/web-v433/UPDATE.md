# Web 4.3.3 · Adventure trong một màn hình

## Giới thiệu

Mỗi demo có **Ẩn chú thích / Hiện chú thích**. Ẩn bỏ tiêu đề, lời giải thích và thanh tiến trình; màn chơi lấy lại toàn bộ viewport, chỉ còn cụm điều khiển nhỏ ở góc dưới (hiện lại, tạm dừng, xem lại, đóng). Timeline 25 giây và dữ liệu fixture giữ nguyên. Dialog luôn có tên truy cập ngay cả khi ẩn tiêu đề. CSS gameplay TCG và Auto chess được nhập đủ khi mở demo từ bất kỳ route nào; trước đó mở từ Adventure thiếu marketHud/characterMotion/compactScreen, làm bảng tộc nghề và model tràn khỏi slot.

## Adventure

- Bản đồ, camera, D-pad và Tương tác trong một viewport dọc hoặc ngang. Tile scale lấy cả chiều rộng và chiều cao khả dụng; camera tính số ô nhìn thấy theo viewport để tránh vùng trống bên dưới trên màn hình dọc.
- Chạm điểm để tự đi; chạm NPC/cửa để đến tương tác. Giữ nút hướng để đi liên tục; thả, hủy pointer, chuyển bản đồ, vào trận, mở bảng, mất focus hoặc chuyển tab thì dừng.
- Hành trình / Đội & túi / Sổ / Hướng dẫn mở dialog trên bản đồ. Bàn phím và đường đi nền bị khóa khi mở bảng; Esc/đóng trả focus. Danh sách dài cuộn trong bảng, không kéo cả trang chơi. Đóng tủ cũng đóng storage service.
- Nhiệm vụ vùng hiển thị trong HUD. Bếp Nghỉ, Tiệm Hương, Nhà Ký Ức, đấu NPC, 5 thử thách giữ ấn và luật PP/tương khắc vẫn dùng reducer hiện tại.
- Vị Linh dùng cùng `tcgCharacter` + `CharacterSprite`/atlas như TCG/Auto, gồm idle, summon, attack, cast, hit và mirror. Cue trận lấy từ thay đổi HP/PP/đội và thứ tự tốc độ; không thay đổi sát thương hay luật lưu. Loader demo dùng cùng mapping để tránh gọi trực tiếp Auto unit ID với loài chỉ có trong TCG.
- Năm đầu bếp dùng living atlas chung; các nhân vật khác giữ sprite đi bốn hướng với chân dung chung TCG/Auto. Nhà, cây, cỏ, biển giữ tileset hiện có. Đây vẫn là bản đồ **2D**, chưa dựng thế giới 3D hoặc thêm atlas đi bốn hướng mới cho mọi NPC.
- Dùng asset hiện có, không thêm ảnh hoặc audio. Reduced motion/low graphics và tạm dừng demo truyền tới renderer chung.

## Tham khảo

[Pokémon Moon – Nintendo](https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Pokemon-Moon-1092369.html) mô tả khám phá vùng gắn với thử thách đa dạng và trận thử thách lớn. Áp dụng vào cách trình bày mục tiêu vùng, không sao chép asset/map, không tuyên bố tái tạo toàn bộ Sun/Moon. Đợt này cải thiện trình bày và điều khiển của hệ thống nhiệm vụ hiện có; chưa bổ sung cơ chế Ride/Totem/Z-Move.

## Dữ liệu và phạm vi

Web only. Không sửa Android/iOS, không đồng bộ native, không đổi schema save hay migration. Demo không tiêu đồ, không nhận thưởng và không ghi save thật. Branch từ master sau PR #32; không tự merge.

## Kiểm chứng

395 test / 38 file; typecheck app/dev, catalog, asset và release records. Bộ kiểm tra `dev/tools/verify-web433.mjs` dùng Chromium local, gồm màn hình 1440×900, 390×844, 320×568, 844×390: viewport/controls, keyboard isolation, ẩn/hiện chú thích, renderer chung, save trước/sau demo và reload. Fixture trận thật kiểm tra guard tăng lượt, atlas tải, đổi đội/túi. TCG/Auto/Rương kiểm tra toggle và giữ save; D-pad giữ/thả kiểm tra không đi tiếp sau khi thả. Không dùng link bypass Vercel; chưa kiểm tra Safari hoặc thiết bị thật.

Build sạch: **63.788.611 byte / 100 MB**, JS gzip **605.540 / 650.000 byte**, CSS gzip **88.141 byte**, 425 file, 0 leak. Không thêm tài nguyên raster hoặc audio.
