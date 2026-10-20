# Adventure World 2 · Nhánh phát triển game mới

AW2 đang được ươm tạo từ `game/adventure-world-2`. Đọc [tài liệu và tiến độ AW2](docs/aw2/README.md) trước khi tiếp tục plan. Đã có kho save riêng/migration v1→v2 và world thử nghiệm gồm 6 zone, 3 nhiệm vụ đầu, puzzle và đội khởi đầu 5 người. Sau `pnpm dev`, mở `/dev/aw2/world.html` hoặc `/dev/aw2/index.html`. World vẫn dùng hình khối debug; cả 5 starter đã có bộ asset tham chiếu bốn hướng/tám tư thế HD, chân dung, FX và cue riêng tại `/dev/aw2/starters.html`. Battle dùng tư thế gốc và chuyển động nội suy. Combat/leveling thật, 7 bộ art còn lại, loot và gacha chưa hoàn tất. Các mục Soul of Meal bên dưới là tài liệu của game hiện tại.

# Soul of Meal · Web 5.9.20 · Sổ chung và hành trình văn hóa

Nút **▤ Sổ** ở TCG, Phiêu lưu, Auto chess, Rương và PvP mở manga giới thiệu 4 chương hoặc **9 chặng văn hóa / 27 bước tương tác**. Các cuộc gặp có người truyền nghề, món ăn, lựa chọn, phản hồi và trang lưu niệm; tiếp tục được từ tiến trình TCG hoặc Adventure. Sửa thẻ manga giới thiệu bị co và đè lên bìa truyện trong Adventure.

[Thay đổi và kiểm chứng](dev/docs/web-v5920/UPDATE.md). Chỉ web; giữ tiến trình và bộ sưu tập. Chủ dự án review thiết bị thật và merge PR.

# Soul of Meal · Web 5.9.19 · Thông báo phiên bản mới

Game tự hiện popup khi có bản mới sẵn sàng: **Cập nhật và tải lại** hoặc **Để sau**. Có trạng thái đang xử lý, thông báo lỗi để thử lại và nút cập nhật trong Cài đặt. Giữ tiến trình và bộ sưu tập; kiểm tra lại khi mở web, trở lại tab hoặc có mạng.

[Thay đổi và kiểm chứng](dev/docs/web-v5919/UPDATE.md). Chỉ cập nhật web; chờ chủ dự án review/merge. Các phần dưới là lịch sử.

# Soul of Meal · Web 5.9.18 · Manga giới thiệu

**Một lời mời, bốn hành trình** gồm 4 chương, 12 trang manga hoàn chỉnh: nguồn gốc Vị Linh, triệu hồi thẻ TCG, chuẩn bị đội hình Auto Chess và khám phá thế giới Phiêu lưu. Lời thoại tiếng Việt nằm trong ảnh; popup giữ nguyên trang, có phóng to, đọc cuộn và bản lời thoại lớn tùy chọn. Mở từ mục Manga hoặc phần Hướng dẫn của các chế độ, không cần vượt chương trước.

[Thay đổi và kịch bản](dev/docs/web-v5918/UPDATE.md) · [Kiểm chứng](dev/docs/web-v5918/VALIDATION.md). Chỉ cập nhật web, giữ tiến trình và bộ sưu tập; chờ chủ dự án review/merge. Các phần dưới là lịch sử.

# Soul of Meal · Web 5.9.7 · Tuyệt kỹ 2D

Tuyệt kỹ của 139 Vị Linh dùng banner chân dung/nền theo hệ, icon trên model, pháp ấn và VFX trúng đích; bỏ toàn bộ 116 video cũ, giảm build khoảng 150,47 MB xuống 95,59 MB. Giữ tiến trình và luật chiến đấu. [Thay đổi](dev/docs/web-v597/UPDATE.md) · [Kiểm chứng và giới hạn](dev/docs/web-v597/VERIFICATION.md). Cập nhật trên PR #58, chưa merge. Các phần dưới là lịch sử.

# Soul of Meal · Auto chess 2.5D và bảo vệ bản phát hành

Bàn đấu phối cảnh, chuyển động đồng bộ cho đủ 44 quân và 24 quái/boss, pose theo nhịp trúng đòn, giải phóng atlas qua vòng dài. Chính sách ngày 16/10/2026 và kiểm tra chống đưa source/map/archive/khóa bí mật vào bản web. [Thay đổi và giới hạn kiểm chứng](dev/docs/web-v584/UPDATE.md) · [Bảo vệ mã nguồn và các việc còn cần chủ sở hữu xử lý](rights/SOURCE_PROTECTION.md). Bản 2.5D, chưa chuyển sang model 3D; repo hiện công khai và hồ sơ quyền sử dụng còn 13 mục cần xác minh. Chỉ cập nhật PR #51, không tự merge.

# Soul of Meal · Web 5.2 · Sân đấu & chiến thuật Vị Linh

Sân không còn kéo giãn nhân vật / vòng phép trên điện thoại; đánh thường dùng FX TCG, tuyệt kỹ có động tác/pháp trận theo vai trò và hệ. Campaign 3–4 đợt, 4–6 địch/đợt; tinh anh và năm boss có kỹ năng riêng. Dungeon chốt mức khó theo cấp trung bình đội mang vào, tăng theo bậc/tầng; trận lưu cũ giữ luật cũ. [Thay đổi / chứng cứ](dev/docs/web-v520/UPDATE.md). Chỉ web, không tự merge.

# Soul of Meal · Web 5.1 · Linh vị & liên hương

Giao ước Vị Linh có minh hoạ linh thú riêng cho đủ 139 nhân vật, icon kỹ năng, cảnh tuyệt kỹ năm hệ và liên hương. Chọn hướng tuyệt kỹ ở cấp 10, ưu tiên mục tiêu, nối tuyệt kỹ và phản ứng nguyên tố để xây đội. TCG/RPG giữ canvas khi đổi động tác; Auto chess chuyển pose và cache lớp bàn. [Nội dung, bảo toàn save và kiểm chứng](dev/docs/web-v510/UPDATE.md) · [Ngân sách 6 MB](dev/docs/web-v510/BUDGET.md).

Bản 5.1 dựa trên 5.0 (PR #41); chỉ web, không tự merge. Bộ sưu tập, tài nguyên, tiến trình cũ và luật trận 5.0 đang lưu được giữ. Các phần dưới là lịch sử phát hành.

# Soul of Meal · Web 5.0 · Giao ước Vị Linh

Adventure trở thành RPG đội 5 người: 4 map, mỗi map 5 màn nhỏ + 1 boss; tự đánh/kỹ năng thường, canh tuyệt kỹ và che chắn đòn boss. Ba dungeon 5 tầng farm Sổ KN, Sách kỹ năng, Quặng/Tinh hương; giữ HP/năng lượng giữa tầng và chọn điểm nghỉ. Nhân vật có cấp, bốn kỹ năng, thăng bậc và ba ô trang bị. Dùng chung sprite/nhạc/art TCG + Auto chess; bỏ renderer và media đi ô khỏi bản web. Cấp/KN, huy hiệu, tài nguyên và save Adventure cũ được giữ. [Thiết kế, chuyển dữ liệu và kiểm chứng](dev/docs/web-v500/UPDATE.md).

PR #39/#40 đã merge trước cập nhật này. TCG/PvP 4.9 giữ nguyên. Chỉ web; không build/sync Android/iOS và không tự merge. Các phần 4.x dưới đây là lịch sử phát hành.

# Soul of Meal · Web 4.8 · Bẫy và art Adventure

Ô bẫy chỉ có khung/hình bài; úp có animation và âm thanh riêng, kích hoạt giữ mô tả đầy đủ 2,25 giây. Bộ mới thống nhất 24 lá ở Xưởng và mọi đường vào trận. Hai atlas Adventure nguyên bản, 4,16 MB lossless, dùng Canvas/cache cho 20 map. Tiến trình và luật trận/run cũ giữ nguyên. Bản này hướng về master và mang theo cập nhật 4.6/4.7. [Thay đổi, prompt, ngân sách và kiểm chứng](dev/docs/web-v480/UPDATE.md).

# Soul of Meal · Web 4.7 · Bàn đấu TCG rộng hơn

Trận mới có 4 đồng minh + 1 ô bẫy, bộ 24 lá cho cả hai bên và kiệt sức tối đa 3 sát thương mỗi lần rút hụt. Theo dõi số bài còn lại và cảnh báo rút hụt trực tiếp trên bàn. Bộ cũ giữ nguyên: vào **Bộ bài → Bổ sung đủ 24 lá → Lưu & trang bị**; có 6 lá khởi đầu bổ sung miễn phí. Trận và hành trình đang chơi tiếp tục theo luật cũ. [Cơ chế, bảo toàn tiến trình và kiểm chứng](dev/docs/web-v470/UPDATE.md).

## Web 4.6 · Adventure nhẹ hơn và điều khiển theo ô

Bản đồ dùng Canvas/cache từ atlas và SVG chung; giảm cập nhật DOM, ngừng vẽ sau menu/trận. Giữ D-pad/WASD để đi, nút chạy, A tương tác và X mở menu. Trận đấu có bốn lựa chọn chính, HP theo nhịp đòn, khóa click lặp và giữ arena qua lượt; tủ/sổ chỉ mount sprite gần viewport. Tiến trình và 20 map giữ nguyên, chỉ web. Mẫu 36 bước Chromium giảm JavaScript 82–84%; xem [nghiên cứu Black/White, số đo và kiểm chứng](dev/docs/web-v460/UPDATE.md).

## Web 4.5 · Một ô bẫy và giao diện TCG rõ hơn

Mỗi bên có một ô bẫy riêng ngoài ba ô quân; 8 bẫy và 2 phép đối sách, úp trước rồi chọn Kích hoạt/Giữ khi địch hành động. HUD, tay bài cuộn ngang, cửa sổ phản ứng và animation lật bẫy dễ theo dõi trên màn dọc/ngang. Gói thẻ nhận tự nguyện; trận/run cũ tiếp tục đúng luật cũ, giữ tiến trình. Chỉ web, phần tăng toàn build 4.289.381 byte trong ngân sách thêm 10 MB. Xem [cơ chế, nguồn tham khảo, ảnh và kiểm chứng](dev/docs/web-v450/UPDATE.md).

## Web 4.4.1 · Gói hình ảnh dùng chung trong ngân sách thêm 5,59 MB

Năm đấu trường theo hệ/vùng dùng chung TCG, Auto chess và Adventure; atlas trúng đòn 5 hệ × 5 frame có chuyển pha mềm, NPC Lả/người bán hàng/Bà giữ bếp dùng atlas bốn hướng theo chân dung hiện có. VFX dùng cùng cache ảnh, giới hạn bốn burst bitmap cùng lúc trong Auto và giữ hiệu ứng thủ tục ở đồ họa nhẹ. Build có guard riêng cho phần tăng thêm 5,59 MB; save/gameplay giữ nguyên, chỉ web. Xem [thay đổi, nguồn ảnh và kiểm chứng](dev/docs/web-v441/UPDATE.md).

## Web 4.4 · Âm thanh, hình ảnh & độ mượt

Nhân vật chính Adventure có atlas đi bộ bốn hướng, sân đấu mới và VFX theo hệ; cây/cỏ/nhà và giao diện được đồng bộ. Mixer có môi trường, tiếng bước/cửa/thu phục, stereo và compressor; hoạt ảnh chiến đấu ưu tiên 60 Hz và tự giảm chi tiết khi tải chậm. Save cũ giữ nguyên; chỉ web. Xem [bản cập nhật và kiểm chứng](dev/docs/web-v440/UPDATE.md).

## Web 4.3.3 · Adventure vừa màn hình & demo ẩn chú thích

Giới thiệu có nút **Ẩn/Hiện chú thích** để xem màn chơi toàn màn hình. Adventure dùng hoạt ảnh Vị Linh chung TCG/Auto, giữ D-pad/Tương tác trên màn hình và mở hành trình/đội/sổ/hướng dẫn bằng bảng nổi; giữ nút hướng để đi liên tục. Save cũ giữ nguyên, chỉ cập nhật web. Xem [thay đổi và kiểm chứng](dev/docs/web-v433/UPDATE.md).

## Web 4.3.2 · Giới thiệu trong Hướng dẫn chơi

Nút **Giới thiệu** nằm trong Hướng dẫn chơi của từng chế độ, không chiếm thanh chuyển chế độ. Demo 25 giây dùng đúng giao diện trận/map/rương hiện tại, tự nối combo và cho boss phản kích. Dữ liệu mẫu độc lập với save thật. Xem [bản sửa và kiểm chứng](dev/docs/web-v432/UPDATE.md).

## Web 4.3.1 · Giới thiệu tự chơi cho từng chế độ

Chọn **▶ Giới thiệu** ở thanh chế độ của TCG, Auto chess, Phiêu lưu hoặc Rương để xem kịch bản 25 giây với mô hình, highlight kỹ năng/combo, nhạc và chú thích từng pha. Có tạm dừng, xem lại, bỏ qua và vào chơi; trận mẫu không tiêu vật phẩm, không nhận thưởng, không sửa tiến trình. Xem [kịch bản và kiểm chứng](dev/docs/web-v431/UPDATE.md). Cập nhật web, ngân sách 100 MB.

## Web 4.3 · Adventure World

Phiêu lưu có 5 vùng ngoài trời và 15 nội thất, nhân vật 4 hướng, camera theo người chơi, đi bằng bàn phím hoặc chọn điểm, Vị Linh đi theo, cửa hàng, Tủ Vị Linh, nhiệm vụ Nhà Ký Ức và các trận NPC nhiều đối thủ. Đội 6 Vị Linh dùng 16 kỹ năng có PP, tương khắc 5 hệ, tốc độ, trạng thái và vật phẩm. Nội dung/mô hình là thiết kế gốc Soul of Meal, lấy cảm hứng từ RPG thu phục sinh vật.

Mở `/adventure` hoặc chọn **Phiêu lưu** trên thanh chế độ. WASD / phím mũi tên để đi, Shift để chạy, E để tương tác. Đọc [bản cập nhật](dev/docs/web-v430/UPDATE.md). Đây là cập nhật web; không thay đổi native/mobile. Ngân sách giữ ở 100 MB.

# Soul of Meal 4.2.0 · Phiêu lưu Vị Linh

Game ẩm thực và ký ức Việt Nam gồm **TCG**, **Chợ Đêm Auto chess** và **Rương vị giác**, chạy trên React 19 / Vite 8 / TypeScript. Không cần tài khoản; có mã MGC1 để chuyển tiến trình giữa thiết bị.

Bản 4.2 chỉ cập nhật web và thêm **Phiêu lưu Vị Linh** tại `/adventure`: 5 vùng liên thông, chạm trán theo bước chân, thu phục bằng Hương Ấn, đội 4 Vị Linh + tủ dự bị, chiến đấu theo lượt, khắc hệ, lên cấp và 5 thử thách giữ ấn. Chế độ dùng lại hình, nhân vật, bối cảnh và soundtrack hiện có; tiến trình nằm trong cùng save và mã chuyển dữ liệu. Android CI vẫn chỉ chạy thủ công; không sync/build native trong đợt này. Xem [chi tiết và kiểm chứng 4.2](dev/docs/web-v420/UPDATE.md) và [kiểm chứng nền 4.1](dev/docs/web-v410/UPDATE.md).

TCG có 181 thẻ, 9 chương/27 màn, xây bộ bài, AI, thám hiểm, chế tạo và nhiệm vụ. Auto chess có 44 quân, 16 quái/đối thủ thường và 8 boss, chiến dịch, Survival, Daily, shop/pool hữu hạn, ghép sao, hệ/nghề/di vật, XP và kéo thả bàn/dự bị. Rương dùng catalog chung 123 món và tìm quán từ OpenStreetMap không cần API key. Model anime 2.5D dùng chung hai chế độ; không phải rig 3D chạy trực tiếp.

Bản 4.0 thêm Nêm vị/Ủ vị, 8 thẻ nhận qua gói khởi hành tự nguyện, 3 chương tiếp nối đúng hai kết thúc cũ, 4 sự kiện/4 di vật thám hiểm, chiến dịch Auto 18 đợt và 6 nâng cấp mới. Có 3 nền mới, 12 bản nhạc nguyên gốc, profile chuyển động và bảng đóng góp thực tế. Ghi save có journal/checkpoint và giao diện phục hồi; trận đang chơi giữ luật cũ. Xem [triển khai và giới hạn QA 4.0](dev/docs/major-v400/IMPLEMENTATION.md).

Bản 3.5.0 phân hóa nội tại quân và phép TCG, thêm hy sinh/tái triệu hồi/đóng băng, 6 combo công thức và 7 gợi ý bộ bài. Auto chess có VFX niệm phép, đòn diện rộng, khiên, hiệu ứng tan biến, nhạc chiến đấu/boss mới trong hai phong cách và ảnh RPG cho cả 9 trang bị. Cửa hàng luôn hiện nghề cạnh hệ. Survival bắt đầu với **3 ý chí**, thua mất 1 và chơi lại đúng đợt; thắng không hồi. Chiến dịch giữ 100 ý chí và mức trừ theo địch còn sống; còn ý chí thì chơi lại cùng đợt. Daily vẫn kết thúc ở lần thua đầu. Điểm/kỷ lục chỉ chốt khi lượt kết thúc. Xem [thay đổi và kiểm chứng](dev/docs/depth-v350/UPDATE.md).

Cơ chế tăng tốc ×3 sau giây 55 từ 3.4.1 được giữ; trận tiếp tục đến khi phân thắng thua. Các phiên đã kết thúc từ bản cũ và kỷ lục cũ không bị mở lại.

Bản 3.3 thêm niệm phép, đạn có hình lửa/nước/lá/tinh quang, vệt chém cong, khiên và sóng va chạm. VFX đọc sự kiện thực của trận, dùng cùng bộ renderer ở TCG/Auto chess, giữ reduced motion/preset nhẹ. Đồng bộ âm thanh và pose chịu đòn TCG tại mốc tiếp xúc. Giữ mức thử thách +30%, EXP, đội hình và save từ 3.2.2.

Bản 3.4 mở cấp 9, bàn tối đa 9 quân và đúng 9 ô dự bị; mua không tự chọn quân, dự bị đầy vẫn mua được bản đủ ghép sao. Mobile dùng kéo thả để xếp/bán, giữ 0,3 giây để xem nhanh rồi thả để đóng. Thêm 3 mảnh đồ, 6 công thức ghép, kéo trang bị có xem trước; HUD hệ bên trái, màu hệ, giá 1–5 vàng, ví vàng và XP ngay trong shop. Có nút ẩn/hiện shop và tùy chọn rung khi lên sao trên trình duyệt hỗ trợ. Giao diện vừa khung mobile dọc/ngang; save và mã MGC1 cũ tiếp tục được. Xem [chi tiết và kiểm chứng 3.4](dev/docs/market-v340/UPDATE.md).

Bản 3.3.1 sửa vị trí lá bị hạ trong TCG; thêm phím **W/E/F/D**, shop đánh dấu quân đã có/đủ ghép, hiệu ứng thức tỉnh và kích thước +7% mỗi sao. Có 20 nhân vật mới với 140 pose trong 5 atlas WebP; 12 linh vị món Việt dùng chung model ở TCG. Phiên cũ giữ pool và seed đã lưu; phiên mới 3.4 dùng luật 4. Xem [thay đổi 3.3.1](dev/docs/market-v331/UPDATE.md).

## Chạy và kiểm tra

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm validate:catalog
pnpm validate:assets
pnpm release:verify
pnpm build
pnpm preview
```

Node 22.21+ hoặc Node 24; pnpm theo `packageManager`. `pnpm dev` mở công cụ biên tập chỉ trong môi trường phát triển. `pnpm build` không phụ thuộc thư mục `dev/`. `.env.example` là cấu hình tùy chọn, không chứa key thật; mặc định bản game/tìm quán chạy không cần backend hoặc API key.

## Bản phát hành

| Phần | Nơi lưu |
| --- | --- |
| Runtime/source | `src/`, `public/`, cấu hình root và lockfile |
| Chính sách/pháp lý sản phẩm | `LICENSE`, `THIRD_PARTY_NOTICES.md`, `rights/`, `public/legal/` |
| Toàn bộ phần phát triển | `dev/`: docs/prompt, test, script, component biên tập, tham chiếu, nền tảng cũ, archive |
| Web đã build | `dist/`, chỉ file cần phục vụ game; không có prompt/test/archive |
| ZIP đóng gói | `dev/artifacts/`, tạo tại máy và được Git ignore |

```sh
pnpm release:records  # cập nhật notices, HTML chính sách, fingerprints sau khi đổi asset/dependency
pnpm release:verify   # kiểm tra hồ sơ đã khớp nguồn hiện tại
pnpm build
pnpm release:size     # báo dung lượng và chặn file dev/archived audio lọt vào dist
pnpm release:source   # ZIP nguồn sản phẩm, loại dev/, node_modules/, .git và secrets
pnpm release:web      # ZIP website đã build
```

ZIP source vẫn build được sau khi bỏ hoàn toàn `dev/`; muốn chạy test/tạo lại asset/biên tập nội dung cần full repository. Khi bán mã nguồn, bàn giao thêm hồ sơ bằng chứng và quyền trong `dev/docs/`, dù không đóng gói chúng vào app cài đặt.

Vercel dùng `vercel.json`: build `pnpm build`, output `dist`, SPA fallback và URL chính sách độc lập. `.vercelignore` loại công cụ/archive khỏi upload CLI; Git integration vẫn checkout repo nhưng chỉ phân phối `dist`. Asset công khai chưa đổi tên theo hash dùng cache ngắn để tránh giữ ảnh/nhạc cũ sau update. Commercial hosting cần gói phù hợp với điều khoản Vercel.

## Quyền sử dụng và mobile

Có điều khoản, quyền riêng tư và ghi công trong cài đặt/hướng dẫn cả ba chế độ. URL đọc trong app `/legal/terms`, `/legal/privacy`, `/legal/rights`; HTML không cần JavaScript ở cùng đường dẫn thêm `.html`. Notices phân phối ở `/legal/THIRD_PARTY_LICENSES.txt` và `/legal/APP_LICENSE.txt`.

Không tuyên bố “không có bản quyền”, CC0 hoặc bảo đảm không xâm phạm. Thư viện giữ giấy phép; GSAP dùng Standard License. 6 MP3/2 banner chưa có bằng chứng giấy phép được giữ ngoài release trong `dev/archive/`, thay âm thanh Rương bằng cue synth nguyên bản. Hồ sơ ghi nguồn và SHA-256 tài nguyên; chủ sở hữu cần hoàn thiện danh tính/liên hệ và xác minh quyền trước giao dịch thương mại.

- [Hồ sơ phát hành thương mại](rights/COMMERCIAL_RELEASE.md)
- [Đánh giá Vercel và dung lượng](dev/docs/release/VERCEL_AND_SIZE.md)
- [Kế hoạch iOS/Android chi tiết](dev/docs/release/MOBILE_PLAN.md): Capacitor, bundled offline game, native save/audio/lifecycle, QA và store; chưa tạo IPA/AAB.
- [Kiểm chứng 3.3 và ảnh trận](dev/docs/release/VERIFICATION.md)
- [Cấu trúc dev](dev/README.md), [lịch sử trước 3.3](dev/docs/HISTORY_BEFORE_33.md), [thay đổi 3.2.2](dev/docs/challenge-v322/VERIFICATION.md)

Bản web có PvP giao hữu hai người qua WebRTC cho TCG/Auto chess; chủ phòng tính trận. Chưa có PvP xếp hạng, giao dịch người chơi, quảng cáo, IAP hay đồng bộ tài khoản. Browser QA dùng Chromium; Safari/WKWebView và Android native cần được thử trên máy thật theo kế hoạch mobile.
