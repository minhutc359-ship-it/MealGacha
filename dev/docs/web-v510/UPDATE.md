# Web 5.1 · Vị Linh, liên hương và chuyển động

Bản 5.0 có vòng chơi chiến dịch/dungeon nhưng dùng ảnh món ăn và ít kiểu kỹ năng. 5.1 thay minh hoạ trong **Giao ước Vị Linh** bằng chân dung linh thú riêng cho toàn bộ 139 thẻ đơn vị; thêm quyết định chiến thuật và cải thiện renderer dùng chung TCG/Auto chess/RPG.

## Nội dung

- 9 atlas chân dung nguyên bản, 139 ô nhân vật riêng; hình ảnh linh thú/nhân vật huyền ảo mang dấu ấn nguyên tố. Đội hình, danh sách, chi tiết và thanh tuyệt kỹ đều dùng bộ này. Không dùng ảnh món ăn làm fallback chiến đấu RPG.
- Atlas 64 biểu tượng: chiêu chủ động/tuyệt kỹ theo vai trò và hệ, hỗ trợ, nội tại, bốn phản ứng. Mọi kỹ năng có icon; icon dùng chung khi cùng cơ chế, không giả lập 556 skill độc lập.
- Atlas 6 cảnh tuyệt kỹ: Kim sư, Hỏa phượng, Ngọc lâm, Long triều, Nguyệt mộng và Liên hương. Cut-in có chân dung người tung chiêu, nền nguyên tố và tên chiêu; không chặn thao tác hoặc thời gian mô phỏng.
- 25 hồ sơ tuyệt kỹ **thực sự xuất hiện trong catalog 139 nhân vật**. Kết hợp vai trò/hệ với ba phong cách cố định theo ID: Cân bằng; Tập kích (+15% công, −10% hồi/khiên, tuyệt kỹ phá 30% khiên mục tiêu); Tiếp sức (+15% hồi/khiên, −10% công, cho đồng đội 6 năng lượng và tuyệt kỹ giảm 2s hồi chiêu chủ động). Thủy pháp đánh hàng trước; các pháp vị khác tập trung mục tiêu. Hiệu ứng hệ thêm khiên/bỏng/hồi HP/năng lượng/làm yếu.
- Cấp 10 chọn **Phá sương** (+20% sát thương tuyệt kỹ, −15% hồi/khiên) hoặc **Dưỡng linh** (+50% hồi/khiên tuyệt kỹ, −15% sát thương). Đổi miễn phí ngoài chuyến đi, lưu theo nhân vật, áp dụng khi bắt đầu trận mới. Không đổi giữa dungeon.
- Chạm `⌖` trên địch để chọn/bỏ mục tiêu ưu tiên. Đánh thường và đòn tập trung theo mục tiêu còn sống; đòn diện rộng giữ phạm vi của nó. Địch gục: tự trở lại chọn mục tiêu hợp lệ.
- **Liên hương**: tung tuyệt kỹ của người khác trong 3s tăng 15% hiệu lực mỗi nhịp, tối đa 30%. Nhịp đầu ×1, tiếp theo ×2/×3; hết cửa sổ trở lại ×1. Không cho tung chiêu khi chưa đủ năng lượng hoặc đang choáng.
- **Cộng hưởng đội**: ít nhất ba hệ khác nhau cho thêm 10 năng lượng đầu trận; ba người cùng hệ cho nhóm đó +12 giáp. Năng lượng được mang qua dungeon không nhận lại phần đầu trận.
- **Dấu nguyên tố** giữ 5s trên mục tiêu của kỹ năng. Hai hệ hợp lệ tiêu dấu để kích hoạt phản ứng; cùng hệ làm mới dấu, không tự phản ứng.

| Hai hệ | Phản ứng | Hiệu lực |
|---|---|---|
| Hỏa + Thủy | Bốc hơi | Sát thương thêm 80% công, vẫn qua giáp/khiên/khắc hệ |
| Hỏa + Mộc | Nở rộ | Bỏng và làm yếu 5s |
| Mộc + Thủy | Sinh trưởng | Hồi 10% HP tối đa cho đồng đội còn sống |
| Bếp + Ngọt | Mộng ấm | Khiên 12% HP tối đa cho từng đồng đội còn sống |

Các kỹ năng/cộng hưởng mở thêm cách xây đội và canh chiêu, không thay tuyến truyện bốn vùng, 24 màn, luật boss, dungeon năm tầng, tài nguyên/nâng cấp của 5.0. Dấu nguyên tố và chuỗi tuyệt kỹ không mang qua trận mới.

## Chuyển động và hiệu năng

- TCG/RPG: tách cue động tác khỏi vòng đời ảnh/canvas. Đổi stamp/motion không lấy lại lease, dựng ResizeObserver/IntersectionObserver hay ghi lại kích thước canvas.
- Hai pose chuyển tiếp trong 70ms, dùng điểm neo đã đo; lunge, recoil, hơi thở và pose hiện có vẫn chạy theo đồng hồ trình bày. Tối đa hai lần vẽ sprite, không sinh đồng hồ riêng.
- Auto chess: cache bounds mỗi sheet/row và lớp ô bàn theo kích thước/DPR, giảm tính hình học và vẽ đường ô mỗi frame; chuyển pose mượt ở preset thường, một pose ở preset nhẹ/giảm chuyển động.
- Pause giữ tuổi cue; tiếp tục không khởi động lại động tác. Tab ẩn không chạy bù. Low/reduced-motion giữ hình rõ, tắt VFX/pulse không cần thiết. Không đổi engine RNG/tick/luật TCG hay Auto chess, bao gồm PvP.
- RPG có đường phép, vòng chạm, số HP/khiên, icon phản ứng, cut-in riêng theo hệ, phản hồi nhấn nút và thanh HP/energy chuyển tiếp. Số HP/khiên hiển thị đúng lượng từng người thực nhận; atlas cảnh tuyệt kỹ được tải từ lúc vào trận. FX và thông báo không bắt pointer ngoài nút đóng; mục tiêu và nút tuyệt kỹ vẫn thao tác được.
- Chân dung chỉ yêu cầu atlas khi gần vùng nhìn, không tải chín atlas chỉ để vào bản đồ. Danh mục dùng mapping bất biến, không phụ thuộc thứ tự sort của card catalog.

## Bảo toàn dữ liệu

`GameSave.version` và `adventureRpg.version` vẫn là 1. Các trường mới đều optional: đường tuyệt kỹ, phiên bản luật trận, dấu nguyên tố, focus và chain. Trận mới có `rulesVersion: 510`; trận 5.0 đang lưu (không có trường này) chạy nhánh luật cũ đến hết. Không seed lại roster hoặc tài nguyên. `adventure` cũ, collection, wallet, deck, history và Auto chess giữ nguyên. Không thêm runtime dependency, không build/sync hoặc sửa native.

## Kiểm thử và phạm vi đánh giá

Chứng cứ máy nằm ở `browser-qa.json`, `finesse-qa.json` và `pvp-regression/`. Script: `dev/tools/verify-adventure510.mjs`, `verify-finesse510.mjs`, `verify-pvp510.mjs`.

Mục tiêu 9/10 là chất lượng trải nghiệm để người chơi đánh giá. Bản này không tự gán điểm 9/10 hay coi RAF trong Chromium/SwiftShader là FPS trên điện thoại thật. Cần thêm đánh giá chủ quan sau khi chơi preview; chưa khẳng định Safari, mạng chéo/TURN hoặc hiệu năng thiết bị thật.

Art/prompt/mapping/kích thước/hash: `artwork.json`, `art-prompts.json`, `skill-art-prompt.txt`, `ultimate-art-prompt.txt`, `src/game/adventureRpg/spiritArt.ts`. Bộ mới dùng công cụ imagegen tích hợp; đã kiểm tra trực quan cả 11 atlas, chỉ chuyển PNG sang WebP để nén.

## Kết quả xác nhận

- 505 tests / 46 files; typecheck app/dev, catalog, asset paths, release registry/notices, production build, SW syntax và size guard.
- Chromium tại 1440×900, 390×844, 844×390, 320×568: campaign/dungeon/guard/burst/camp/reload; hướng tuyệt kỹ lưu sau reload, focus, liên hương ×2, Sinh trưởng, arena/canvas giữ nguyên, không ghi lại width/height khi đổi cue; demo TCG/Auto/RPG không đổi save.
- Hai context kết nối WebRTC thật: TCG/Auto tại cả bốn kích thước; quân thứ tư, bẫy thủ công và che dữ liệu mọi frame, chặn ghế thứ ba/sai mode, ngắt kết nối giữ ghế, farm→PvP, nhường trận, mời lại và đóng phòng. Reveal đo 2.264–2.267s. **Khách reload cần một lần bấm “Kết nối lại” thêm** trong lần QA đạt; token, ghế và canonical match được giữ. Các lần thử đầu từng timeout ở bước reload; driver sau đó cho phép và ghi rõ một retry bằng nút thật, không thay transport/luật PvP để bỏ qua kiểm tra.
- Không có JS error hoặc asset thiếu trong các lần QA đạt. Snapshot tăng tốc engine chỉ dùng ở phần kết thúc trận/farm của script; thao tác/clock/WebRTC được quan sát thật trước đó.
- RAF mẫu trong container SwiftShader có p95 lớn; không dùng các mẫu này để tuyên bố 60 FPS hoặc đạt điểm 9/10. Cải tiến kiểm chứng được: canvas không dựng lại theo cue, cache bàn/bounds, chuyển tiếp hai pose, reduced motion/low preset và phân biệt hiệu ứng rõ hơn.

Atlas RPG được lưu dưới dạng blob Git thông thường, theo quy tắc các media runtime hiện có. Checkout CI/Vercel không cần LFS để lấy ảnh mới; byte/hash của toàn bộ 11 file trong index đã được kiểm tra với manifest.
