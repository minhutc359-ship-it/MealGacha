# Báo cáo Adventure World 2 —26/10/2026

Đã thêm **dẫn đường theo mục tiêu nhiệm vụ**: thấy cần gặp ai/đọc gì, đi qua những vùng nào và có nút đi bộ tới người hoặc cửa kế tiếp. Ba ký ức vẫn chọn tự do; giải bếp chỉ đúng bước còn thiếu; sau boss dẫn tới ghi chép rồi về Bà. Tới nơi vẫn tự E/Tương tác để chọn hành động hoặc qua cửa. [Cách dùng](DAN_DUONG.md).

Nút dẫn đường khóa khi cảnh đang tải/thiếu ảnh, đổi nhân vật đại diện chưa tải xong, lưu lỗi/tab cũ hoặc đang hội thoại. Khôi phục cảnh/đọc lại dùng đúng bản lưu thật. Nhà,32công trình,8NPC idle và12hiệu ứng môi trường hiện có giữ nguyên; một đại diện map/năm combat. Luật, va chạm, save và phần thưởng không đổi.

**57unit, hai typecheck, build/cách ly stable PASS.**335kiểm tra trình duyệt=167source+168compiled;305mới+30prefix hiện tại giữ theo hash. Source chạy mới từ tạo save tới boss thật45tick và hai ending. Compiled tiếp tục138ca từ checkpoint đổi đội thật sau30ca đã đạt, sửa harness chờ save/render; không gọi là một lượt compiled liền mạch. Cả hai không lỗi bất ngờ. Source `45a54471750961d382c807c338e75248ee261783`; [bằng chứng](evidence/AW2-008A.md).

**Demo90% / sản phẩm≈40%(35–45%) giữ nguyên:** cải thiện điều hướng chưa đóng nghiệm thu độc lập/thiết bị/full-character/rights. TheoD20tiếp tục gác010C/011A, sửa ưu tiên cũ của006Q. Tiếp theo **008B: bản đồ hành trình sáu vùng**, hiển thị vị trí/cửa và đường đi bằng dữ liệu hiện có. Chưa cập nhật rpg/master, deploy hoặc release.

Workspace note: phát hiện18tệp zip/spec/ảnh map–NPC mới chưa tracked trong lúc chốt task. Giữ nguyên ngoài commit; mới đọc README/đầu đặc tả, cần rà soát D14/D17 trước khi dùng làm canon. [Hash/preservation record](evidence/AW2-008A-workspace.json). Sau push xác minh tracked tree sạch/HEAD=remote;18tệp tham chiếu vẫn untracked có chủ đích.

008A publication PASS: source `45a54471750961d382c807c338e75248ee261783`, exact staged/independently fetched tree `5730d74fc3ed37c8fa8fc75201c3b524bb35f78f`;33blobs/index/ancestry/expected-head guards verified, non-force update and clean tracked local sync PASS.390inputfingerprint stays0cdf990a4096cfea.18incoming reference files preserved untracked with exact SHA256. [Publication proof](evidence/AW2-008A-publication.json). Final docs-only completion independently verified before success.
