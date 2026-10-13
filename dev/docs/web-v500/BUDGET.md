# Web 5.0 budget

| Chỉ số | Kết quả | Trần/đối chiếu |
|---|---:|---:|
| Build | 72,566,051 byte | 100,000,000 byte |
| JS gzip, tổng mọi chunk | 642,094 byte | 650,000 byte |
| CSS gzip | 95,491 byte | Giám sát |
| So với 4.9 | -5,936,378 byte | Baseline 78,502,429 byte |
| Media đi ô chuyển khỏi public | 5,918,813 byte | Giữ trong dev/archive |
| Media/runtime dependency thêm | 0 | Dùng asset có sẵn |
| Ngân sách 4.7 + 5 MB còn lại | 6,708,865 byte | 79,274,916 byte tổng |
| Dev/archive/source-map leak | 0 | 0 |

Hai atlas 4.8, SVG world và bốn walking atlases được lưu nguyên byte trong archive, không tải trong game mới. Source archive và ảnh QA nằm ngoài public/dist. Pose/nhạc/đấu trường/VFX mới dùng lại manifest và cache ảnh hiện có.

Không tăng bất kỳ trần ngân sách nào. Guard 5.0 có baseline 4.9 và phần ngân sách còn lại 772,487 byte; build mới thấp hơn baseline nên phần trống tăng. Báo cáo tái tạo bằng `pnpm build` rồi `pnpm release:size`.
