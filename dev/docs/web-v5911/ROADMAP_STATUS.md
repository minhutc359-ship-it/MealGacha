# Roadmap sau Web 5.9.11

Kế thừa `dev/docs/web-v591/PLAN_SOURCE.md` và trạng thái 5.9.10; không tính fallback/pose dùng lại thành bộ sản xuất mới.

| Hạng mục | Đã có | Còn lại |
|---|---|---|
| Roster P1/P2 | 139 nhận diện và tuyệt kỹ 2D; **31 bộ pose mới** | **108 nhân vật**, trong đó 94 TCG unit còn portrait-only theo audit trước; cohort này có model TCG cũ nên không giảm số đó |
| Enemy P3 | Đủ 16 đối thủ hậu truyện có 32 pose và hiệu ứng riêng | 24 enemy ID đang dùng; 8 định nghĩa legacy giữ tương thích |
| Animation nâng cao | Pose atlas dùng chung, contact, pause và reduced motion | Rig/mesh, run riêng, turn nhiều hướng, biểu cảm/lip-sync |
| Tuyệt kỹ | Đủ 139 tuyệt kỹ 2D, không MP4 runtime từ 5.9.7 | Tiếp tục pose và hiệu ứng riêng cho phần roster còn lại |
| QA/phát hành | Kiểm tra tự động, ngân sách, nhánh và PR | Bạn test thiết bị vật lý, review/merge; headless không thay chứng nhận FPS/Safari thật |
| PvP | Networking giữ nguyên, có bằng chứng WebRTC hai context ở 5.9.8 | Hai máy/khác mạng/NAT và TURN production do bạn nghiệm thu |
| Asset provenance | 12 WebP mới có nguồn canon/prompt/hash/đăng ký | 13 bằng chứng quyền asset cũ còn pending; chưa commercial clearance |

Đợt tiếp theo tiếp tục roster P2 theo nhận diện đã xác minh, ưu tiên các ID chưa có pose và portrait-only; sau đó nâng 24 enemy cũ. Việc bạn test thiết bị và review PR không chặn triển khai các nhóm sau. Chưa nghiệm thu toàn Web 6.0.
