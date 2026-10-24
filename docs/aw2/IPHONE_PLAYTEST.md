# Chơi thử AW2 trên iPhone

Owner chọn iPhone cho AW2-011A. AW2-011B chuẩn bị phiếu phản hồi và mã bản chơi; lượt nghiệm thu độc lập/điện thoại thật vẫn **NOT_RUN**. Dùng [checklist hành trình](PLAYTEST_100_CHECKLIST.md) để nghiệm thu, không suy ra PASS từ phiếu hay số đo tự động.

## Mở đúng bản chơi

Người chuẩn bị bản thử cung cấp một URL **HTTPS được Safari tin cậy**, trỏ vào thư mục `dist-aw2` của bản review đã ghim mã. Đường vào là `/dev/aw2/world.html` hoặc root của bản review. Hiện chưa có URL iPhone được phát hành trong task này; không có deploy hay cấu hình chứng chỉ trên thiết bị. `localhost`/`127.0.0.1` trên iPhone trỏ vào chính điện thoại, không phải máy lập trình.

AW2 dùng Web Locks để bảo vệ việc ghi save giữa các tab; API này thuộc secure context theo [Web Locks specification](https://www.w3.org/TR/web-locks/#navigator-mixins). [WebKit công bố hỗ trợ từ Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/#web-apis). Vì vậy, HTTP qua địa chỉ LAN không phải đường nghiệm thu lưu trữ trên iPhone. Xem khả năng thực tế trong phiếu (`secureContext`, `webLocks`), không chỉ dựa vào phiên bản trình duyệt. Trình duyệt có API vẫn có thể từ chối lưu; phải thử save/reload thật.

Ưu tiên chứng chỉ HTTPS đã được thiết bị tin cậy. Theo [Apple](https://support.apple.com/en-au/102390), cài một profile chứa chứng chỉ thủ công không tự làm chứng chỉ đó được tin cậy cho SSL. Task này không cài profile/chứng chỉ hay thay đổi mức tin cậy trên iPhone.

Trên máy chuẩn bị review:

```sh
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1
```

Lệnh preview trên chỉ để kiểm tra local. Hosting HTTPS cho iPhone là bước riêng; không coi một server HTTP local là URL điện thoại đã sẵn sàng.

## Tạo phiếu phản hồi

1. Mở bản thử trong Safari bằng hồ sơ QA riêng, ghi model iPhone, phiên bản iOS/Safari và ngày giờ. Xem phần “Phiếu phản hồi chơi thử” ở màn khám phá, kể cả khi chưa tạo được save.
2. Nhập thiết bị, bước vừa làm, kết quả mong đợi và lỗi quan sát được. Không nhập mật khẩu, token hay thông tin riêng vào nội dung tự do.
3. Nếu cần, bấm “Đo nhịp khung hình (3 giây)” rồi giữ trang hiển thị. Đóng phiếu, chuyển game mode hoặc đưa trang ra nền sẽ hủy mẫu. Đây là nhịp RAF của trang đang mở, không phải benchmark FPS game/GPU.
4. Bấm “Tạo phiếu phản hồi”, đọc nội dung rồi “Tải phiếu JSON” hoặc “Sao chép phiếu”. Nếu Safari không cho sao chép tự động, nội dung được chọn để dùng Sao chép của thiết bị; có thể dùng tệp tải thay thế. Gửi tệp/nội dung qua kênh đang trao đổi với chủ dự án.
5. Sau khi chơi tiếp, bấm Tạo phiếu lần nữa. Phiếu cũ giữ đúng thời điểm đã tạo, không tự thay bằng save mới. Reload sẽ xóa nội dung phiếu trên trang; xuất phiếu trước khi reload.

Phiếu không tự gửi qua mạng hoặc được lưu vào game. Nó chỉ lấy capability, metadata bản chơi, các mốc tiến trình đã commit được cho phép và nội dung bạn nhập. Nó không tự đính kèm raw save, saveId, lịch sử legacy, URL/query hay thông tin đăng nhập. Bộ nhớ là JS heap khi browser cung cấp; `null` nghĩa là không có số đo. Thời gian navigation không chứng minh cold load; cần ghi điều kiện cache/mạng bằng quan sát riêng.

## Đối chiếu bản và lượt nghiệm thu

`codeFingerprint` là SHA256 theo đường dẫn + byte đã sắp xếp của mã/asset runtime AW2, hai config review/dev, công cụ đóng dấu và dependency manifests. `baseGitSha` là HEAD lúc build/serve; `sourceDirty` cho biết đầu vào còn thay đổi khi đó. Mã nội dung giữ nguyên qua commit chỉ sửa tài liệu. Muốn so desktop/iPhone, dùng cùng compiled artifact và cùng fingerprint; không so mỗi tên tệp tải hoặc chuỗi user-agent.

Ghi riêng cold/warm load, điều khiển chạm, portrait/landscape, cuộn/bàn phím iOS, âm thanh sau opt-in, save/reload và khôi phục sau lỗi. Hoàn tất tuyến sáu vùng, puzzle, TCG, Auto Chess, boss/ultimate, ending và đấu lại theo checklist. Phiếu luôn ghi `NOT_REVIEWED / NOT_VERIFIED / NOT_AWARDED`; tester chỉ đóng cổng khi có bằng chứng độc lập thực tế. WebKit headless và màn hình mô phỏng không thay lượt chơi trên iPhone.
