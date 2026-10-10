# Soul of Meal — kế hoạch iOS và Android

Lập ngày **09/10/2026** dựa trên bản 3.3; cập nhật đánh giá Android **10/10/2026** theo 3.5. Đây là kế hoạch, chưa phải IPA/AAB đã build hoặc kết quả thử trên điện thoại thật. Xem [đánh giá web/Android mới](../major-v400/WEB_AND_ANDROID.md) và [policy](../major-v400/POLICY_REVIEW.md) để biết số đo, scope Android beta và điều kiện phát hành hiện tại; lịch5–7 tuần dưới đây là kế hoạch hai nền tảng cũ.

## Kiến trúc đề xuất

Dùng **Capacitor 8** để đóng gói React/Vite, Canvas, Web Audio và tài nguyên trong `dist/`. Giữ một codebase cho web, iOS và Android. Với game hiện có, cách này tiết kiệm hơn viết lại toàn bộ bằng Unity/React Native; nếu sau này cần rig 3D thực hoặc hàng trăm quân đồng thời, đánh giá engine riêng khi có số đo hiệu năng.

Game cài đặt chứa HTML/JS/CSS, atlas, nhạc và dữ liệu truyện ngay trong gói. Không cấu hình `server.url` trỏ đến Vercel ở bản release. TCG/Auto chess/Rương cơ bản hoạt động khi không có mạng; tìm quán và mở bản đồ cần mạng và có trạng thái lỗi rõ ràng. Vercel tiếp tục phục vụ bản web và trang hỗ trợ/chính sách.

**Không có tài khoản/cloud save trong scope.** Tiếp tục dùng mã MGC1 để chuyển tiến trình. Trình duyệt và WebView có kho lưu khác nhau: người chơi web phải xuất mã rồi nhập vào app lần đầu, không thể tự đọc localStorage của Safari từ app.

## Môi trường và quyết định cần chốt

| Hạng mục | Cần chuẩn bị |
| --- | --- |
| Công cụ chung | Node 22+, pnpm theo lockfile. Chọn cùng phiên bản Capacitor 8 cho core/CLI/iOS/Android/plugins, pin patch và kiểm tra lại yêu cầu ngay khi triển khai. |
| iOS | Máy Mac, Xcode 26+, Apple Developer; Capacitor hỗ trợ từ iOS 15. Đề xuất sản phẩm hỗ trợ iOS 16.4+ lúc đầu, nhưng quyết định cuối cùng phải dựa trên WKWebView và thiết bị thử. Ưu tiên thử iOS 17.7.x như máy người dùng hiện tại. |
| Android | Android Studio 2025.2.1+, JDK đi kèm IDE, SDK 36. Capacitor hỗ trợ API 24+, nhưng đề xuất sản phẩm minSdk 29 (Android 10) và System WebView cập nhật để giảm lỗi trình duyệt cũ; targetSdk 36 theo yêu cầu Google Play hiện hành. |
| Định danh | Tên pháp lý nhà phát hành, email hỗ trợ, quốc gia, bundle ID/applicationId lâu dài, tên app và quyền dùng thương hiệu. Không chọn ID theo người dùng GitHub tạm thời. |
| Phạm vi đầu | Không ads/IAP/tracking mới. Phát hành game đầy đủ với nội dung hiện có; chốt mô hình giá trước khi làm store listing. |

[Capacitor environment](https://capacitorjs.com/docs/getting-started/environment-setup), [iOS](https://capacitorjs.com/docs/ios), [Android](https://capacitorjs.com/docs/android), [Play target API](https://support.google.com/googleplay/android-developer/answer/11926878).

## Lộ trình khoảng 5–7 tuần

Ước lượng cho một lập trình viên toàn thời gian, quyền truy cập tài khoản và thiết bị đã sẵn sàng; thời gian xét duyệt cửa hàng không được bảo đảm. Closed test Android có thể chạy song song với hoàn thiện iOS.

| Giai đoạn | Thời gian dự kiến | Công việc và đầu ra | Điều kiện đạt |
| --- | --- | --- | --- |
| 1. Chốt bản nguồn | 2–3 ngày | Chốt branch, asset/giấy phép, chính sách, bundle ID và mốc OS; tạo baseline bundle/memory/FPS. Khóa phiên bản dependency. | Test/typecheck/build xanh; không đưa `dev/archive/` vào gói; có email và chủ thể phát hành thật. |
| 2. Dựng hai app | 3–5 ngày | Thêm Capacitor, `ios/`, `android/`, `capacitor.config.ts`, build scripts; dùng SPM mặc định iOS 8 nếu plugin tương thích; icon, launch screen, signing dev. | Mở game từ icon, chuyển cả ba chế độ, chạy một trận thật trên emulator/simulator và ít nhất một máy mỗi OS. |
| 3. Native và offline | 5–7 ngày | Adapter lưu, backup/Share, vòng đời app, âm thanh, back button, link bản đồ, quyền vị trí; self-host font kèm OFL. | Chơi và khôi phục trận sau kill/restart, bật airplane mode vẫn vào trận/truyện, xuất/nhập mã giữa web/iOS/Android đúng dữ liệu. |
| 4. Hiệu năng và UI | 5–7 ngày | Safe area, edge-to-edge Android, xoay màn hình, bàn phím, gesture, touch, DPR thấp/memory, pause khi nền; profile 10–15 phút liên tục. | Không scroll trang trong trận, không mất model/HP/XP, frame ổn định, không phát lại đòn sau resume; không crash do bộ nhớ. |
| 5. Test và hồ sơ | 14 ngày trở lên, có thể song song | TestFlight + Play internal/closed test, sửa lỗi; App Privacy/Data Safety, age rating, ảnh/video store, nội dung mô tả tiếng Việt/Anh, privacy/support URLs. | Tester hoàn thành chiến dịch/Survival, kiểm chứng nhạc/VFX cả hai style; yêu cầu closed testing được đáp ứng nếu áp dụng. |
| 6. Release có kiểm soát | 2–3 ngày + review | Archive IPA, signed AAB, metadata và release notes; gửi review, rollout nhỏ rồi tăng dần, lưu bản rollback/code/data. | Cửa hàng duyệt; bản mới đọc save cũ; có quy trình nhận lỗi và bản sửa nóng qua store. |

## Thay đổi cụ thể theo code hiện tại

### Lưu tiến trình

Tạo interface lưu chung để giữ logic domain/reducer và schema MGC1. Web vẫn dùng localStorage/IndexedDB; native dùng Preferences cho cấu hình nhỏ, file/SQLite cho save và ảnh lớn. Không nhét toàn bộ ảnh vào Preferences. Rà soát việc Preferences có được OS backup hay không và công bố tương ứng.

Chuyển dữ liệu bằng giao dịch: đọc → validate schema → ghi bản mới tạm → xác nhận → thay bản chính; giữ bản trước để phục hồi. Lưu mỗi thao tác và định kỳ trong trận như hiện tại, thêm flush khi app vào nền; không phụ thuộc vào một callback khi process đã bị OS kill. Giữ nguyên ID thẻ/quân, namespace migration và phân biệt thời gian đang chiến đấu với thời gian app ở nền.

Kiểm tra MGC1 nén và không nén trên WKWebView; khi thiếu CompressionStream tạo mã tương thích. Mã chứa cả khóa AES-GCM: ai có mã đều có thể giải mã; không quảng cáo là mật khẩu bảo mật. Nút copy/paste vẫn dùng được nếu permission clipboard bị từ chối bằng ô nhập/chọn text thủ công.

### Âm thanh và vòng đời

`App` plugin báo active/inactive: tạm dừng runtime, timer presentation và mixer khi vào nền; resume có xác nhận/tình trạng rõ ràng, không cộng thời gian nền vào Survival. Xử lý cuộc gọi, headphone/Bluetooth, silent mode iOS, AudioContext suspended và context loss. Không phát lại SFX của frame đã xử lý.

Nhạc MP3 bản original và 8-bit nằm trong gói. Giới hạn AudioBuffer cache, crossfade đúng cảnh, mở audio sau thao tác đầu. Giữ nút âm thanh, mức nhạc/SFX và Giảm chuyển động. Các hiệu ứng mới không làm thay đổi sát thương, thứ tự hit hoặc phần thưởng.

### UI/điều khiển

Rà `env(safe-area-inset-*)`, `viewport-fit=cover`, `100dvh` và bàn phím trong WKWebView; hỗ trợ notch/home indicator và Android edge-to-edge. Xoay dọc/ngang khi niệm phép không khởi động lại action. Back Android đóng popup → rời màn, chỉ hỏi xác nhận khi thật sự đang bỏ trận. Drag/drop trên bàn/dự bị không bị native scroll/long press chiếm gesture.

`Share`/`Filesystem` thay download bằng Blob cho postcard và ZIP; lưu ảnh vào nơi người chơi chọn. Mở Google Maps/liên kết ngoài bằng trình duyệt/intent ngoài app, không để website bên ngoài thay thế game trong WebView. Haptics ngắn cho chọn bài/ghép sao/va chạm nếu người chơi bật, không rung cho mọi particle.

### Quyền và riêng tư

Chỉ xin foreground location khi bấm “gần đây”; không background location. Rương vẫn tìm được bằng khu vực nếu từ chối. Photo picker dùng lựa chọn giới hạn thay cho quyền đọc toàn bộ ảnh khi khả thi. Chỉ khai báo những quyền thực sự cần.

Kiểm kê SDK/plugin native, Privacy Manifest và required-reason APIs theo API thực dùng; App Privacy/Data Safety phải phản ánh cả dịch vụ bản đồ, logs hosting và backup. Chính sách HTML ở `/legal/privacy.html` công khai không đăng nhập. Hoàn thiện tên/email nhà phát hành và URL hỗ trợ trước submission.

### Hiệu năng

Đặt mục tiêu ban đầu (cần đo trên máy thật): 60 FPS trên máy tầm trung, chế độ nhẹ 30 FPS khi cần; input phản hồi dưới 100 ms; cold start local khoảng dưới 3 giây ở thiết bị mục tiêu. Đây là mục tiêu, chưa phải kết quả đã đạt.

Kiểm tra 9 shared atlas1254×1254 hiện có: mỗi ảnh giải mã RGBA khoảng6MiB dù WebP khoảng1MB; tất cả khoảng54MiB nếu cùng resident, không giả định luôn được tải đồng thời. Thử tải/xóa cache theo màn, gộp lại khi bộ nhớ ổn định; DPR tối đa 2 và preset nhẹ DPR 1. Profile Canvas fill rate, GC, decode ảnh và audio buffer, không chỉ nhìn dung lượng tải. Không nâng texture lên 4K chỉ để tăng độ nét.

## Các lệnh dự kiến khi bắt đầu triển khai

Đây là ví dụ dùng Capacitor major 8, không phải lệnh đã chạy trong bản web 3.3. Thay ID minh họa bằng ID thuộc chủ sở hữu thật trước `cap init`, pin cùng patch sau khi chọn bộ plugin.

```sh
pnpm add @capacitor/core@8 @capacitor/ios@8 @capacitor/android@8
pnpm add -D @capacitor/cli@8
pnpm exec cap init "Soul of Meal" "com.yourcompany.soulofmeal" --web-dir dist
pnpm build
pnpm exec cap add ios
pnpm exec cap add android
pnpm exec cap sync
pnpm exec cap open ios
pnpm exec cap open android
```

Config release có `webDir: "dist"`; không có remote `server.url`, cleartext, tùy chọn debug hoặc token. Thêm lệnh sync/build riêng từng OS; lưu `ios/`/`android/` trong Git, loại build output và signing secrets. CI Android tạo AAB bằng secret upload key; CI iOS chạy trên macOS với signing/profile/App Store Connect key theo quyền tối thiểu.

## Ma trận kiểm thử bắt buộc

| Nhóm | Thử nghiệm |
| --- | --- |
| Thiết bị | iPhone iOS 17.7.x, iPhone iOS mới, iPhone màn nhỏ, iPad nếu khai báo hỗ trợ; Android RAM 4 GB và máy tầm trung Android 16/API 36. OS tối thiểu của sản phẩm cần máy/emulator riêng. |
| Game | TCG thắng/thua/đấu boss, gói thẻ, bộ bài, đọc truyện; Auto mua/ghép/XP/drag/drop, cả campaign/Survival/Daily, thắng→dance→reward; Rương/vòng quay/tìm quán và từ chối quyền. |
| Presentation | Projectile/slash/shield/heal/channel, original/8bit, mute, reduced motion, low quality; 320×568, 390×844, 667×375, 844×390 và tablet; xoay ở giữa action. |
| Vòng đời | Home/lockscreen/cuộc gọi khi đang đánh, background 5 phút, OS kill, mở lại, update đè bản cũ; không nhân đôi thưởng hay cộng thời gian nền. |
| Lưu | Save cũ, trận đang chạy, mã MGC1 tampered/không nén, ZIP có ảnh; round-trip web→iOS→Android→web. Lỗi ghi/mất dung lượng không xóa bản chính. |
| Mạng | Offline, mạng chậm, timeout Overpass/Photon, request fail, mở map ngoài; không treo battle khi tìm quán lỗi. |
| Hiệu năng | 15 phút Survival, boss triệu hồi, nhiều VFX, đổi màn liên tiếp và nhạc crossfade; đo FPS p95, memory peak, nhiệt/pin bằng Xcode Instruments/Android profiler. |

## Store, ngân sách và phát hành

Apple Developer thường **99 USD/năm**, Google Play **25 USD một lần**; xem mức tiền/thuế theo quốc gia và loại tài khoản khi đăng ký. Mac, thiết bị thử, nhân lực và hosting thương mại là chi phí riêng; không ước lượng doanh thu từ lượt tải chưa có dữ liệu.

Apple yêu cầu sản phẩm có giá trị sử dụng và chất lượng vượt một website đóng khung đơn giản. Game đầy đủ, hoạt động offline, native save/share/haptics và điều khiển tốt là hướng đáp ứng, **không bảo đảm được duyệt**. Gửi review notes mô tả các mode, cách test và nội dung ẩm thực Việt Nam; tránh tuyên bố được Riot/Nintendo bảo trợ.

Google Play yêu cầu app/update mới target **API 36** từ 31/08/2026. Tài khoản cá nhân tạo sau 13/11/2023 có yêu cầu closed test **ít nhất 12 tester liên tục 14 ngày**, sau đó xin quyền production; không phải cứ đủ ngày là tự động được duyệt. Kiểm tra AAB ký, native library tương thích page size theo yêu cầu Play và pre-launch report.

Nếu sau này bán vật phẩm số/gói/ngọc, triển khai và rà quy định StoreKit/Play Billing theo thị trường thực tế, restore purchase, receipt và hoàn tiền. Gacha dùng tiền thật cần công bố odds trước mua; bản hiện tại chỉ dùng tài nguyên ảo không thanh toán. Không tự thêm quảng cáo/IAP trong bước đóng gói đầu.

Với dữ liệu web khoảng 32 MB hiện nay, AAB/IPA cài đặt có thêm WebView/native runtime/plugin và file store; **chưa có số đo native để kết luận dung lượng cuối**. Đo APK/AAB download estimate và app thinned size sau giai đoạn 2, trước khi đặt budget chính thức.

Mỗi release ghi phiên bản code, schema và manifest asset. Update code qua store; nếu tải thêm content/data từ CDN, dùng manifest version/hash, validate schema, cache và rollback, không dùng tải code từ xa để né review. Giữ save tương thích ít nhất bản trước, rollout nhỏ và có bản sửa khẩn cấp qua store.

## Nguồn chính thức

- [Capacitor setup](https://capacitorjs.com/docs/getting-started/environment-setup), [updating to 8](https://capacitorjs.com/docs/updating/8-0), [storage](https://capacitorjs.com/docs/guides/storage), [iOS Privacy Manifest](https://capacitorjs.com/docs/ios/privacy-manifest).
- [Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [membership](https://developer.apple.com/programs/enroll/), [upcoming requirements](https://developer.apple.com/news/upcoming-requirements/).
- [Google Play registration](https://support.google.com/googleplay/android-developer/answer/6112435), [target API](https://support.google.com/googleplay/android-developer/answer/11926878), [closed testing](https://support.google.com/googleplay/android-developer/answer/14151465), [policy center](https://play.google.com/about/developer-content-policy/).

Rà lại các trang này vào ngày submission vì yêu cầu có thể đổi sau ngày lập kế hoạch.
