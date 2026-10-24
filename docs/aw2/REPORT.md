# Báo cáo Adventure World 2 —24/10/2026

Đã hoàn thành **AW2-006I: đồng bộ phong cách làng với hình Làng Linh Vị của mainline**. Kho mã dùng `master` làm nhánh mặc định; hai ảnh tham chiếu được đối chiếu đúng commit, chỉ đọc và tái sử dụng định hướng hình ảnh của dự án.

Map làng đã có cảnh rộng1536×1024 gồm nhà ngói, tre, đèn lồng, cầu nước/sen/thác và vườn hoa. Thêm ba tán cây tiền cảnh, chuyển động theo camera có giới hạn và mờ khi che nhân vật. Hai nút **Bám nhân vật / Toàn cảnh** cho phép di chuyển gần hoặc ngắm cả làng; chạm màn hình quy đổi đúng tọa độ theo góc nhìn. Một nhân vật đầu đội đại diện trên map, đội combat vẫn5. Nhà/cầu ở ngoài sân hiện là phong cảnh, chưa phải khu vào bên trong. [Cách chơi](LANG_GIAO_UOC.md).

Kiểm tra kỹ thuật PASS: **72unit riêng biệt,82browser assertions trên source và bản build**, hai typecheck, ảnh gốc/WebP lossless/provenance/budget/repeat và cách ly stable. Đã kiểm tra320/390/768px, nhập môn đúng5người/30XPmột lần, đi hai chiều qua các phòng cũ, thiếu từng ảnh mới–khôi phục giữ nguyên save. Source `PENDING006I`; [chi tiết](evidence/AW2-006I.md).

**Demo90% / sản phẩm≈40%(35–45%) giữ nguyên**, art tham chiếu3/6zone. Theo yêu cầu tiếp tục hoàn thiện, nghiệm thu độc lập vẫn gác. Tiếp theo làm **Phòng Kho**, rồi Phố/Sân theo cùng phong cách; full environment/NPC motion/rights còn mở. Không có reset hoặc thay đổi nhánh product/phát hành.
