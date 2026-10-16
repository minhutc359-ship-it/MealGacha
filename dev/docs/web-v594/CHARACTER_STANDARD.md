# Bổ sung tiêu chuẩn nhân vật — Web 5.9.4

Kế thừa `../web-v590/CHARACTER_STANDARD.md`, manifest Web 5.9.1 và `../web-v593/CHARACTER_STANDARD.md`. Áp dụng cho nhân vật tiếp theo mà không tạo một engine trình bày mới.

1. Xác nhận Character ID và nhận diện từ catalog, sprite đang dùng và truyện. Ghi rõ mâu thuẫn giữa portrait/model trước khi thay. Không đổi hệ hoặc kỹ năng để hợp tranh mới. Khác nhân vật phải khác silhouette, trang bị và gesture, không chỉ đổi màu.
2. HD: 4×8 ô 256 px trên 1024×2048; pixel combat: 4×8 ô 64 px trên 256×512. Tám hàng idle/walk/attack/cast/ultimate/hit/death/victory. Pivot chân (0,5; 0,9375). Chuẩn hóa một scale cho toàn actor, không phóng từng frame theo bbox.
3. Nếu weapon hoặc cánh vượt ô nguồn, tạo sheet hành động có ô rộng hơn. Sidecar đăng ký `actions.file/sourceSize/frames/rects/scale` để chuẩn hóa độ phân giải nguồn một lần; vẫn xuất atlas runtime thống nhất. Kiểm tra đầu vũ khí, chân và component từ ô bên cạnh. Không dùng các mảnh vũ khí bị cắt làm hiệu ứng.
4. Giữ model sạch khỏi hạt, trail và hào quang. VFX chính nằm ở atlas riêng; không bật đồng thời phim, cut-in, VFX fallback và model cùng diễn một hành động. Các phần tử trang phục/vũ khí thuộc model vẫn ở actor.
5. Đăng ký nhận diện, atlas, portrait, cast/foot anchor, nhịp chuyển động, motif, contact và sound trong `characterVisuals.ts`. Các renderer Adventure/Auto Chess/TCG phải tra manifest này. Tên sheet `starter-*` là khóa tương thích renderer, không có nghĩa nhân vật được thêm vào đội hình starter.
6. Chân dung standalone dùng metadata `columns:1`; `SpiritArt` giữ tỷ lệ theo metadata. Giữ tranh thẻ/món ăn đạt yêu cầu, chỉ thay trường hợp sai nhận diện hoặc trùng không chủ đích.
7. Native ultimate: 0/360/960/1500/1980/2400 ms; actor và VFX phải dùng cùng timeline. Contact thường/cast theo mode đang dùng; không dời thời điểm tính toán của reducer để sửa hình. Reload và double-skip không thêm hit, cost hoặc reward.
8. Kiểm tra media builder, movie manifest, SFX và media QA cùng lúc khi chuyển một ID sang native. Xóa đúng MP4 đã hết consumer; giữ đường dẫn MP3 hiện có. Media khác tiếp tục lazy load.
9. Kiểm tra 32 ô mỗi model không rỗng, hash riêng; xem contact sheet trên nền tối và ở kích thước thực, cả HD/pixel. Xác nhận model/timeline ở ba mode; pause, skip, reduced motion, reload, nhiều cast nối tiếp/đồng thời; lease và cue về 0 sau unmount/kết thúc.
10. Đo bản production sạch, kiểm tra toàn bộ URL trong SW và tải offline từng route. Tổng build mục tiêu 300 MB/trần 320 MB, JS gzip 675.000 byte, tải ban đầu mục tiêu 8 MB/trần 12 MB. Không tăng cache ảnh 64 MiB hoặc ngân sách audio/SW theo dung lượng đĩa. Đo 60/30 FPS trên thiết bị thật; phép đo headless chỉ là một kiểm tra hồi quy.

Tổ chức tài nguyên: nhóm versioned `public/assets/characters/<batch>/`, tên `<character-id>.webp`, `<character-id>-pixel.webp`, `<character-id>-portrait.webp`, `ultimate.webp`. Mỗi batch lưu nguồn nhận diện, prompt, hash, sidecar, bản kiểm thử, metrics và ảnh evidence nhỏ trong `dev/docs/<batch>/`. Ghi rõ pose tái sử dụng, chưa có rig hay phần khám phá chưa tích hợp; không gọi asset đã tạo nhưng chưa dùng là tính năng hoàn thành.
