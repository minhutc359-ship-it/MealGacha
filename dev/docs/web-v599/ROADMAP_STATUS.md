# Trạng thái roadmap sau Web 5.9.9

Nguồn yêu cầu: `dev/docs/web-v591/PLAN_SOURCE.md`. Đây là trạng thái nghiệm thu theo bằng chứng; các mục chưa xong không được đánh dấu hoàn tất chỉ vì có renderer/ảnh fallback.

| Hạng mục | Đã có | Còn lại |
|---|---|---|
| P1 — Vị Linh khởi đầu và năm đầu bếp | Sáu Vị Linh khởi đầu và năm đầu bếp có bộ HD/pixel theo manifest chung | Run/turn nhiều hướng, rig/mesh và biểu cảm/lip-sync nâng cao chưa đầy đủ |
| P2 — toàn bộ roster | 139 nhân vật có nhận diện và tuyệt kỹ 2D; 23 bộ đạt chuẩn pose mới | 116 nhân vật chưa có bộ pose mới; trong đó 94 TCG unit vẫn là portrait một pose theo audit trước |
| P3 — quái/tinh anh/boss | Đủ 16 đối thủ hậu truyện (8 quái thường + 8 tinh anh/boss) có 32 pose HD/pixel, VFX riêng và mapping gốc | 24 enemy ID đang dùng còn lại chưa được sản xuất theo chuẩn atlas mới; 8 định nghĩa legacy chỉ giữ để tương thích |
| Thay phim bằng tuyệt kỹ 2D | Hoàn tất từ 5.9.7 cho 139 Vị Linh; không MP4 runtime | Tiếp tục kiểm soát pose/VFX cho từng cohort mới |
| QA trình duyệt | Chromium và WebKit desktop/headless; bốn viewport; regression ba mode; cold launch/offline | Safari/iPhone thật, Android/GPU yếu thật và đo FPS trên thiết bị mục tiêu |
| PvP | WebRTC thật qua hai context trình duyệt, PeerServer/STUN cục bộ; reconnect/reload/ghế thứ ba/khác mode/bẫy TCG | Hai thiết bị vật lý, khác mạng/NAT và TURN production |
| Quyền asset | 48 WebP của hai cohort hậu truyện có provenance và được đăng ký | 13 asset cũ còn chờ chứng cứ; chưa đủ commercial clearance |
| Phát hành | Nhánh/PR riêng cho cohort; build trong ngân sách; không tự merge | Review/merge của chủ dự án và nghiệm thu các hạng mục chưa hoàn tất phía trên |

Thứ tự tiếp theo theo plan: tiếp tục các cohort P2 (116 Vị Linh chưa đạt bộ pose mới), sau đó nâng cấp 24 đối thủ cũ. Tám quái thường hậu truyện đã hoàn tất ở 5.9.9. Sản xuất từng nhóm với nhận diện, pose, VFX, kiểm thử và ngân sách cụ thể; không nhân bản một model sang ID khác để lấp số lượng.

Theo yêu cầu mới nhất, test trên thiết bị vật lý và review PR **do bạn thực hiện**. Đây là bước nghiệm thu của bạn; không coi kết quả headless là thiết bị thật và không dừng việc triển khai các cohort tiếp theo để chờ bước này. Các hạng mục thiết bị và chứng cứ quyền chỉ được đánh dấu hoàn tất khi có bằng chứng thực tế. Hướng dẫn hiện tại ở `HUMAN_QA.md`.
