# Web 5.1 · Ngân sách minh hoạ và hiệu ứng

| Chỉ số | Kết quả | Trần / đối chiếu |
|---|---:|---:|
| Build 5.0 | 72,566,051 byte | Baseline |
| Build 5.1 | 78,386,786 byte | 100,000,000 byte |
| Tổng tăng | 5,820,735 byte | **6,000,000 byte** |
| Còn trong phần 6 MB | 179,265 byte | Không tăng trần |
| Media mới: 11 atlas WebP | 5,797,504 byte | 139 chân dung, 64 icon, 6 cảnh tuyệt kỹ |
| Phần tăng còn lại | 23,231 byte | Mã, CSS, metadata/SW |
| JS gzip, tổng mọi chunk | 647,855 byte | **650,000 byte** |
| CSS gzip | 97,101 byte | Theo dõi |
| Còn trong trần gốc 4.7 + 5 MB | 888,130 byte | Tổng trần 79,274,916 byte |
| So với build 4.9 | −115,643 byte | 4.9: 78,502,429 byte |
| Media/code Android hoặc iOS thay đổi | 0 | Web only |
| Runtime dependency thêm | 0 | Không tăng |
| Dev/archive/source-map leak | 0 | Không ship QA/prompt vào app |

`release-size.mjs` kiểm tra phần tăng 6 MB từ baseline 5.0 và giữ nguyên giới hạn JS gzip 650 KB/static 100 MB. Mốc 6 MB cũng thấp hơn phần ngân sách còn lại sau 5.0 là 6,708,865 byte. Không thay trần để hợp thức hoá build.

Chín atlas chân dung chiếm 4,751,008 byte; atlas skill 530,668 byte; atlas cảnh tuyệt kỹ 515,828 byte. PNG tạo bởi imagegen được mã hoá WebP quality 86 (portrait), 90 (skill), 85 (ultimate), không thêm phiên bản PNG vào `public`. Hash/kích thước/mapping/prompt và provenance trong `artwork.json`, `art-prompts.json`, các prompt skill/ultimate và `rights/ASSET_REGISTER.json`.

Code/font precache theo cơ chế web hiện có; media cache khi dùng. Portrait có IntersectionObserver để tải atlas gần vùng nhìn; chiến đấu preload cảnh tuyệt kỹ nhằm tránh lần tung chiêu đầu chờ tải ảnh. Không preload chín atlas để vào bản đồ. Bounds cache chỉ giữ metadata cố định; ảnh sprite vẫn dùng cache có lease và trần 64 MiB. Preset nhẹ/reduced motion tắt chuyển tiếp hai pose và VFX phụ; không ảnh hưởng mô phỏng.

Tái tạo: `pnpm build`, `pnpm release:size`, `node --check dist/sw.js`. Số đo authoritative nằm ở `dev/docs/release/build-size.json`.
