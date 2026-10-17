# Roadmap sau Web 5.9.10

Nguồn: `dev/docs/web-v591/PLAN_SOURCE.md`, kế thừa trạng thái 5.9.9. Không coi pose fallback là đã hoàn tất sản xuất.

| Phần | Đã có | Còn lại |
|---|---|---|
| Roster P1/P2 | 139 nhân vật có nhận diện và tuyệt kỹ 2D; **27 bộ pose mới**, tăng bốn từ 5.9.9 | **112 nhân vật** chưa đạt bộ pose mới, trong đó 94 TCG unit còn portrait một pose theo audit trước; bốn ID mới đợt này đã có model cũ nên không trừ nhầm số portrait-only |
| Quái/tinh anh/boss P3 | Đủ 16 đối thủ hậu truyện có 32 pose và VFX riêng | 24 enemy ID đang dùng còn lại; 8 định nghĩa legacy chỉ giữ tương thích |
| Animation nâng cao | Pose atlas, contact, pause, reduced motion và renderer chung | Rig/mesh, run riêng, turn nhiều hướng, biểu cảm/lip-sync nâng cao |
| Tuyệt kỹ | Bỏ toàn bộ MP4 runtime cho 139 nhân vật từ 5.9.7, dùng 2D có hình/nền hệ/biểu tượng | Tiếp tục sản xuất pose và hiệu ứng riêng theo từng nhóm |
| QA/phát hành | Unit/build/browser tự động và ngân sách; nhánh/PR riêng | Bạn test thiết bị thật, review và quyết định merge; không lấy headless làm chứng nhận FPS/Safari thật |
| PvP | Networking giữ nguyên, bằng chứng WebRTC hai context ở web-v598 | Hai máy, khác mạng/NAT và TURN production do bạn nghiệm thu |
| Quyền asset | 12 WebP mới có prompt/hash/canon được đăng ký | 13 chứng cứ asset cũ còn pending; chưa commercial clearance |

Nhóm tiếp theo tiếp tục roster P2 chưa hoàn tất theo nhận diện canon; sau đó nâng 24 đối thủ cũ. Đợt 5.9.10 chỉ hoàn tất bốn ID ghi trong UPDATE, không nghiệm thu toàn Web 6.0. Không dừng triển khai các nhóm sau chỉ để chờ test thiết bị và review PR của bạn.
