# Soul of Meal v3.1 · Huyền thoại vị giác

Bản 3.1 đổi thương hiệu thành **Soul of Meal**, logo linh hỏa/bát cơm/lá bài, icon trình duyệt và ảnh chia sẻ; giữ tiến trình cũ. Tìm quán trong Rương được hoàn thiện không cần API key: chọn đúng khu vực, phân biệt mức khớp món, lọc/sắp quán, bản đồ, chỉ đường bằng tọa độ, liên hệ và fallback Maps luôn sẵn. [Chi tiết](docs/PLACES_V31.md) · [Logo/prompt](docs/branding/LOGO.md) · [Kiểm tra](docs/branding/VERIFICATION.md).

Game thẻ bài ẩm thực trên React/Vite: **163 thẻ** (123 món ăn, 20 bí thuật, 5 người giữ vị và 15 thẻ Đoàn lữ hành), **6 chương / 18 màn** với đối thoại và boss, đấu theo lượt với AI, xây 6 bộ bài, mở 6 loại gói, chế tạo/phân rã thẻ, viền ánh kim, thương nhân NPC và nhiệm vụ ngày. Ba chế độ TCG, Rương Vị Giác (`/chest`) và Auto chess (`/autochess`) chuyển qua lại từ thanh trên, giữ tiến trình.

Người mới có bộ bài 18 lá, 300 xu, 50 tinh chất và 2 vé mở gói. Vòng chơi: **đấu cốt truyện → nhận thẻ/tài nguyên → mở gói/chế tạo/trao đổi → chỉnh bộ bài → đánh boss**. Chế độ hiện tại là chiến dịch, thám hiểm và luyện tập với AI; PvP và giao dịch giữa người chơi chưa được triển khai.

## Bản 3.0 · Auto chess hoàn chỉnh

- **Chợ Đêm Vị Linh**: chiến dịch 4 hồi/12 đợt với An, NPC, 4 boss, cutscene giữa trận và 2 lựa chọn kết truyện. Tịnh giữ một công thức duy nhất nhưng vô tình xóa ký ức người nấu; An mở lại chỗ cho nhiều giọng kể.
- **32 quân, 10 quái, 4 boss**; bàn 6×6, 3–7 quân và 6 dự bị; shop 5 ô, pool hữu hạn, khóa/đổi/XP, ghép 2–3 sao; 5 hệ, 3 nghề, 6 di vật và 6 Lời hẹn.
- **Survival Đêm Không Tắt Bếp**: địch mạnh theo đợt và thời gian đánh; cuồng nộ, giới hạn 55 giây/vòng, ghi high score local. Thử thách hằng ngày có seed chung, kỷ lục và ảnh kết quả tải về.
- **Sprite anime 2.5D** đi/đánh/niệm/ngã, hit đúng tick, lửa/nước/lá/khiên/sao, tên phép và số sát thương; 6 chân dung NPC, 32 chân dung quân, 4 bối cảnh; 5 nhạc riêng ở hai phong cách original/8-bit.
- **11 món có ảnh mới áp dụng cả Rương và TCG**; giữ bộ sưu tập và các mức giá 2.9.2. Mã tiến trình mới chuyển cả ba chế độ, trận đang chơi và kỷ lục, có bản dự phòng và rollback khi không ghi được.
- Battle/prepare vừa `100dvh`, bố cục portrait/landscape; pause khi ẩn tab, ×2, đồ họa thấp và giảm chuyển động. Lưu TCG cũ và mã MGC1 cũ vẫn đọc được.

[Luật, nội dung và asset](docs/autochess/IMPLEMENTATION.md) · [Kiểm chứng](docs/autochess/VERIFICATION.md) · [Cân bằng](docs/autochess/balance-results.json). Chạy `pnpm benchmark:autochess` để tái lập mô phỏng ba hướng build, không cấp tài nguyên ngoài luật.

## Bản 2.9 · Vị Linh xuất trận

- Nút **TCG ⇄ Rương vị giác** hiện trên thanh đầu của cả hai chế độ, giữ tiến trình khi chuyển.
- **40 lá từng chỉ có biểu tượng nay có ảnh**: 35 tranh anime RPG mới cho bí thuật/lữ hành và 5 chân dung đầu bếp đã có. Ảnh món ăn được giữ lại.
- Món ăn lưu **Ấn Vị** từ tâm huyết người nấu; trên sân, **5 Vị Linh** theo hệ hiện cùng huy hiệu món ăn. Triệu hồi, niệm bí thuật và tấn công có tranh lá bài, tư thế chủ tướng ra lệnh, vòng niệm phép, Vị Linh lao tới mục tiêu và hiệu ứng va chạm. Đây là hoạt ảnh từ diễn biến đã tính, không áp dụng sát thương lần nữa.
- Thám hiểm chỉ hiện lựa chọn chặng hiện tại; bản đồ bảy chặng, hành trang và nhật ký mở riêng. Thưởng chia bước di vật/thẻ. Nhiệm vụ phân trang theo chiều cao, thương nhân mở trong cửa sổ riêng, cửa hàng/cài đặt/bạn đồng hành và màn Rương có vùng làm việc vừa màn hình.
- Giảm chuyển động giữ luật và ảnh Vị Linh, bỏ trình diễn chuyển động. Không đổi cơ chế tài nguyên, deck 18 lá, nhạc hai phong cách hay mã tiến trình.

[Thiết kế, asset và kiểm chứng](docs/SPIRIT_ARENA_V29.md) · [Prompt từng asset](docs/spirit-arena-prompts.json).

## Bản 2.8.1 · Chơi gọn trong màn hình

Sảnh vào chơi nhanh; chiến dịch chọn từng chương; thư viện và xưởng phân trang theo kích thước màn hình. Bộ bài có hai chế độ thêm thẻ/xem nháp trên mobile, nút lưu luôn hiện. Đọc truyện và chuẩn bị trận là hai bước riêng; bản đồ, nhật ký, văn hóa và phân tích mở khi cần. Điều hướng mobile giữ năm nút chính cùng menu đầy đủ.

[Thiết kế giao diện và kiểm chứng](docs/INTERFACE_V281.md).

## Bản 2.8 · Công thức của riêng tôi

- **16 ảnh nhân vật phong cách anime 3D** cắt nền: tám nhân vật chính và tám vai phụ. Nhân vật đang nói hiện lớn trên sân khấu cutscene, đổi theo từng câu và có ảnh trong bản chép lời. Đây là ảnh render, chưa phải mô hình 3D chạy trực tiếp.
- **Hai phong cách nhạc**: Bếp Việt giữ bản phối hiện tại; 8-bit phiêu lưu có bốn bản phối pulse/arpeggio/triangle/noise mới. Nút ♫ trong trận/cutscene hoặc Cài đặt cho đổi ngay và lưu lựa chọn; không dùng nhạc Pokémon/Nintendo.
- **Ứng biến ở lượt 4**, một lần/trận, không tốn năng lượng: Đảo lửa +1 công cho quân hiện có; Giữ bếp hồi 3 ý chí và +1 chắn cho quân hiện có; Nếm ký ức rút tối đa 2 lá còn trong bộ và vừa chỗ tay. Có chân dung, vòng hiệu ứng và lời thoại riêng; trạng thái chờ/chọn theo mã tiến trình.
- Thanh chiến thuật hiện công trên sân địch và năng lượng lượt tới. Đây là thông tin nhìn thấy, không đoán bài ẩn hoặc hứa chính xác tổng sát thương. Luật boss vẫn báo trước riêng.
- **Sáu đoạn thức tỉnh boss riêng**, chỉ mở trong chiến dịch. Sửa mốc tuổi trong twist Bách/Liên, thêm manh mối trước cảnh tiết lộ; văn hóa Việt và hai đoạn kết giữ vai trò trong truyện.
- Tương thích tiến trình v1 và trận cũ; không thêm tài khoản hoặc thư viện runtime. [Thiết kế và nguồn tham khảo](docs/ANIME_TACTICS_V28.md), [asset và prompt](docs/ANIME_ASSETS.md), [kiểm tra](docs/VERIFICATION_V28.md).

## Bản 2.7 · Lời hứa bên bếp

- **Ba combo công thức**: Bữa cơm nhà, Quà phố và Bếp Tết. Ghép món → phép liên tiếp cùng lượt; hiệu quả thật, tiếng combo, vòng VFX riêng, chân dung cắt vào trận và đổi bàn đấu theo công thức.
- **13 asset gốc mới**: nhân vật chính, năm NPC, người bà, người giữ bếp; ba bàn đấu, một cảnh ký ức giữa trận và một vòng hiệu ứng alpha. Portrait xuất hiện trong hội thoại và ở chủ tướng; bàn có chuyển động môi trường theo nền.
- Boss báo hiệu lượt kế tiếp. Boss Phố Đèn Lồng có mục tiêu giữ bếp qua 3 lượt địch; boss Bến Cảng giải cứu 3 Vị Linh. Đánh chủ tướng về 0 vẫn là cách thắng. Boss thức tỉnh và bạn trợ chiến có **cutscene giữa trận**, dừng trình diễn; tải lại không mất đoạn chờ.
- **Xưởng chiến thuật**: 6 bộ, 5 phong cách gợi ý từ thẻ đã sở hữu, tìm/lọc hệ/loại/vai trò/độ hiếm, đường năng lượng, phân tích vai trò và combo, thử tay mở đầu không tiêu tài nguyên.
- **Năm truyện phụ** mở theo chiến dịch. Hai lựa chọn mỗi NPC thay đổi quà mở trận và cách trợ chiến ở lượt 3. Chơi lại có thể đổi nhánh sau khi thắng; quà chỉ nhận một lần.
- **Thử thách tuần**: 3 chặng, bộ bài được mượn và xáo cố định theo tuần Việt Nam; tính điểm/kỷ lục cục bộ, quà tuần nhận một lần. Bưu thiếp PNG 1080×1350 cho bộ bài/kết quả, có điểm thử thách và lời mời chia sẻ.
- **Không cần tài khoản**: Cài đặt → tạo mã → copy → dán trên thiết bị khác → kiểm tra → khôi phục. Mã AES-256-GCM có nén/tùy chọn tương thích, chứa cả trận/cutscene, NPC, deck và thám hiểm; giữ bản trước để quay lại. Ai có mã có thể đọc/khôi phục bản lưu.
- Tiến trình v1, 152 thẻ và Rương 112 món vẫn tương thích. [Luật và hướng dẫn](docs/LIVING_TABLE.md), [asset/prompt](docs/LIVING_TABLE_ASSETS.md), [kiểm tra](docs/VERIFICATION_V27.md).

## Bản 2.6 · Nhịp bếp trong trận chiến

- Bài được chọn có ánh sáng lướt qua; kỹ năng có vòng niệm phép, tia nối mục tiêu, va chạm, sóng quét sân và tên phép theo màu hệ. Rút bài, Vị Linh tan đi, boss thức tỉnh và đòn kết liễu có hiệu ứng riêng.
- Bốn bản nhạc gốc: trận thường, boss/cận nguy, cutscene ấm áp và cutscene bí ẩn. Tiếng triệu hồi, tung phép, lửa/nước/khiên, hồi máu, Cộng hưởng cùng giai điệu thắng/thua khớp hành động thật.
- Nút ♫ ngay trong trận/cutscene và Cài đặt game: tắt âm chung, tắt nhạc riêng, chỉnh âm lượng nhạc/SFX. Nhạc dừng khi đổi tab, rời TCG hoặc đóng nhật ký; Giảm chuyển động vẫn có âm thanh.
- Giữ nguyên luật, kinh tế, 152 thẻ, 112 món trong Rương và tiến trình cũ. Không thêm thư viện runtime.
- Nguồn nhạc và cách tạo lại: [`docs/AUDIO_ASSETS.md`](docs/AUDIO_ASSETS.md). Kết quả kiểm tra: [`docs/VERIFICATION_V26.md`](docs/VERIFICATION_V26.md).

## Bản 2.5 · Hương vị Việt Nam được trao truyền

- Gắn Tết, Bài Chòi, Quan họ, đờn ca tài tử, Trung Thu và Xòe Thái vào việc nhân vật cùng nấu, mời khách, tìm giọng người thân và truyền dạy. Bối cảnh, trận lũ và phép thuật là hư cấu.
- **Sổ hành trình Việt Nam** có 6 trang mở theo màn, giới thiệu Việt/Anh, nguồn UNESCO/Vietnam Tourism và sao chép đoạn giới thiệu kèm nguồn để chia sẻ. Tiến trình cũ tự mở trang tương ứng; đọc sổ không đổi tài nguyên.
- Tranh mới cho đêm gói bánh Tết và sân Bài Chòi; chỉnh phố Trung Thu với bánh nướng, bánh dẻo, đèn ông sao, trẻ em. Tám tranh đang dùng tổng khoảng **1.19 MiB**; ảnh sổ tải lazy, mặc định thu gọn.
- [Chất liệu văn hóa và nguồn](docs/VIETNAMESE_CULTURE.md), [prompt minh họa mới](docs/CULTURE_ASSETS.md). Giữ 18 IDs màn, luật trận, 152 thẻ, pool 112 món của Rương và bản lưu v1.

## Bản 2.4 · Vị Linh và truyện có minh họa

- Sáu minh họa cinematic WebP gốc, tổng khoảng **924 KiB**, dùng trong cutscene trước/sau 18 màn, hai đoạn kết và nhật ký đọc lại. Chương chưa mở ẩn ảnh, lời giới thiệu và tên đối thủ để không lộ bí ẩn.
- Luật thế giới: hương vị lưu **Ấn Vị**, thẻ gọi **Vị Linh** trên **Bàn Ký Ức**. ♥ chủ tướng biểu thị ý chí giữ bàn; chiến thắng tháo nút thắt của sương để ký ức trở về. Món ăn và con người ngoài bàn không bị đánh.
- Nhiên, Mộc, Hải và Liên có mất mát và lý do đồng hành riêng. Lá thư của bà và lời Liên báo trước điều kiện/cái giá của đoạn kết mới; lựa chọn cuối nói rõ bà sẽ không còn nhận ra bạn.
- Hướng dẫn ba bước **Gọi Vị Linh → Chọn mục tiêu → Nhường lượt**; gợi ý tình huống ngay trong thanh chiến thuật. Gợi ý chỉ chọn quân/bài và đưa focus tới xác nhận/mục tiêu, không tự tiêu bài hay chơi hộ. Tính từ hành động hợp lệ, có Hộ vệ, Chắn, phản đòn, Cộng hưởng và kiệt sức.
- Giữ IDs 18 màn, luật chiến đấu, tài nguyên và schema lưu v1. [Nguồn/prompt minh họa](docs/STORY_ASSETS.md), [cốt truyện có spoiler](docs/STORY_OVERVIEW.md).

## Bản 2.3 · Bàn đấu và Rương Vị Giác

- Bàn đấu chiếm viewport; máu, năng lượng, hai hàng quân, 8 lá trên tay và phần xác nhận luôn nằm trong khung. Điện thoại dọc chia tay bài thành tối đa hai hàng; điện thoại ngang đặt hai phe cạnh nhau.
- Thanh mô tả bài giữ nguyên vị trí khi chọn. Có nút đọc đầy đủ; nhật ký, luật và di vật mở trong hộp thoại. Escape hủy chọn; điều hướng phía sau bàn đấu tạm ngừng nhận focus.
- Asset alpha mới cho **lửa, nước, khiên**; animation riêng cho đạn bay, va chạm, tạo/vỡ chắn, hồi máu, cường hóa, triệu hồi, rút bài, cộng hưởng và đòn đánh theo hướng hai phe. Hiệu ứng dựa trên snapshot thật, kể cả phản đòn và Quét sân.
- Giữ nút bỏ qua, cài đặt giảm chuyển động và bản lưu v1. Asset WebP tổng khoảng 345 KiB, tải trước khi dùng trong trận.
- TCG và Rương dùng cùng nguồn **112 món**: 58 món quanh năm và 54 món giới hạn theo 9 sự kiện. Nạp cache/CSV vẫn bổ sung món cài sẵn còn thiếu; giữ món riêng và cấu hình thực đơn thường. Rương có nút **Xem món & tỉ lệ**, ảnh món và tìm kiếm không dấu theo đúng pool đang mở.
- [Tóm tắt và đánh giá cốt truyện — có spoiler](docs/STORY_OVERVIEW.md). [Nguồn và prompt asset](docs/COMBAT_ASSETS.md).

## Bản 2.2 · Chiếc ghế trống

- Viết lại 18 màn với đối thoại theo từng cảnh, hai cú lật được báo trước, 6 manh mối mở sau boss, kho đọc lại và hai đoạn kết do người chơi chọn.
- Đổi tối đa 3 lá đầu trận. Chọn bất kỳ lá trên tay để đọc kỹ năng trước khi dùng; dự báo sát thương, phá chắn, phản đòn và đổi quân ngay trên mục tiêu.
- **Cộng hưởng:** hai lá cùng hệ liên tiếp trong lượt giảm 1 chi phí lá thứ hai (có thể về 0), tối đa một lần mỗi lượt. Áp dụng cho cả bạn và AI.
- Sáu boss có nội tại riêng, tăng hiệu lực dưới nửa máu. Luật boss hiển thị trước trận và trên sân.
- Bản 2.2 thêm chế độ tập trung; bản 2.3 nâng cấp thành bàn đấu vừa viewport trên mọi kích thước đã kiểm tra. AI ra bài và tấn công từng hành động. Đường đòn đánh, vòng va chạm, số sát thương/hồi máu/phá chắn, hạ gục và âm thanh theo cài đặt. Có bỏ qua trình diễn và hỗ trợ giảm chuyển động.
- Trạng thái cuối và phần thưởng được lưu trước hiệu ứng; tải lại không lặp sát thương hoặc thưởng. Bản lưu 2.1 tự nhận giá trị mặc định, giữ thẻ, bộ bài và màn đã thắng.

## Game thẻ bài

- **Luật:** bộ bài đúng 18 lá, tối đa 2 bản/thẻ; 3 ô đồng minh, 8 lá trên tay; năng lượng tăng từ 1 đến 7. Hộ vệ, Xung phong, Lá chắn, Hút vị; triệu hồi đồng hệ nhận 1 lá chắn. Hết bộ bài chịu sát thương kiệt sức tăng dần.
- **Cốt truyện:** lần theo bí mật của chiếc muôi và năm Ngọn Lửa, gặp Bách, Nhiên, Mộc, Hải và Liên. Chọn Can đảm (34 máu / 4 lá) hoặc Thấu hiểu (32 máu / 5 lá) trước mỗi màn. Màn mở theo thứ tự; thưởng xu, XP và thẻ chỉ nhận lần đầu. Boss còn thưởng 1 vé.
- **Kinh tế:** mỗi gói 100 xu hoặc 1 vé, gồm 5 thẻ; ít nhất 1 Hiếm trở lên, ít nhất 1 Sử thi trở lên trong tối đa 8 gói. Tỉ lệ cơ bản mỗi lá: 63/25/10/2% cho Thường/Hiếm/Sử thi/Huyền thoại; bảo đảm có thể nâng độ hiếm lá cuối. Bản trùng quá 2 tự chuyển tinh chất.
- **Trao đổi NPC:** 3 đề nghị đổi thẻ mỗi ngày. Chỉ dùng bản dư ngoài số thẻ cần trong tất cả bộ bài; giữ ít nhất 1 bản. Mỗi đề nghị nhận một lần/ngày.
- **Lưu game:** `foodchest.tcg.v1` độc lập với hồ sơ cũ. Mỗi món cũ chuyển thành 1 thẻ một lần, không xóa lịch sử hoặc chìa. Trận đang đấu tiếp tục sau khi tải lại. Xuất/nhập JSON riêng ở Cài đặt game; backup JSON/ZIP chung cũng bao gồm TCG.
- **Ngày mới:** theo `VITE_APP_TIME_ZONE`, mặc định Việt Nam. Điểm danh +100 xu/+10 tinh chất; nhiệm vụ ngày và dấu mốc hành trình có phần thưởng riêng.

- **Thám hiểm:** Con đường qua sương có 7 chặng, 6 sự kiện truyện, 10 di vật, đường đi có lựa chọn và máu giữ giữa các trận. Nhặt thẻ để thay vào bộ bài hành trình, đánh tinh anh, nghỉ bếp và vượt Kẻ Nuốt Ký Ức. Hoàn thành nhận 200 xu/40 tinh chất/100 XP/1 vé, tối đa 3 lượt thưởng/ngày.
- **Bộ Đoàn lữ hành:** 15 thẻ mới (10 đồng minh, 5 bí thuật), thêm Quét sân gây sát thương lên mọi đơn vị địch, có tính lá chắn. Thẻ cũng nhận được qua gói và chế tạo.
- **Nhật ký & nâng cấp:** 20 trận gần nhất với kết quả và phần thưởng thực; thống kê thám hiểm. Bản lưu v2 tiếp tục sử dụng được, tự bổ sung trường mới.

Luật chi tiết và cấu trúc mã: [`docs/TCG_RULES.md`](docs/TCG_RULES.md).

Nếu gói tải xuống đã có thư mục `dist`, chơi bản build ngay bằng Python 3, không cần cài Node:

```bash
python3 scripts/serve-preview.py
```

Mở `http://127.0.0.1:8080`. Tiến trình gắn với địa chỉ web (origin); khi chuyển từ bản online sang local hoặc đổi thiết bị, xuất/nhập bản lưu thay vì mong trình duyệt tự dùng chung dữ liệu.

## Chế độ Rương Vị Giác

Web app gợi ý món ăn sáng, trưa và tối qua trải nghiệm mở rương theo phong cách fantasy game client. Điểm danh nhận 10 chìa mỗi ngày, giải 3 câu Đoán món để nhận thêm 3 chìa và hoàn tất Taste Swipe nhận 2 chìa. Sưu tập 58 món thường cùng 54 món giới hạn trong 9 sự kiện, dung hợp 3 phần thưởng cùng ngày, ghi nhật ký ăn uống và mở danh hiệu. Thu thập đủ món thường để mở rương vô hạn.

## Chạy local

Yêu cầu Node.js 22 và pnpm 10.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Các lệnh kiểm tra:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm validate:catalog
```

## Cấu hình

- Tìm quán hoạt động không cần API key: xin quyền vị trí hoặc nhập khu vực; dùng Photon và OpenStreetMap/Overpass tìm quán gần đó, nhấn từng quán để mở bản đồ OpenStreetMap ngay bên dưới. Dữ liệu OSM không có sao/đánh giá nên ứng dụng ghi rõ điều này và nhắc kiểm tra thực đơn. Dữ liệu vị trí được gửi trực tiếp từ trình duyệt tới dịch vụ bản đồ để tìm kiếm, không lưu vị trí trong hồ sơ.
- Tìm quán 3.1 không gọi Google Places API và không cần khóa. Nguồn quán: OpenStreetMap qua Private.coffee, tìm khu vực/tên quán qua Photon. Link Google Maps dùng Maps URLs không khóa để xem thêm và chỉ đường. Xem [tài liệu tìm quán](docs/PLACES_V31.md).
- `VITE_CATALOG_URL`: URL CSV của Google Sheet đã **Publish to web**. Người dùng cũng có thể cấu hình và xem trước nguồn trong trang Cài đặt.
- `VITE_CHEST_OPENING_AUDIO_URL`: URL ghi đè cho âm thanh mở rương. Mặc định app dùng file `public/assets/audio/chest-opening.mp3` dài 4,284 giây và đồng bộ timeline 4,14 giây.
- `VITE_DAILY_KEYS`, `VITE_CHEST_COST`: tham số kinh tế mặc định là 10 chìa/ngày và 1 chìa/lượt.
- `VITE_APP_TIME_ZONE`: múi giờ nghiệp vụ, mặc định `Asia/Ho_Chi_Minh`.

Hồ sơ, chìa, lịch sử và bài viết nằm trong `localStorage`; ảnh check-in nằm trong IndexedDB. Trang Cài đặt có xuất/nhập JSON (không chứa ảnh) và ZIP đầy đủ (có ảnh). Dữ liệu và tọa độ không được tải lên máy chủ của ứng dụng; kết quả Google Places phụ thuộc API key và quyền vị trí.

## Luồng sử dụng

- **Rương:** Chọn sáng, trưa hoặc tối; nhấn mở để chạy nghi thức chìa khóa, âm thanh và hiệu ứng. Món chỉ hiện khi nghi thức kết thúc (có nút bỏ qua và hỗ trợ giảm chuyển động). Ba banner thường chỉ có món dùng quanh năm; mỗi rương sự kiện chỉ có món độc quyền của chính sự kiện đó và chỉ mở được trong thời gian diễn ra (DEV có thể xem thử).
- **Hồ sơ:** Xem tổng quan, đổi tên và danh hiệu, xem lịch sử chìa khóa, viết check-in có ảnh; thẻ món có CTA check-in. Taste Swipe ghi nhận tag ưa thích và tăng trọng số món phù hợp tối đa 5% mà không đổi bậc hiếm.
- **Dung hợp:** Ghép 3 phần thưởng cùng ngày; chọn banner thường hoặc sự kiện đang diễn ra để xác định pool đầu ra. Hết sự kiện không thể ghép ra món của sự kiện nữa. Món đã nhận vẫn nằm trong bộ sưu tập và vẫn có thể dùng làm nguyên liệu ghép món thường.
- **Thành tựu:** Thu thập đủ 58 món thường để mở rương vô hạn vĩnh viễn. Tab Giới hạn hiển thị 6 món riêng cho từng sự kiện mùa và 6 món Tây Bắc. Tết Việt Sum Vầy diễn ra 04–16/02/2027 (mùng Một 06/02); Mùa Hè Thanh Mát diễn ra 01/06–31/08/2027. Khi nhiều banner cùng diễn ra, popup ưu tiên sự kiện bắt đầu gần nhất và dẫn thẳng tới rương sự kiện. Trang quán lân cận yêu cầu vị trí khi mở popup.
- **Bảo trì catalog:** CSV có các cột cơ bản `id,name,search_query,meal_slots,category,description,image_url,tags,weight,rarity,price_tier,active`; tuỳ chọn `name_en,description_en,country,region,categories,search_queries,base_weight,type,limited_event_id`. Tag cách nhau bằng `|`. Món giới hạn cài sẵn và món thêm trong source vẫn được tự ghép vào catalog khi dùng CSV.

## Quản trị nội dung ở môi trường DEV

Chạy `pnpm dev`, vào các mục DEV ở cuối trang **Cài đặt** để tải banner thông báo, bật/tắt popup, thêm/sửa/xóa sự kiện giới hạn và món local kèm ảnh WebP. Các thao tác này ghi thẳng vào `src/infrastructure/banner/bannerConfig.ts`, `src/infrastructure/events/limitedEvents.json`, `src/infrastructure/catalog/localDishes.json` và `public/assets/…`. Kiểm tra các file thay đổi rồi commit/deploy để đưa nội dung lên bản production; giao diện quản trị và API ghi file chỉ chạy ở môi trường development. Chế độ xem thử sự kiện ở Cài đặt hoặc trang Sự kiện chỉ ảnh hưởng máy DEV hiện tại. Thời gian sự kiện Tây Bắc hiện được cấu hình từ 18 đến 19/09/2026 và sẽ không thể mở rương sự kiện sau khi hết hạn trừ khi chỉnh lại ngày trong source.

## Tài liệu thiết kế

- [`docs/specs/FoodChest_Product_Spec_v1.md`](docs/specs/FoodChest_Product_Spec_v1.md)
- [`docs/specs/FoodChest_UI_Animation_Spec_v2.md`](docs/specs/FoodChest_UI_Animation_Spec_v2.md)
- [`docs/art-direction/README.md`](docs/art-direction/README.md)

Đây là sản phẩm lấy cảm hứng từ nhịp điệu và cảm giác “loot reveal” của game client. Không sử dụng nhãn hiệu, logo, nhân vật, âm thanh hoặc asset độc quyền của Riot Games/League of Legends.
