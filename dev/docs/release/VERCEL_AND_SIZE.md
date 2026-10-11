# Vercel và dung lượng Soul of Meal 3.3

**Cập nhật ngân sách web 4.1 ngày 11/10/2026:** chủ dự án đã xác nhận 100.000.000 byte tổng `dist/`, cảnh báo từ 80 MB; JS gzip vẫn tối đa 650.000 byte. [Số đo hiện tại](build-size.json) và [kiểm chứng 4.1](../web-v410/UPDATE.md) thay cho số đo lịch sử bên dưới. Đây là ngân sách chất lượng của dự án, không phải giới hạn dung lượng Vercel. Native đang tạm dừng cập nhật.

Đo ngày 09/10/2026. **Tiếp tục dùng Vercel là phù hợp**: đây là app Vite static, gameplay/AI/save chạy trong trình duyệt, không cần serverless function cho trận chiến. Dung lượng hiện tại chưa phải lý do để chuyển engine hoặc hosting.

## Bản build thực tế

| Chỉ số | Đo trên bản 3.3 |
| --- | ---: |
| Toàn bộ `dist/` | 32,975,834 byte = **32.98 MB / 31.45 MiB** |
| Bản 3.2.2 trước thay đổi | 33,919,898 byte |
| Giảm so với baseline | 944,064 byte, khoảng 2.8% |
| Số file trong `dist/` | 291 |
| JavaScript, mọi chunk | 1,529,709 byte; **487,921 byte gzip** |
| CSS, mọi chunk | 329,034 byte; **69,804 byte gzip** |
| Hình WebP | 26,052,192 byte / 218 file |
| Nhạc MP3 | 4,591,633 byte / 18 file |
| Thời gian build tại môi trường kiểm tra | Khoảng 0.8–1.2 giây; không phải cam kết thời gian CI Vercel |

MB ở đây = 1,000,000 byte, MiB = 1,048,576 byte. Gzip là nén từng chunk để so sánh code; không phải tổng lượng mạng của một phiên chơi. `dist/` là tất cả tài nguyên của game, **không tải 33 MB ở mọi lần mở trang**. Nhạc chỉ tải khi bật/có cảnh cần; atlas và các route tải theo nhu cầu.

| Nhóm | MiB |
| --- | ---: |
| Hình món ăn | 7.143 |
| TCG hình/nhạc/truyện | 10.026 |
| Auto chess hình/nhạc | 6.171 |
| Atlas nhân vật dùng chung | 3.898 |
| Hình sự kiện | 1.923 |
| JavaScript/CSS | 1.772 |
| Brand | 0.444 |
| Phần khác và pháp lý | 0.069 |

[Chi tiết và file lớn nhất](build-size.json). Archive, prompt, screenshot QA, test, script và sourcemap không có trong `dist/`; công cụ kiểm tra báo **0 file rò rỉ**. Các giấy phép/chính sách sản phẩm vẫn được phân phối.

## Những tối ưu đã thực hiện

- Rương trở thành route lazy, không kéo toàn bộ trang Rương vào entry khi vào TCG.
- AutoBoard tải sheet của quân thực sự được vẽ, bỏ preload ba sheet mặc định khi không dùng.
- VFX mới dùng Canvas hình học + alpha texture sẵn có; không thêm video/texture 4K hoặc tải bộ asset hiệu ứng mới lớn.
- File portrait cũ đã có anime thay thế chuyển ra `public/`; 6 MP3/2 banner chưa rõ giấy phép cũng được lưu ngoài runtime.
- Production config không import tool Figma/content writer; CSS chỉ scan source runtime. ZIP nguồn không có `dev/` vẫn typecheck/build được và có cùng source, public asset, CSS và tổng dung lượng output. Tên/hash chunk JS có thể đổi theo vị trí checkout; đây không phải khác biệt tài nguyên hoặc logic.

[Kiểm chứng source-only build](source-only-build.json).

## Cấu hình Vercel

Giữ framework Vite, build `pnpm build`, output `dist`. `vercel.json` thêm route fallback cho BrowserRouter; asset và HTML/TXT chính sách không bị rewrite thành trang game. Cache HTML/policy phải revalidate; asset công khai chưa có hash dùng `max-age=3600, must-revalidate` để không giữ vĩnh viễn hình/nhạc cùng tên sau cập nhật. Khi pipeline đặt hash vào mọi asset, mới nâng cache immutable lâu hơn cho chúng.

`.vercelignore` giảm source upload CLI bằng cách bỏ `dev/`, `rights/` và node_modules; notices runtime nằm trong `public/legal/` nên vẫn có. Git integration vẫn checkout repo, nhưng chỉ output của build được phục vụ. Không cần xóa tài liệu bằng chứng khỏi Git để giảm dung lượng app.

Theo [Vercel Limits](https://vercel.com/docs/limits), giới hạn **source upload qua CLI** là 100 MB Hobby / 1 GB Pro; đó không phải giới hạn tổng dung lượng static output. Gói nguồn sản phẩm có 420 file / 32,713,485 byte trước nén (ZIP khoảng 31.49 MB); dist khoảng 33 MB, chưa gần mốc source upload này. Tài nguyên static được phục vụ qua CDN; không nên dùng giới hạn bundle của serverless function để đánh giá app này.

**Hobby chỉ dành cho mục đích cá nhân phi thương mại.** Nếu bán app/thu tiền hoặc triển khai thương mại, cần Pro/Enterprise theo [Fair Use](https://vercel.com/docs/limits/fair-use-guidelines). Chưa xác định gói tài khoản của người dùng từ repo; báo cáo không khẳng định hiện đang vi phạm hay phải đổi gói ngay cho bản thử cá nhân.

## Khi viral, phần nào đáng lo?

Tổng asset hiện tại hợp lý cho game có hơn 200 hình và 18 bản nhạc. Các điểm cần theo dõi là:

1. **Bandwidth:** số phiên × byte thực tế tải mới. Ví dụ giả định 100,000 lượt × 10 MB mới tải/lượt ≈ 1 TB. Đây là ví dụ tính toán, không phải số đo app hoặc báo giá Vercel. Theo dõi Fast Data Transfer và chi phí thực trong dashboard; cache browser/CDN giúp giảm lượng tải lại.
2. **Decode/memory:** atlas 1254² giải mã RGBA khoảng 6 MB/ảnh, lớn hơn file WebP khoảng 1 MB. Bốn atlas có thể chiếm khoảng 24 MB pixel chưa tính bản GPU, các sheet khác và audio buffer. Chất lượng hoạt ảnh trên iPhone phụ thuộc bộ nhớ, fill rate, decode và browser; tăng hosting không giải quyết các phần này.
3. **Dịch vụ tìm quán:** Photon/Overpass public không phải SLA miễn phí không giới hạn. Cache, abort, timeout và fallback hiện có; khi traffic thực tăng, chọn geocoder/OSM hosting có ngân sách hoặc nhà cung cấp phù hợp. Không spam API công cộng để mô phỏng viral.
4. **Lưu cục bộ:** không đồng bộ tài khoản hoặc high score chống gian lận. Nếu sau này có PvP, tài sản trả phí hay bảng xếp hạng online, cần backend và kiểm chứng riêng; bản phát hành hiện chưa có các phần này.

Budget cảnh báo ban đầu trong `release-size.mjs`: static ≤45 MB và tổng JS gzip ≤650 KB. Đây là ngưỡng review do dự án chọn, không phải giới hạn Vercel. Khi vượt ngưỡng phải xem file mới và đo trải nghiệm trước khi tăng budget.

## Cách đo lại

```sh
pnpm build
pnpm release:size
pnpm release:source
pnpm release:web
```

| Route, chưa có trận đang chạy | Cold HTTP local | Warm HTTP local |
| --- | ---: | ---: |
| TCG `/` | 1,369,051 byte | 1,369,051 byte |
| Auto chess `/autochess` | 1,579,795 byte | 1,579,795 byte |
| Rương `/chest` | 1,591,283 byte | 1,592,257 byte |

Đây là các resource được quan sát sau khi route ổn định, không gồm mọi tài nguyên sẽ phát sinh khi bắt đầu trận/nhạc. Server local không áp dụng cache header của production; phép đo warm không cho thấy giảm transfer. Vì vậy không dùng bảng này để hứa cache Vercel hoặc tính dung lượng một phiên chơi đầy đủ.

Browser QA ghi số byte resource cold/warm theo route trong [browser-results.json](browser-results.json). Môi trường local phục vụ HTTP chưa nén, font ngoài bị chặn để phép đo tái lập; số này không phải latency/CDN transfer thực của Vercel hay FPS iPhone. Trước marketing lớn, đo lại trên domain production với mobile network throttling và thiết bị thật.
