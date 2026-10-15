# Soul of Meal Web 4.6 · Adventure: điều khiển theo ô và renderer nhẹ

## Trải nghiệm chơi

Giữ WASD/mũi tên hoặc D-pad để đi liên tục. Nhịp đi do game quản lý, không phụ thuộc key-repeat của hệ điều hành: đi bộ 170 ms/ô, chạy 100 ms/ô. Chạm Đi bộ/Chạy để đổi tốc độ, hoặc giữ Shift trên bàn phím. Thả hướng, mất focus, đổi bản đồ, mở menu/lời thoại/trận đấu hoặc ẩn tab đều dừng đầu vào đang giữ. Chậm một frame không tạo một đợt bước đi bù.

Nhân vật và Vị Linh theo sau nội suy vị trí độc lập; camera bám theo vị trí đang hiển thị, giới hạn trong bản đồ và căn giữa nội thất nhỏ. Qua cửa/đi nhanh snap sang bản đồ mới, không trượt xuyên cảnh. Reduced motion tắt nội suy. Chạm một điểm để đi theo đường đã tính, chạm nhà để tới cửa, chạm NPC gần để tiến lại và quay mặt tương tác. Tương tác bằng A trên màn hình hoặc E/Z; X mở menu. Lời thoại có Tiếp tục và tạm dừng di chuyển. D-pad, chạy, A và menu cùng nằm trong màn hình; màn ngang chuyển cụm điều khiển sang bên phải. Giữ bốn lối tắt Hành trình/Đội/Sổ/Hướng dẫn.

Trận đấu có bốn lựa chọn chính **Chiến đấu / Túi đồ / Đổi Vị Linh / Rút lui**, rồi mở kỹ năng, PP, tương khắc hoặc vật phẩm. Sau một lệnh hợp lệ, đợi pha ra đòn và phản kích rồi trở về menu chính. Ref khóa ngay cả click lặp trước khi React vẽ lại; lỗi không tiêu lượt. HP hiển thị đổi ở nhịp trúng đòn theo thứ tự tốc độ, trong khi kết quả gameplay đã lưu nguyên tử. Arena giữ nguyên node qua lượt để tránh remount sprite, observer và môi trường. Demo dùng timeline riêng, không khóa hoặc sửa save người chơi.

Vòng chơi hiện có tiếp tục: chọn đồng hành → khám phá → nói chuyện/vào nhà → chạm trán hoang dã/NPC → kỹ năng, đổi đội, vật phẩm và thu phục → lên cấp, chữa HP/PP, tủ dự bị và ấn mở vùng. Giữ 20 bản đồ, đội 6, tủ 60, nội dung/cân bằng và phần thưởng đã có.

## Nghiên cứu Black/White

Nguồn chính thức đã đọc:

- [Pokémon White Version, Instruction Booklet](https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/DS_Pokemon_White), trang in 11/14/17–22: hướng/confirm/menu, các lệnh trận, HP/PP, thu phục, đội sáu, tủ và hồi phục tại Center. Đã xem hình bố cục trận ở trang PDF 9.
- [Iwata Asks, chương 2](https://www.nintendo.co.jp/ds/interview/irbj/vol1/index2.html): tổ chức tuyến phiêu lưu dễ theo dõi và thiết kế vùng như một thế giới thống nhất.
- [Iwata Asks, chương 4](https://www.nintendo.co.jp/ds/interview/irbj/vol1/index4.html): cho người chơi làm quen lần lượt với địa điểm và hệ thống.
- [Trang game Pokémon Black/White](https://www.pokemon.com/uk/pokemon-video-games/pokemon-black-version-and-pokemon-white-version/): thị trấn, thiên nhiên và hình gameplay.

Áp dụng cho Soul of Meal bằng điều khiển, nhịp bước, camera, tầng cảnh và menu/lượt chiến đấu. Giữ tài nguyên, nhân vật, kỹ năng và thế giới Việt Nam của project. Mùa, bản đồ Unova, multiplayer, tiến hóa Pokémon và các dạng đấu Triple/Rotation không được thêm trong bản tối ưu này; các hệ thống đó cần thiết kế nội dung/luật riêng. Không nhập ROM, ảnh hay âm thanh của Nintendo.

## Nguyên nhân và cách sửa lag

Mẫu cũ có 432 nút ô/760 phần tử trong vùng bản đồ. Mỗi bước khiến React đi qua grid/minimap, đổi left/top và CSS transition; nhiều SVG/drop-shadow và canvas sprite cần được quản lý lại. Cảnh khám phá tiếp tục vẽ phía sau dialog, và arena bị remount theo lượt. Đây là các điểm quan sát được từ source và đo trên Chromium, không suy đoán về GPU của thiết bị người chơi.

Renderer mới dùng một Canvas viewport. Nền, đồ vật và từng hàng che khuất được raster một lần từ SVG/atlas đang có; nhân vật sắp theo chân để che khuất đúng tầng. Chỉ copy phần nền/hàng trong khung nhìn, sprite được cắt sang stamp nhỏ trước. Không dựng lại grid và không có React state theo từng frame. Nhịp idle nhẹ, cảnh sau menu/trận ngừng vẽ; rời trang hoặc đổi map dọn lease, observer, clock và buffer. Giới hạn mặt vẽ khoảng 1,3 triệu pixel, DPR tối đa 1,5; thử 20 map cho layer cache dưới 16 MiB. Con số layer này không gồm bộ nhớ ảnh atlas dùng chung. Chỉ tải tài nguyên map/đồng hành hiện tại.

Danh sách đội/tủ/sổ dùng sprite tĩnh và chỉ mount canvas gần viewport. Mẫu tủ 60 hàng có 5 canvas ở đầu và 5 ở cuối danh sách; rời khung nhìn unmount/release. Nút/thẻ giữ kích thước để ảnh tải không làm nhảy bố cục. Tắt tiếng bước/cửa trùng giữa trang và world; mixer/soundtrack hiện có giữ nguyên.

Cách cache primitives/stamp, tách vùng tĩnh và context alpha=false được đối chiếu với [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas). Không dùng WebGL/engine/phụ thuộc mới.

## Đo trước/sau

Script [profile-adventure.mjs](../../tools/profile-adventure.mjs): cùng 36 bước trên đường an toàn, 170 ms/bước, CDP Performance metrics, fresh context, Chromium headless/SwiftShader trong cùng môi trường; một mẫu CPU thường và một mẫu CPU throttle ×4. Profile cuối chạy riêng, không chạy song song QA. Baseline là source 4.5.0 trước sửa renderer. Dữ liệu [trước](profile-before.json)/[sau](profile-after.json).

| Cấu hình | Tổng thời gian JavaScript | Giảm | Lần layout | Phần tử vùng map |
|---|---|---:|---:|---:|
| 1440×900 · CPU ×1 | 1.588 → 0.280 giây | 82.4% | 333 → 0 | 760 → 1 |
| 390×844 · CPU ×4 | 6.557 → 1.077 giây | 83.6% | 89 → 0 | 760 → 1 |

Thời gian task: desktop 2,907 → 0,539 giây; CPU ×4 8,026 → 1,999 giây. Layout/recalc trong đoạn đi giảm về 0. Vẫn 36 bước và 144 lần setItem (4 ghi journal/checkpoint cho mỗi bước). Không debounce save để đổi lấy độ mượt; thời gian dispatch đồng bộ trung bình 0,89 ms / 4,48 ms trong hai mẫu. Mẫu CPU ×4 có P95 6,2 ms. Đây là tổng chi phí trong kịch bản, không phải FPS hay bảo đảm tốc độ trên điện thoại thật. Chưa đo Safari/thiết bị của người dùng.

## Kiểm chứng, save và dung lượng

430 kiểm thử / 42 file, thêm 7 kiểm tra clock, nguồn input độc lập, clear, nội suy và camera/tap tất cả map/viewport. Typecheck app/dev, catalog 123 món, 146 asset refs/0 thiếu, registry 350 asset, release verify, build sạch/size và service-worker syntax đạt. Sau thay đổi thumbnail đã chạy lại các kiểm tra render dùng chung/demo liên quan. CI chạy suite mặc định; riêng mô phỏng 30 trận mở đầu/20 hành trình có timeout 20 giây vì mốc 5 giây không đủ trên runner tải cao. Giữ nguyên số seed, lượt và assertion.

Chromium 1440×900, 390×844, 844×390 và 320×568: giữ phím/D-pad, thả để dừng, chạy, menu/trận dừng nền, lời thoại qua reload, vào Bếp Nghỉ/chữa trạng thái/ra cửa, ba click chỉ một lượt, HP theo pha và node arena tồn tại qua lượt, nút vừa viewport, không JS error/asset thiếu trong mẫu. 390 thêm cả 20 map/cache, mua đúng giá, vật phẩm, thu phục, gửi/nhận tủ, demo ẩn chú thích giữ nguyên save, blur dừng bước, tủ 60 hàng không dựng đồng loạt canvas. [Dữ liệu browser](browser-qa.json), [script flow](../../tools/verify-web460.mjs), [script tủ lớn](../../tools/verify-adventure-menu.mjs).

Luồng không có API/backend mới: UI → Adventure reducer → protected localStorage → render hoặc tải lại. Không đổi reducer/schema/key, không reset hoặc di chuyển tọa độ save v2; giữ migration v1 đã có, tiền/XP/bụi/bộ bài, Auto/TCG và tiến trình. Đổi tốc độ/pha hoạt ảnh là trình bày/điều khiển, không đổi lượt/công thức damage hoặc RNG. Chỉ web, không sửa/sync/build Android/iOS.

Ngân sách vẫn dùng phần đã được duyệt: trần tổng **79.956.770 byte** (69.956.770 + 10.000.000), không xin thêm dung lượng. Baseline 4.5 **74.246.151 byte**, phần còn **5.710.619 byte**. Build cuối **74.265.890 byte**, tăng **19.739 byte**; còn **5.690.880 byte**. 449 file, JS gzip **623.418 / 650.000 byte**, CSS gzip **95.202 byte**, 0 leak. Không thêm media sản phẩm, tái sử dụng SVG/atlas/nền hiện có; docs/QA không đi vào build.

PR riêng dựa trên nhánh TCG 4.5 của [#35](https://github.com/minhutc359-ship-it/MealGacha/pull/35), để giữ cập nhật bẫy đã làm. #34 đã merge, #35 hiện chờ duyệt và có base master. Không tự merge.

Ảnh chụp QA cho điều khiển, trận đấu và tủ lớn có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.
