# Roadmap sau Web 5.9.12

Kế thừa PLAN_SOURCE và 5.9.11. Bộ pose mới phải có tranh, đăng ký runtime và QA; không tính portrait/fallback thành hoàn tất.

| Hạng mục | Đã có | Còn lại |
|---|---|---|
| Roster P0/P2 | 39/139 bộ 32 pose; tăng tám từ 5.9.11 | 100 nhân vật: 86 portrait-only + 14 model animation cũ |
| Enemy P3 | 16/40 đối thủ đang dùng có bộ pose mới | 24 đối thủ; tám định nghĩa legacy chưa dùng chỉ giữ tương thích |
| Renderer | HD/pixel chung, contact, pause, giảm chuyển động, VFX riêng theo ID | Rig/mesh, run riêng, turn nhiều hướng, biểu cảm/lip-sync nâng cao |
| Banner 2D | 139 tuyệt kỹ; phong cảnh phủ khung và Bách dùng minh hoạ riêng từ 5.9.11 | Tiếp tục bộ pose riêng cho roster còn lại |
| QA | Unit/build/asset/browser/offline và ngân sách; PR từng đợt | Chủ dự án test thiết bị vật lý, FPS, review và merge |
| PvP | Networking giữ nguyên, bằng chứng tự động cũ được giữ | Hai máy khác mạng/NAT/TURN production do chủ dự án nghiệm thu |
| Quyền asset | Nguồn/prompt/hash 16 atlas mới; tám portrait canon tái dùng | 13 chứng cứ asset cũ còn pending; chưa commercial clearance |
| Vercel | Giữ ngân sách và build gọn, không triển khai thủ công trong đợt này | Dọn deployment cũ khi có quyền workspace phù hợp |

Tiếp tục 86 nhân vật portrait-only theo chân dung canon; sau đó hoàn thiện 14 model cũ và 24 đối thủ. Không chờ review/test vật lý để chuẩn bị đợt kế tiếp; không tự merge. `model-audit.json` có danh sách ID thực để chọn nhóm sau.
