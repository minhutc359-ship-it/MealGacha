# Phạm vi 5.9.12

| Nhóm | Thay đổi |
|---|---|
| Runtime | Tám định nghĩa visual, atlas và portrait cell cố định; tám motif VFX; sửa tên fallback cho visual ngoài Auto catalog |
| Asset | `public/assets/characters/vietnam5912/`: 16 WebP, 256 pose; portrait cũ tái dùng nguyên ô |
| Pipeline | Packer thêm cohort và pose repair có hash; inspector đọc portrait atlas gốc; audit catalog/resolver để đếm tiến độ |
| Regression | Mở rộng các test manifest/VFX/contact/reload; script Adventure nhận nhóm bốn ID và output riêng, banner preview nhận roster/viewport riêng |
| Release | Version 5.9.12, asset/dependency records, notices và build metrics; dependency lockfile và budget giữ nguyên |
| Review | Canon/prompt/hash, asset QA, model audit, báo cáo browser và ảnh minh chứng, hướng dẫn thiết bị thật |

Nhánh bắt đầu từ commit `dd69f1d4a2465957aaf7d3617dbc413efdb9ece2` của PR #62. Khi #62 còn mở, PR 5.9.12 nhắm nhánh 5.9.11 để review riêng phần tám nhân vật. Không ghi thay đổi vào nhánh #62 hoặc tự merge.

Engine chiến đấu, catalog gameplay, pool Auto, reward, unlock, storage, schema/save version và networking giữ nguyên.
