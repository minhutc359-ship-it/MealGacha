# Ngân sách Web 6.0 · Được duyệt 16/10/2026

Áp dụng đề xuất của người dùng: mục tiêu **300 MB**, cảnh báo từ **300 MB**, trần **320 MB**. 1 MB = 1.000.000 byte. Không dùng mức 500 MB. Chính sách máy đọc nằm ở `dev/web-budget.json`, được `release:size` và công cụ đo cold launch dùng chung.

Mốc 259,78 MB thuộc bản cũ. Nền mới nhất trước thay đổi là Web 5.9.1 / PR #53, commit `bcb3a400015048382b3bdb54b9d705bddd3e31fc`, **255.361.946 byte**. Bản này không thêm artwork, animation hoặc media mới; build giảm còn **255.361.476 byte**, dư **64.638.524 byte** đến trần 320 MB.

## Phân bổ bổ sung theo kế hoạch

| Nhóm | Ngân sách dự kiến |
| --- | --- |
| 5 Vị Linh HD + Gỏi cuốn | 12 MB |
| 5 đầu bếp | 10 MB |
| Nhân vật khác, tinh anh, boss | 20 MB |
| VFX/animation dùng chung | 8 MB |
| Dự phòng | 10 MB |
| Tổng | 60 MB |

Đây là phân bổ **bổ sung dự kiến**, không phải số byte asset đã tạo hoặc đã tiêu thụ. Giai đoạn đầu chỉ dự kiến tăng 10–12 MB cho nhóm Vị Linh; không sử dụng hết 60 MB ngay và không tạo asset để lấp ngân sách. Chênh lệch giữa dư địa 64,64 MB và bảng 60 MB đến từ các phần media đã tiết kiệm ở 5.9/5.9.1.

## Mục tiêu phân phối và chất lượng

| Chỉ số | Mục tiêu | Cách áp dụng |
| --- | --- | --- |
| Tải mở mode | Dưới 8 MB mong muốn; tối đa 12 MB | Đo profile mới, bao gồm service worker; cảnh báo từ 8 MB, fail trên 12 MB |
| Nhân vật thường | 300–800 KB | Trung bình một gói asset, không cấm tệp cá biệt vượt |
| Nhân vật chủ chốt | 1–2 MB | Mục tiêu theo nhóm, ưu tiên chất lượng thực |
| Video tuyệt kỹ 720p | 1–2 MB/video | Giữ video đạt chất lượng, không tạo bản sao cho hiệu ứng nhỏ |
| FPS | 60 desktop / 30 máy yếu | Mục tiêu; giữ adaptive quality, cần đo trên thiết bị thật |
| JavaScript gzip | 675.000 byte | Guard độc lập giữ nguyên; nâng media không đồng nghĩa tăng JS |

`release:size` kiểm trần build, tổng JS gzip và kích thước precache của offline shell. Shell đơn lẻ vượt 12 MB sẽ bị chặn ở CI; ảnh/media của từng mode cần thêm phép đo browser `release:load`, vì shell không đại diện cho toàn bộ tải ban đầu. Công cụ browser thất bại nếu tổng body phục vụ trong một lượt cold launch vượt 12 MB. Đo body chưa nén giúp tránh đánh giá quá thấp JS/CSS; không coi đây là thời gian tải hay băng thông mạng thực.

## Nguyên tắc tiếp tục

- Chỉ tải tài nguyên khi mode/nhân vật/chiêu đang được hiển thị. TCG/Auto Chess/Adventure đã lazy import route; giữ cơ chế này.
- Video/SFX được tải bởi cinematic của một cast đã commit, không preload toàn đội ngay khi vào trận. Không xóa 133 video hiện có hoặc tạo bản sao.
- HD atlas/VFX native được lấy khi cinematic tương ứng mount. Adventure vẫn dùng pixel atlas trong trận, không tải HD của cả roster.
- Giữ cache ảnh decoded 64 MiB, audio có soft target 48 MiB và trần 64 MiB, cache media service worker 60 MB. Trần phát hành 320 MB không phải ngân sách RAM/cache mới. Ảnh đang dùng được lease; rời cảnh trả lease, dữ liệu không dùng được evict theo ngân sách.
- Không precache toàn bộ ảnh/video khi cài service worker. Shell/code/font được cache cho offline; media tải theo nhu cầu.
- Khi mở rộng toàn roster HD/cinematic, tách gói ít dùng theo yêu cầu. Việc này cần manifest có version, cache/integrity, xử lý offline và fallback; chưa di chuyển tài nguyên sang CDN bên ngoài trong đợt ngân sách này.

Không chỉnh save schema, roster, collection, skill/damage/reward hoặc giới hạn gameplay để phục vụ thay đổi dung lượng.
