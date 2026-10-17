# Kiểm chứng Web 5.9.11

Luồng kiểm tra: thao tác trong trận → reducer/engine thật → trạng thái/save đã validate → resolver asset → pose/portrait/VFX trên UI → pause/skip/reload/cleanup. Fixture chỉ nằm trong script QA, không được build vào sản phẩm.

## Tự động và asset

- **707/707 Vitest, 67 file**, cùng **4/4 Node guard** đạt; TypeScript app/dev, catalog, assets, release records và đối chiếu records đều đạt.
- Test manifest kiểm tra đủ 31 ID, resolver dùng chung, file tồn tại, các mốc contact, reduced motion và geometry khác nhau. Thêm bốn ca reload/double-skip thật và kiểm tra VFX/contact cho cohort mới.
- Test cũ phân biệt hai caravan bằng `row` được cập nhật thành `sheet:row`: sau khi tách atlas, cả hai đúng là row 0 ở hai file khác nhau. Vẫn kiểm tra không trùng model, không thay dữ liệu gameplay.
- **128 frame khác nhau**, 12 file runtime khớp hash/byte provenance; HD/pixel/portrait đúng kích thước, alpha/gutter/pivot đạt. Tám PNG nguồn trong suốt không có pixel alpha >32 ở mép ngoài. Đã xem contact sheet toàn bộ pose và đối chiếu bốn nhận diện.
- Asset register **630 file**, runtime dependency graph **32 package**, không thêm dependency. Giữ 13 bằng chứng quyền asset cũ pending; `release:rights` là inventory, không phải commercial clearance.

## Browser

Mỗi Chromium 151.0.7922.34 và WebKit 26.5 Linux headless chạy **33/33 ca Adventure** tại 320×568, 390×844, 844×390, 1440×900:

- Attack/primary/support thật từ reducer ở bốn viewport, canvas VFX có pixel, pause giữ ổn định pose.
- Bốn tuyệt kỹ × bốn viewport: contact pose 18, portrait đúng ID, banner không tràn/che quá nửa arena, pause/skip và callback lặp không tính lại giao dịch.
- Thắng/gục, reload tuyệt kỹ đã commit, hoàn tất tự nhiên và reduced motion pose 16 cho cả bốn ID.

Script `dev/tools/verify-spirits5910.mjs` dùng `QA_COHORT=5911`; giữ cohort 5910 làm mặc định để bằng chứng cũ chạy lại được. Dùng đồng hồ browser có kiểm soát, fixture battle ID riêng; chờ React mount sau reload. Không sửa timeout/engine để qua kiểm tra.

Mỗi engine chạy thêm **3/3 ca Auto/TCG**: Auto ở 390×844 và 1280×800 có cast thật của Xôi xéo/Dưa hành cùng ba unit có sẵn; TCG tải cả bốn HD, bấm Xôi xéo đánh Người hái thuốc, xác nhận HP 100→98 và ready tiêu thụ, sau đó thi triển phép thật qua banner/sigil chung. Hai caravan không có trong catalog Auto nên không được đưa vào fixture Auto.

Không JS error, request lỗi hoặc MP4. Cả **12/12 đường dẫn asset mới** được tải qua các mode. Xem `chromium-qa.json`, `webkit-qa.json`, `modes-chromium/modes-qa.json`, `modes-webkit/modes-qa.json` và ảnh evidence. Bằng chứng focus cũ được giữ để đối chiếu lịch sử; lượt regression mới và ảnh banner ở dưới là bằng chứng sau chỉnh sửa banner/Bách, không cộng trùng các ca focus vào số 33. WebKit Linux không phải Safari/iPhone vật lý; GPU Chromium dùng SwiftShader. Không chứng nhận FPS hay hai thiết bị thật.

## Regression banner và minh hoạ Bách

Mỗi Chromium và WebKit chạy thêm **24/24 ca preview thật**: sáu ID đủ năm hệ (Cơm tấm, Bánh mì, Gỏi cuốn tôm thịt, Takoyaki, Bingsu và Bách) × bốn viewport nêu trên. Script `verify-banner5911.mjs` đi từ nút Xem tuyệt kỹ 2D trên hồ sơ, không dựng component giả.

- Layer phong cảnh phủ kín phần trong border, dùng `cover`; tải và giải mã được cả năm cảnh. Mặt phẳng chân dung vuông, ảnh atlas Takoyaki đúng ô 4×4, không ép ảnh vào khung chữ nhật.
- Chỉ một banner; phần chữ và nút không chồng nhau, nút nằm trong viewport; Bỏ qua đóng preview. Wrapper `div` tránh CSS của roster `aside` làm nút xuống hàng.
- Bách dùng `/assets/tcg/characters/anime/bach.webp` ở SpiritArt/banner; unit test đối chiếu cùng đường dẫn với CARD_MAP, CHARACTER_ART và chefPortrait mặc định. Các biểu cảm khác giữ đường dẫn riêng.
- Đã xem ảnh preview Takoyaki/Bách ở 390 và 844 px; chỉnh neo chân dung lên trên sau khi ảnh ngang cho thấy mặt Bách bị cắt. JSON `chromium-banner-qa.json` và `webkit-banner-qa.json` ghi kích thước thực; ảnh trong `evidence/*preview*` phục vụ review.
- Năm ảnh realm mới và một ảnh Bách thay thế tổng **527.114 byte**, tăng media ròng **461.904 byte** so với nhánh trước sửa banner. `showcase-assets.json` và asset register ghi hash đầu ra và nguồn. Không tính những cảnh cắt từ atlas đã có thành tranh mới vẽ.

## Production và tải ban đầu

Build ở thư mục đầu ra mới: **110.816.870 byte / 688 file**, JS gzip **670.944/675.000 byte**, CSS gzip 103.361 byte. Guard không phát hiện source, map, archive, credential; cú pháp service worker đạt. Static cap 320 MB, target 300 MB và cache decoded image 64 MiB giữ nguyên.

| Route | Body byte lần đầu, gồm SW | Reload offline |
|---|---:|---|
| / | 3.185.762 | Đạt |
| /adventure | 4.361.203 | Đạt |
| /autochess | 3.553.755 | Đạt |

Mỗi route dùng context Chromium mới, không HTTP compression; số đo gồm SW precache/warm, không phải thời gian mạng hay tổng dist. Dưới target 8 MB/cap 12 MB. Không tải MP4 trước trận. `metrics.json` và `initial-load.json` lưu số đo.

## Giới hạn và phân công

Dependency Node dùng lại bản đã cài có cùng lockfile; không thay lockfile/dependency project. Trình duyệt QA được tải riêng; WebKit cần thư viện hệ thống trong thư mục QA. Chrome đầy đủ không mở được socket singleton trong môi trường này, nên dùng Chrome Headless Shell cùng phiên bản 151.0.7922.34. Một lượt đo build gặp file chunk từ build cũ; đã build lại với `--emptyOutDir` và kiểm tra ngân sách trên đầu ra sạch, không tăng giới hạn.

Thiết bị thật, review và merge do chủ dự án thực hiện. Networking không đổi; PvP khác mạng/NAT/TURN vẫn chờ nghiệm thu thực tế. Đợt này chỉ hoàn tất bốn ID, còn 108 nhân vật, 24 enemy đang dùng và animation nâng cao trong roadmap.
