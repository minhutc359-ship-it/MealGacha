# 4.0 — Dung lượng web và khả năng làm Android

Đánh giá ngày 10/10/2026 trên master 3.5.0 và nhánh nghiên cứu. **Web build được kiểm chứng; chưa tạo project Android hoặc build APK/AAB.** Các mục tiêu 4.0 là đề xuất, không phải số đo của một bản 4.0 đang chạy.

## Dung lượng hiện tại có hợp lý cho web không?

**Có, với điều kiện tải theo màn và quản lý bộ nhớ.** Sau khi mở rộng chính sách trong PR này, production build là **39.20 MB**, vẫn dưới budget 45 MB hiện có. Đây là tổng các file được phân phối, không phải trang đầu buộc tải 39 MB. React đã tách route; audio tải theo cảnh và thao tác bật âm. Các số từ `release:size` là byte file và tổng gzip JS/CSS, chưa thay cho đo transfer/LCP/ready trên mạng thật.

| Số đo | 3.5 trước bổ sung | Build sau chính sách | Ý nghĩa |
| --- | ---: | ---: | --- |
| Toàn dist | 39,175,032 B | **39,200,366 B** | Tăng 25,334 B; không thêm asset 4.0 |
| Tổng JS gzip, 37 chunk | 508,415 B | **511,915 B** | Đây là tổng mọi route/vendor, không một bundle trang đầu |
| Tổng CSS gzip | 74,713 B | **74,713 B** | Chưa đổi CSS gameplay |
| WebP | 31,231,828 B | 31,231,828 B | 224 file; thành phần lớn nhất |
| MP3 | 5,524,311 B | 5,524,311 B | 18 file, 2 phong cách hiện có |
| Số file dist | 297 | 297 | Không có dev/archive/test/source map |
| Dư địa static đến 45 MB | 5,824,968 B | **5,799,634 B** | Cần dành cả code/CSS/font/legal, không chỉ art |
| Dư địa JS gzip đến 650 kB | 141,585 B | **138,085 B** | Thêm renderer/mixer vẫn phải review code splitting |

MB trong bảng là hệ thập phân; 39,200,366 B ≈37.38 MiB. Byte gzip là đo từng file level 9 cộng lại, không phải billing hoặc transfer đã quan sát ở Vercel.

### Lượng tải đã quan sát khi mở màn

Chromium 153 trên production build cục bộ, viewport 390×844, mỗi route một context mới, save hợp lệ mới, âm thanh tắt và chưa bấm chơi. Ghi lại request đến lúc network idle rồi cộng kích thước file tương ứng; cột gzip nén các file text level 9, giữ nguyên ảnh. Google Fonts bị chặn để kiểm tra lặp lại được.

| Route | File cục bộ được yêu cầu | Byte file gốc | Tương đương khi gzip text |
| --- | ---: | ---: | ---: |
| `/` · TCG | 18 | 1,400,117 B | **611,982 B ≈0.61 MB** |
| `/autochess` | 18 | 1,660,723 B | **955,066 B ≈0.96 MB** |
| `/chest` · Rương | 27 | 1,609,076 B | **685,125 B ≈0.69 MB** |

Các lần mở này chưa tải toàn bộ 39.20 MB. Chúng nằm dưới mục tiêu 2 MB theo phương pháp cộng file trên, nhưng **chưa chứng minh transfer CDN, thời gian sẵn sàng 3 giây, lần vào trận hoặc lượt chơi dài**. Cần cộng font thực và đo các thao tác mở roster/trận/nhạc trong PR triển khai. Dữ liệu: [browser-policy-results.json](browser-policy-results.json).

### Phần dễ vượt là RAM

9 atlas shared 1254² hiện nén khoảng 9.06 MB; nếu tất cả giải mã RGBA sẽ khoảng **54 MiB**, trước bản sao GPU/padding. Không khẳng định tất cả đang resident. Cache ảnh hiện là Map chưa có trần, nên đổi nhiều màn có thể giữ tài nguyên lâu. Một track Auto battle ~61.99 giây stereo dùng khoảng **23.80 MB PCM float ở 48 kHz**; 3 stem dài tương tự có thể rất tốn RAM dù MP3 nhỏ. SampleRate file không bảo đảm sampleRate AudioBuffer sau decode.

Phải đo và giới hạn theo `width × height × 4` cho texture, `length × channels × 4` cho AudioBuffer thực. Cache có lease và evict tài nguyên không còn dùng; không preload 14 model/3 sân/6 họ cue ở menu. Mục tiêu ban đầu: texture ≤64 MiB steady/96 MiB transient, audio ≤48 MiB steady/64 MiB transient, gồm buffer đang được source giữ. Đây là phần tài nguyên, không phải tổng RAM browser/native.

### Chốt phạm vi hợp lý

| Phương án | Budget đề xuất | Điều kiện và tác dụng |
| --- | --- | --- |
| Mẫu đầu / phát hành gọn | **Giữ 45 MB**, JS gzip 650 kB | 1 sân, 4 model/1 boss ưu tiên, 1 họ nhạc 3 stem, truyện dùng crop nền; chứng minh chất lượng trước |
| Pack đầy đủ truyện/clip/nhạc | Xem xét **50–55 MB** sau mẫu | Có thể làm đủ 3 sân, 12 model/2 boss, 9 màn truyện và thêm họ soundtrack; phải có số đo first load/RAM/FPS, không tăng budget tự động |
| Full 3D/video/voice toàn truyện | Chưa chọn | Tăng công sản xuất, decode và QA; chưa có bằng chứng đem lại lợi ích cho game này |

Budget net asset 4.4 MB trong kế hoạch đầu **là giả thuyết sản xuất**, không chứng minh mọi frame và soundtrack mới sẽ vừa. Nếu phải giữ 45 MB, giảm số lượng asset mới/reuse theme hoặc chia pack phát hành; không giảm độ rõ thông tin hay bỏ save guard. Không xóa file legacy vẫn đang có URL/scene dùng chỉ để làm đẹp báo cáo. Ngưỡng `release-size.mjs` vẫn 45 MB trong PR này; 55 MB chỉ có thể được duyệt bằng PR triển khai kèm profile.

Mục tiêu route lạnh ≤2 MB compressed trước audio tùy chọn, ready ≤3 giây ở 10 Mbps/RTT 100 ms là gate 4.0, **chưa được chứng minh bằng build-size**. 2 MB riêng thời gian tải lý tưởng đã ~1.6 giây, chưa kể RTT/decode/JS; cần trace để biết phải giảm ảnh đầu nào. Background, âm thanh và art tiếp theo phải lazy-load; ưu tiên tải asset nhìn thấy, không blocking hết roster.

Frame normal p95 ≤20 ms, nhẹ ≤35 ms; cap DPR 2/1; reduced motion riêng. Đo 15 phút trên điện thoại RAM 4 GB, Safari và desktop, gồm ×3/resize/context loss. Loại bỏ filter quá đắt trước khi giảm FPS hoặc đổi engine.

### Hosting và băng thông

45 MB là budget của repo, không phải giới hạn Vercel. Tài liệu Vercel phân biệt upload source qua CLI (Hobby 100 MB/Pro 1 GB) với build output và băng thông; repo có `dev/` lớn không đồng nghĩa dist lớn. Không suy cấu hình/plan từ commit status `success`. PR này không deploy, không đổi billing hoặc cache hosting.

Một ví dụ tính tải: 1,000 phiên lạnh nếu tải hết 39.20 MB sẽ ~39.20 GB; 10,000 phiên ~392 GB. Nếu chỉ tải route 2 MB thì khoảng 2/20 GB trước nhạc/các màn khác. Đây là kịch bản, không số usage thật; cache, revisit và lựa chọn mode thay đổi lượng tải. Cần xem usage của plan thực khi có người chơi. Hosting thương mại phải theo điều kiện Vercel hiện hành; Hobby chỉ cho cá nhân/phi thương mại.

Web offline/PWA là hạng mục riêng: manifest hiện có không chứng minh đã có cache version/offline install. Không thêm service worker chỉ để “tải nhanh” mà chưa xử lý activation, asset stale, quota và save recovery. Xóa cache asset phải tách khỏi xóa tiến trình.

## Android có build được không?

**Có cơ sở kỹ thuật để làm bằng Capacitor 8**, giữ React/Vite/Canvas/Web Audio và bundle `dist` vào app; không cần viết lại game bằng Unity/React Native. Đây là kết luận khả thi từ kiến trúc, không phải APK đã build hoặc FPS native đã đạt.

| Hạng mục kiểm tra | Hiện trạng | Việc cần trước beta |
| --- | --- | --- |
| Frontend | Build Vite tĩnh đạt; không cần Node backend cho trận | Bundle `dist`, `webDir: "dist"`, không remote `server.url` |
| Native project | Chưa có `android/`, Capacitor config/dependency | Tạo nhánh riêng với app ID của nhà phát hành thật, pin phiên bản đã kiểm tra |
| Công cụ phiên này | Node 24; Java runtime 17; không tìm thấy `adb`, `sdkmanager`, `gradle` trên PATH | Android Studio/SDK/build tools/JDK tương ứng; thiết bị hoặc emulator |
| Lưu | localStorage/IndexedDB + MGC1/ZIP | Adapter native durable, recovery/journal và flush khi vào nền; không dựa hoàn toàn localStorage |
| Hiệu năng | Canvas/clip/Web Audio có thể chạy trong WebView | Profile máy RAM 4 GB và máy Android 16; không lấy kết quả Chromium headless làm FPS Android |
| Phân phối | Chưa có signing key/store listing/Play Console được xác minh | APK debug để test; signed AAB để Play, bảo vệ và sao lưu upload key |

Capacitor stable v8 hỗ trợ API 24+, còn docs `/next` là v9 và có minimum khác; dùng đúng tài liệu v8, không trộn requirements. Đề xuất sản phẩm ban đầu Android 10/API 29+ với System WebView cập nhật, **compile/target API 36**; Android 10 minimum là quyết định sản phẩm cần QA, không yêu cầu của Google Play. Theo yêu cầu Play đối chiếu ngày này, app mới/update cần API 36 từ 31/08/2026.

Tài liệu môi trường v8 yêu cầu Node 22+, Android Studio 2025.2.1+ và Android SDK; IDE cung cấp JDK phù hợp. Phiên làm việc này chưa có bộ môi trường Android đầy đủ, nên không gọi web build là Android build.

### Dung lượng app Android

Web asset hiện ~39.20 MB, chưa có lý do dùng Play Asset Delivery cho pack này. AAB/APK thêm bridge, resource, manifest và signing; size thực phải đo bằng `bundletool get-size total`/Play Console, không suy AAB bằng đúng dist bytes. Mục tiêu sản phẩm ban đầu download **≤60 MB**, cài đặt/RAM đo riêng.

Nguồn chính thức hiện ghi base module AAB tối đa 500 MB compressed; một trang tối ưu cũ còn ghi 200 MB, nên dùng trang Play size limits/FAQ hiện hành. Dù limit lớn, game nhỏ không nên dùng hết. Budget web 45/55 MB và Android download 60 MB là các gate riêng, không lẫn store limit.

### Giữ tiến trình từ web sang app

Web và native là hai origin/kho dữ liệu khác nhau: không tự đọc localStorage trình duyệt từ WebView. Người chơi xuất MGC1/ZIP trên web → chọn nhập trong app → validate trước ghi → xác nhận nội dung thay thế → giữ snapshot trước. Collection, deck, story ending/choices, active run/ý chí/RNG, receipt, lịch sử và ảnh được so sánh round-trip; không chỉ kiểm tra tổng xu.

Web adapter giữ behavior hiện có; native Preferences chỉ cho cấu hình nhỏ. Save/ảnh lớn dùng Filesystem hoặc SQLite sau khi chọn plugin và đo tải ghi; Preferences không phải database. Plugin Preferences cảnh báo OS có thể thu hồi localStorage. Adapter là async, cần hydrate xong trước khi game cho hành động; không trả default rồi autosave đè lúc chờ native read. Checkpoint hợp lệ của trận là nguồn resume, không khôi phục các particle/timer đã phát.

App vào nền/khóa/cuộc gọi: pause simulation, suspend audio, flush thay đổi đã commit; không cộng thời gian nền vào Survival hoặc phát bù hit. Quay lại giữ mute/style, chặn lặp result/reward. Test OS kill và update đè APK cùng applicationId/key, không chỉ reload trang.

### Native tối thiểu cần làm tốt

Safe area/System Bars và Android 16 edge-to-edge; predictive back đóng modal trước rồi điều hướng, xác nhận chỉ khi thật sự bỏ trận. Test dọc/ngang/tablet/resize, không coi khóa ngang là giải pháp chung. Drag/touch không bị native scroll chiếm. Một plugin App/lifecycle, Share/Filesystem và Browser dùng đúng phạm vi; Haptics là tùy chọn sau khi có volume/motion controls.

Tìm quán chỉ xin foreground location sau thao tác và thông báo; không background location. Ưu tiên Photo Picker/file selection, không quyền đọc toàn bộ ảnh. Link ngoài mở browser/intent, không cho site ngoài thay game trong WebView. Self-host font có OFL cho app offline. Airplane mode vẫn mở được trận/truyện/Rương; tìm quán báo không mạng, không chặn gameplay. Chính sách phải cập nhật native backup, plugin và permissions thực tế.

### Lộ trình Android riêng

| Mốc | Ước lượng | Kết quả review được |
| --- | --- | --- |
| Spike | 2–3 ngày công | Wrapper dev, APK debug, 1 trận/route thật, thử audio/lifecycle/rotation |
| Beta | Thêm 8–15 ngày công | Storage/backup, offline/fonts, native UI/permissions, máy thật và regression |
| Play | Hồ sơ + testing/review theo tài khoản | Signed AAB, privacy/support URL, Data Safety, content/age rating và rollout do chủ dự án quyết định |

Tổng kỹ thuật Android beta khoảng **10–18 ngày công**, ngoài kế hoạch web 4.0; sửa lỗi WebView lớn có thể kéo dài. Play personal account tạo sau 13/11/2023 có yêu cầu closed test ít nhất 12 tester opt-in liên tục 14 ngày trước khi xin production access; không giả định tài khoản của chủ dự án thuộc nhóm nào hoặc đã đạt. Lịch store không được bảo đảm.

Trước store cần chốt tên pháp lý/email hỗ trợ, applicationId lâu dài, quyền asset/thương hiệu, thị trường/độ tuổi và mô hình phát hành. Không tự tạo ID dưới danh tính tạm, upload key, tài khoản hoặc gửi app review trong PR nghiên cứu này. Việc được phép push/PR không phải lệnh phát hành store.

## Nguồn chính thức đã đối chiếu

- [Capacitor stable v8 Android](https://capacitorjs.com/docs/android), [môi trường](https://capacitorjs.com/docs/getting-started/environment-setup), [migration 8](https://capacitorjs.com/docs/updating/8-0), [Preferences](https://capacitorjs.com/docs/apis/preferences).
- [Play target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en), [size limits](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en-en), [AAB FAQ](https://developer.android.com/guide/app-bundle/faq), [personal account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB).
- [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16), [MDN AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer).
- [Vercel limits](https://vercel.com/docs/limits), [Terms Hobby](https://vercel.com/legal/terms), [Fair Use](https://vercel.com/docs/limits/fair-use-guidelines).

Đây là nguồn về yêu cầu/công nghệ. Quyết định budget, ước lượng công và hướng Capacitor cho Soul of Meal là đánh giá từ source của dự án.
