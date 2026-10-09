# MealGacha 3.0 — Chợ Đêm Vị Linh

Mode hoàn chỉnh tại `/autochess`, chuyển qua lại với TCG và Rương vị giác từ thanh trên. Đây là implementation của bản nghiên cứu 2.9.2; có thể chơi chiến dịch và survival ngay, không có tài khoản/server.

## Nội dung đã triển khai

| Phần | Trong bản 3.0 |
|---|---|
| Chiến dịch | 4 hồi, 12 đợt, 4 boss, thoại đầu hồi và giữa trận, lựa chọn 2 kết truyện |
| Survival | Đợt không giới hạn; áp lực theo đợt và thời gian giao chiến; hết ý chí kết thúc và ghi điểm |
| Hằng ngày | Seed theo ngày Việt Nam; shop và đối thủ tái lập được; giữ kết quả cao nhất từng ngày |
| Roster | 32 Vị Linh, 5 hệ, 3 nghề; 22 loại kỹ năng |
| Địch | 10 quái, 4 boss; quái săn carry, hút mana, hồi phục, giáp, choáng, phản chiếu, phong ấn, triệu hồi |
| Đội hình | Bàn 6×6, 3 hàng của người chơi; 3–7 quân; 6 ghế dự bị; chọn/chạm hoặc kéo thả; phím mũi tên/Enter |
| Shop | 5 ô, pool hữu hạn, đổi 2 vàng, khóa, XP; 3 bản lên 2 sao, 9 bản lên 3 sao |
| Build | 6 di vật (2 món khác nhau/quân), 6 Lời hẹn; phần thưởng chọn 1 trong 3 sau mốc thắng |
| Sưu tập | 11 món có ảnh mới cùng áp dụng cho TCG và Rương; catalog chung 123 món, TCG 163 thẻ |
| Kỷ lục | 20 kết quả/mode; ảnh postcard tải về; 4 nền bàn mở bằng Ấn Chợ |
| Trình diễn | Sprite anime 2.5D, đi/đánh/niệm/trúng đòn/ngã, đạn, vùng báo trước, lửa/nước/lá/khiên/sao, số damage/heal, boss đổi pha |
| Âm thanh | 5 bản nhạc riêng × original/8-bit; SFX dùng synth của app; đổi phong cách/âm lượng và giảm chuyển động |
| Lưu | Tự lưu mỗi giây giao chiến và mỗi thao tác; mã MGC1 giữ cả TCG/Rương/Auto chess, gồm trận đang chơi và kỷ lục |

Bánh tét chưa có trong catalog chung khi kiểm kê thực tế, nên đã bổ sung cả món và ảnh; không chỉ tạo đơn vị auto chess. 14 quân cuối là roster mới của mode; Bánh tét trong nhóm tái sử dụng thiết kế cũng được bổ sung vào catalog chung.

## Vòng chơi

Mua/ghép → xếp đội và trao di vật → xuất trận → đội tự tìm đường, đánh và cast ở 100 mana → chốt kết quả → nhận lựa chọn/mở đợt sau → chuẩn bị. Quân bị hạ trong trận trở lại ở vòng chuẩn bị. Thua mất 5 + 2 × số địch sống (tối đa 25) ý chí; campaign thử lại cùng màn, survival tiến tới đợt sau đến khi hết 100 ý chí.

Mỗi vòng nhận 5 vàng, thắng thêm 1; lợi tức 1/2/3 tại 10/20/30 vàng được tính trên số vàng còn trước khi trả thưởng. 4 vàng = 4 XP; mốc 8/20/38/62 XP mở 4/5/6/7 quân. Pool giá 1–5 có 18/16/12/10/9 bản mỗi ID; quân đang shop, trên bàn, dự bị và bản đã ghép đều giữ bản trong pool. Bán trả đúng số bản.

Hệ và nghề tính ID khác nhau, không tăng mốc vì đặt nhiều bản cùng quân. Hỏa vị đốt; Hải vị tích mana; Thanh vị hồi/giảm choáng; Gia vị che tuyến trước; Ngọt vị che khi cast. Ba hệ khác nhau kích Mâm chung hồi máu định kỳ. Giữ bếp tăng giáp, Lữ khách đi nhanh/tăng công, Người kể có mana đầu trận. Toàn bộ số hiển thị lấy từ catalog dùng chung với engine.

## Survival và điểm

`t = activeTicks / 20`, `p = floor(t / 30)`:

- Máu địch: `(1 + 0.08 × (wave − 1)) × (1 + 0.05 × p)`.
- Công địch: `(1 + 0.06 × (wave − 1)) × (1 + 0.04 × p)`.
- Từ giây 25 mỗi vòng: cuồng nộ tăng công 15% mỗi 5 giây và giảm hồi máu dần đến 75%.
- Giây 55 chưa hạ hết địch tính thua.
- Điểm vòng thắng: `100 + 12 × wave + 3 × quân sống + max(0, 60 − 2 × ceil(giây vòng)) + 300 nếu boss`.

Chỉ trả điểm một lần mỗi đợt thắng. Quái triệu hồi không cho điểm riêng. Chuẩn bị, thoại, pause và tab ẩn không chạy đồng hồ. ×2 tăng tốc trình diễn và simulation cùng nhau, điểm vẫn dựa trên thời gian simulation. Thưởng chỉ là Ấn Chợ đổi hình nền; không chuyển vàng/điểm sang kinh tế TCG. Kỷ lục local và daily có thể chỉnh từ client; không được quảng bá là bảng xếp hạng online có chống gian lận.

## Truyện và văn hóa

An giữ phiên chợ đang mất tên. Món ăn không phải đĩa thức ăn tự đánh nhau: ký ức của người nấu gọi linh thể để giữ câu chuyện. Tịnh cố lưu một công thức duy nhất để không ai bị quên, nhưng chính việc gạch những phiên bản khác biến người bị xóa thành Vô Danh. Sau đó An phát hiện gia đình mình đã tự gạch tên để được chấp nhận. Trận cuối mở trang sổ cho nhiều giọng kể; người chơi chọn giữ chú giải hoặc dựng hội quán truyền nghề.

Câu chuyện dùng hình ảnh lời mời khách, phần cơm cho người lạ, bánh chưng/bánh tét ngày Tết, truyền nghề và nhịp kể cộng đồng. Góc văn hóa Việt có tiếng Việt/English và nguồn đọc thêm. Các linh thể và phép là hư cấu riêng của game. Nhạc được sáng tác mới, không lấy giai điệu/recording Pokémon hay nghi thức truyền thống.

Nguồn văn hóa kiểm tra ngày 08/10/2026:

- [UNESCO — The art of Bài Chòi in Central Viet Nam](https://ich.unesco.org/en/RL/the-art-of-bai-choi-in-central-viet-nam-01222): cộng đồng, âm nhạc/thơ/diễn/hội họa, truyền trong gia đình.
- [Vietnam Tourism — Tet: Tradition, Reunion & Taste](https://vietnam.travel/things-to-do/tet-tradition-reunion-taste): đoàn tụ, bánh chưng/bánh tét và biến thể công thức gia đình.

## Hình ảnh và hiệu năng

Sáu atlas WebP được tạo mới bằng built-in `image_gen.imagegen`. Phong cách anime 3D được dựng thành sprite 2.5D; đây không phải model 3D có rig. 18 quân đầu dùng 8 bộ linh thể/người chung, 14 quân mới có hàng chuyển động riêng; toàn bộ 32 chân dung khác nhau. Các atlas 7 cột có hai frame đi, windup/strike, cast và fall; atlas 14 cột có thêm cast ba frame, hit và celebrate. Renderer bổ sung nội suy vị trí, lunges, breathing, đạn và hình hiệu ứng riêng từng hệ. Những hàng 7 cột dùng pose attack/cast cho hit/celebrate thay vì giả định có frame không tồn tại.

| File trong `public/assets/autochess/` | Lưới | Nội dung |
|---|---|---|
| `movement.webp` | 14×8 | 8 linh thể/người, 14 trạng thái/frame |
| `new-movement.webp` | 7×14 | 14 quân cuối, 7 frame/hàng |
| `monsters.webp` | 7×14 | 10 quái và 4 boss, 7 frame/hàng |
| `roster.webp` | 8×4 | 32 chân dung theo thứ tự catalog |
| `portraits.webp` | 3×2 | An, Ông Lộc, Bà Sen, Tịnh, Người chép chuyện, Vô Danh |
| `world.webp` | 2×2 | 4 bối cảnh hồi/bàn |

[image-prompts.json](image-prompts.json) giữ prompt gốc của cả 8 lần generate (gồm atlas 10 món và ảnh Bánh tét); ảnh món được cắt ô/encode WebP bằng ImageMagick, không chỉnh sửa nội dung sáng tạo. Chỉ atlas dùng trong game và 11 ảnh món được ship. Sprite/background tổng khoảng 3.8 MB nén, khoảng 38 MB decoded cho cả 6 atlas; ba atlas chuyển động khoảng 19 MB decoded. Âm nhạc cả hai phong cách khoảng 2.65 MB, tải theo track được yêu cầu. Không prefetch toàn mode từ TCG.

Simulation thuần TypeScript chạy fixed 20 tick/s; hit xử lý tại tick xác định, canvas 2D chỉ vẽ nội suy bằng RAF. Canvas được chọn cho bàn nhỏ tối đa 19 quân sống; không cần tải thêm renderer Pixi cho mode này. DPR tối đa 2, đồ họa thấp DPR 1/giảm particle; reduce motion tắt lunge/breathing. Event ring và particle có giới hạn; quái sống tối đa 12, tổng actor/trận tối đa 60. Trận dừng khi tab ẩn hoặc phát hiện stall quá 1.5 giây để tránh bù hàng loạt tick.

Battle/prepare sở hữu `100dvh`; portrait có shop/bench dưới bàn, landscape có panel cạnh bàn. Lobby, thư viện, truyện và dialog có vùng cuộn riêng. Bố cục battle không yêu cầu scroll trang.

## Lưu và tương thích

`GameSave.autoChess` là tùy chọn nên save TCG/MGC1 cũ đọc được. Zod kiểm tra pool bảo toàn, vị trí, đội/bench, phase, kỹ năng, HP và điều kiện thắng trước khi import. Save code vẫn AES-GCM, gzip tùy chọn, giới hạn giải nén 1 MB; key ở trong mã nên đây là mã chuyển tiến trình, không phải xác thực chống sửa điểm. Save code mới có thêm UserState của Rương; mã cũ thiếu Rương giữ phần Rương hiện tại.

Import kiểm tra toàn bundle trước, giữ bản dự phòng, ghi cả hai key rồi mới đổi store; nếu ghi thất bại hoàn lại storage và giữ state trong RAM. Trận auto chess nhập ở thiết bị khác dừng cho đến khi bấm Tiếp tục. Bản dự phòng kiểu GameSave cũ vẫn phục hồi được. Dữ liệu ảnh bài đăng lưu trong IndexedDB không nằm trong mã text; ghi chú/profile/phần thưởng nằm trong UserState được chuyển.

## Kiểm tra và cân bằng

`pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm validate:catalog`, `pnpm benchmark:autochess`.

61 regression mới cho pool/ghép/bench/slots/items, windup và simultaneous lethal, determinism theo batch, tất cả 32 quân cast, pressure/timeout, phase boss, settlement một lần, thua khóa màn, save cũ/corrupt, transfer cả ba mode và rollback storage. Tổng test 206 / 17 file. Browser production flow và viewport được ghi riêng trong [VERIFICATION.md](VERIFICATION.md).

[balance-results.json](balance-results.json) dùng 3 chính sách Hỏa–Gia / Hải–Thanh / Ngọt–Gia trên 3 seed mỗi mode, không cộng vàng hay sao ngoài luật. Schema được kiểm tra sau mọi checkpoint. Mô phỏng không thay thế playtest người thật: bot có chiến lược cố định, không tối ưu mọi counter/boss; thời gian chỉ gồm giao chiến, không gồm mua/xếp/đọc truyện. Đây là cân bằng ban đầu có thể chỉnh sau phản hồi người chơi.
