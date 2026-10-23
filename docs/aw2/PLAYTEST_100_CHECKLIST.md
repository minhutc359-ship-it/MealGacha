# Checklist nghiệm thu demo 100% / product 45%

Không đánh dấu PASS trước khi có một người chơi không triển khai thay đổi thực hiện. Dùng build cùng SHA cho desktop và điện thoại; hồ sơ/trình duyệt QA riêng, không reset dữ liệu Soul of Meal.

## Thông tin phiên

- Commit/build SHA:
- Ngày/giờ:
- Người chơi độc lập:
- Desktop OS / trình duyệt / phiên bản:
- Điện thoại thật / OS / trình duyệt / phiên bản:
- Source hay compiled review build:
- Thời gian từ save trống tới ending:

## Hành trình bắt buộc

- [ ] Tạo save AW2 mới; legacy/Soul of Meal không đổi.
- [ ] Gặp Bà, đọc khăn, nhận đúng năm starter một lần.
- [ ] Đi đủ sáu vùng; hai chiều/đường về/va chạm không kẹt.
- [ ] Hoàn tất ba ký ức, chọn một mạch, giải puzzle sai rồi đúng và reload giữ trạng thái.
- [ ] Mở rương một lần; nấu và chia bữa; EXP/vật phẩm/receipt không nhân đôi.
- [ ] Chơi một ván TCG hợp lệ và trở về đúng checkpoint, không nhận thưởng RPG.
- [ ] Chơi một ván Auto Chess hợp lệ và trở về đúng checkpoint, không nhận thưởng RPG.
- [ ] Đi tuyến Phòng Lửa → Phòng Bàn bằng waypoint và điều khiển native; mục tiêu/puzzle/boss dễ nhận biết.
- [ ] Bắt đầu boss với đúng đội đã lưu; dùng ultimate; thử pause/step/reduced motion/audio opt-in.
- [ ] Lưu kết quả thắng, đọc ghi chép, chọn một ending; quest/reward/shortcut ghi đúng một lần.
- [ ] Reload và xác nhận màn hoàn tất, inventory/EXP/party/ending giữ nguyên.
- [ ] Đấu lại boss không thưởng; thua/rút lui không đổi ending/reward.
- [ ] Thử stale tab hoặc failed write theo hướng dẫn QA; dữ liệu mới hơn không bị ghi đè.

## Baseline thiết bị và UX

- [ ] Desktop: keyboard, click destination, resize 320/390/768, text/controls không che nội dung quan trọng.
- [ ] Điện thoại thật: touch movement/interaction/ultimate/scroll, portrait và landscape nếu hỗ trợ.
- [ ] Ghi cold/warm load, FPS quan sát được, memory nếu công cụ có số đo; không ước lượng số liệu không đo.
- [ ] Audio chỉ chạy sau opt-in, không lặp/mất cue gây hiểu sai kết quả.
- [ ] Save/reload/recovery hoạt động trên cả hai môi trường đã ghi.

## Lỗi và kết luận

Với mỗi lỗi: bước tái hiện, zone/mode, ảnh/video/log nếu có, mức `BLOCKER / MAJOR / MINOR`, expected/actual và trạng thái fix/retest.

- Blocker còn mở:
- Major còn mở:
- Minor chấp nhận cho demo:
- Hướng dẫn gây nhầm:
- Kết luận AW2-010C: `PASS / FAIL / BLOCKED`
- Kết luận AW2-011A: `PASS / FAIL / BLOCKED`

Chỉ khi hai kết luận PASS, automated integration gates PASS và tuyến world/UX được BA/tester nghiệm thu mới cập nhật `PROGRESS.md` thành demo100% / product45% và mở PR milestone. Checklist trống không phải bằng chứng PASS.
