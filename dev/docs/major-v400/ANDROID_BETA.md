# Android 4.0 beta — review và thử thiết bị

Nhánh `feat/android-v4-beta` phụ thuộc `feat/v4-complete-release` (PR26). Bản này là APK debug cài thử, chưa phải bản Play. ApplicationId `io.github.minhutc359.soulofmeal`, versionCode40001/versionName4.0.0-beta.1, min29/compile36/target36, JDK21/Gradle8.14.3. Không có remote server URL: `dist` nằm trong APK.

## Đã hoàn thiện trong code

- Capacitor core/android/cli8.5.3 và App8.1.2/Browser8.0.5/Filesystem8.1.4/Share8.0.3/Geolocation8.2.3 được pin. Icon/splash dùng brand hiện có, không icon Capacitor mặc định.
- Đọc tệp native trước khi import store. `DurableProgress` dùng private AtomicFile, trả thành công sau commit; lỗi đọc/ghi chặn thay đổi, giữ byte gốc và có xuất phục hồi. Journal/checkpoint/receipt từ web tiếp tục dùng cùng adapter. Không chỉ dựa vào WebView localStorage.
- Ảnh và thumbnail dùng tệp có version trong private Data; ghi cả hai và commit metadata mới trước xóa cặp cũ. Lỗi thumbnail hoặc metadata không làm mất ảnh cũ. ZIP giữ ảnh, MGC1/JSON chuyển tiến trình không kèm ảnh.
- Vào nền flush checkpoint Auto rồi pause, suspend âm thanh và ngừng presentation TCG. Resume không tự cộng thời gian nền/chạy tiếp Auto. Back đóng dialog trước, điều hướng hoặc xác nhận thoát. Liên kết ngoài dùng Browser; iframe/object bị chặn trong native WebView.
- Export JSON/ZIP/postcard/result dùng tệp cache + bảng Share hệ thống, FileProvider chỉ cấp quyền đường dẫn exports. Không xin quyền đọc toàn bộ thư viện ảnh. Tìm quán chỉ xin foreground location sau thao tác; từ chối quyền vẫn chơi được. Location hardware là tùy chọn.
- Font, ảnh/clip/cue/stems được đóng gói offline. Capacitor8 SystemBars truyền safe-area qua CSS; app đọc biến native hoặc env(), có viewport-fit=cover, padding dọc/ngang và dock/dialog. Không dùng layout khóa ngang để tránh QA.
- OS cloud backup/device transfer bị tắt/exclude theo manifest và extraction rules. Gỡ app/xóa dữ liệu không giữ tiến trình; cần xuất trước. Policy mô tả native storage, cache export và SDK vị trí thực tế.
- Workflow `.github/workflows/android-beta.yml` build/test/lint APK trên PR hoặc manual, artifact14ngày. Không có upload key/secret Play trong repo.

## Bằng chứng tự động

- App/dev TypeScript,351 tests/32files (345 web +6 adapter native): đạt.
- Java/Robolectric SDK36:4 kiểm thử cho commit/restart, JSON hỏng + raw recovery, write quá lớn, interrupted `.new`/`.bak` recovery.
- `lintDebug`:0 lỗi; warning chủ yếu resource/default dependency/icon, không che lỗi bằng baseline lint.
- Production Chromium + native bridge giả lập:4 checks cho hydrate/restart, frame policy, link ngoài, native background checkpoint/pause và corrupt bootstrap/raw export. `native-browser-results.json`. Không gọi mock bridge là Android WebView.
- `assembleDebug`, apksigner verify và aapt badging; mọi file dist được so byte với assets/public trong APK. Dung lượng và SHA256 bản cài trong `apk-evidence.json`; tổng static/JS ở `../release/build-size.json` giữ gate45MB/650kB, APK<60MB.
- Runtime SDK inventory/license metadata được ghi riêng trong `native-runtime-dependencies.json` và thông báo kèm app; npm inventory32 dependencies theo `rights/DEPENDENCIES.json`. Không suy Data Safety chỉ từ không có analytics.

## Cài và chuyển dữ liệu

1. Xuất MGC1 hoặc ZIP đầy đủ trên web. Giữ bản trước khi nhập.
2. Cài APK beta trên Android10+. Web và native là hai kho riêng; nhập bằng giao diện trong app, xem trước và xác nhận theo luồng hiện có.
3. Sau nhập so deck/cards/ending/choices, run đang chơi, receipt và ảnh. Chơi một lượt, vào nền/đóng/mở lại; xuất ngược và nhập thử trên web.

APK này dùng Android debug key. Cập nhật giữ dữ liệu cần cùng applicationId và cùng chữ ký; CI debug key trên runner khác có thể khác. Không gỡ app để đổi chữ ký trước khi xuất backup. Release Play cần upload key do chủ dự án quản lý, không tái dùng debug key.

## Gate còn phải làm trên thiết bị/người thật

Máy Android RAM4GB và Android16: airplane-mode TCG/Auto/Rương, kéo/chạm/rotate/IME/cutout/predictive-back, loa/Bluetooth/cuộc gọi, OS kill/update cùng key, ZIP ảnh qua Documents/Drive, permission deny và profile15phút. Web Safari/iPhone và5–8 người chơi vẫn còn chờ. Máy/KVM không có trong phiên này; không tự ghi đã đạt FPS/RAM/pin hoặc tester.

Bảng nghiệm thu web trong IMPLEMENTATION.md vẫn giữ Q01/H03 chờ QA/phát hành. Các deck mới có win rate lệch trong heuristic sampling; cần playtest và tuning, chưa có chứng nhận cân bằng. Chủ thể pháp lý/email riêng, applicationId dài hạn, quyền phát hành/SDK terms, upload key, Play Console/Data Safety/age rating và closed testing khi áp dụng cần chủ dự án chốt trước store. Không merge/deploy production hoặc gửi review store trong tác vụ này.
