# Báo cáo Adventure World 2 —23/10/2026

**Đã hoàn thành AW2-006E theo yêu cầu owner: chỉ nhân vật đầu đội đại diện khi di chuyển trên map.** Source `d11708bfb316a128e4bb2df7b0104d81e8cabee2` trên `game/adventure-world-2`.

- Map tải/vẽ một nhân vật, bỏ đoàn đi theo. Đưa nhân vật muốn dùng lên **Vị trí đội 1**, rồi **Lưu đội hình** để đổi đại diện.
- Chọn nháp/Hủy/lỗi lưu giữ đại diện cũ; tải lại tiếp tục theo đội đã lưu. Trước nhập môn vẫn hiển thị Than như trước.
- Đội lưu và trận chiến vẫn đủ năm thành viên, đúng thứ tự/EXP/nhấn Vân. Không cần reset save.

**Kiểm chứng:**78ca unit/4files và102browser assertions PASS; hai typecheck/review build/cách ly stable đạt. Đủ12nhân vật làm đại diện,4hướng đi,6vùng, mobile/furniture, lỗi lưu/retry/reload, trận5người và thiếu atlas→khôi phục. Dùng checkpoint earned nguyên văn, không phải full-story mới;386hash giữ phần không đổi ở ref gốc. [Bằng chứng](evidence/AW2-006E.md), [cách chọn đội](COLLECTION.md).

**Tiến độ giữ nguyên:** demo **≈90%**, sản phẩm **≈40%(35–45%)**,12kit/12bộ tham chiếu/**0fullDoD**. Thay đổi hiển thị này chưa đóng playtest độc lập, thiết bị thật, full-character hoặc rights.

**Tiếp theo:**[AW2-006D](tasks/AW2-006D.md), hình chibi world riêng cho boss; hiện vẫn HD idle tĩnh. Năm vùng khác vẫn debug. [Bốn gói tới≈50%](NEXT_MILESTONES.md) còn nghiệm thu; D11PROPOSED/D12OPEN.
