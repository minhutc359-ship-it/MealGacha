# Soul of Meal 4.1 · Chợ lên đèn

Phạm vi được chủ dự án xác nhận ngày 11/10/2026: chỉ web, ngân sách tổng tài nguyên 100.000.000 byte. Không sửa native/Capacitor, không sync/build APK, không tự merge. Giữ nguyên schema/receipt/ending/deck và luật phiên Auto đang chơi. Chương 10–12 tiếp tục Coming soon.

## Kết quả phải giao

1. Sửa banner Thám hiểm, tiến độ 27 màn, CTA Bộ bài, focus/Esc popup và replay lời thoại theo lựa chọn.
2. Nhạc dài có cấu trúc và hai arrangement; ba vùng có stem chiến đấu riêng. Streaming cho nhạc dài, buffer cho stem ngắn; một mixer, mute/ẩn tab/dọn tài nguyên, không đổi BPM ở ×3. Có phòng nghe và nguồn/kiểm tra âm thanh.
3. Không khí vùng rõ hơn: đom đóm/đèn chợ, mưa/gợn nước ở bến, hơi bếp; chuyển cảnh nhân vật và điểm chạm đòn mượt, giới hạn hiệu ứng, đồ họa nhẹ/reduced motion.
4. Bài tập TCG và xếp đội Auto tương tác độc lập tiến trình; phân tích kết quả Auto từ số liệu thực, không tự thay đội/quà/cân bằng.
5. Offline web theo tài nguyên đã dùng; cập nhật thủ công ở Cài đặt, không reload giữa trận, cache có giới hạn và không đụng kho tiến trình. Error boundary có xuất dữ liệu/sao lưu.
6. Web CI riêng, Android chỉ chạy thủ công. Typecheck/tests/catalog/rights/build/size, kiểm tra Chromium responsive và save cũ. Ghi rõ những phần chưa đo trên máy thật.

Đây là một bản nâng cấp hoàn chỉnh để review, không phải cam kết mọi chương tương lai có thể vừa 100 MB. Ngưỡng JS gzip 650 kB giữ nguyên; không thêm asset cho đủ ngân sách.
