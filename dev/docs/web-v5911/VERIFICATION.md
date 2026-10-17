# Kiểm chứng Web 5.9.11

Luồng kiểm tra: thao tác trong trận → reducer/engine thật → trạng thái/save đã validate → resolver asset → pose/portrait/VFX trên UI → pause/skip/reload/cleanup. Fixture chỉ nằm trong script QA, không được build vào sản phẩm.

## Tự động và asset

- **706/706 Vitest, 67 file**, cùng **4/4 Node guard** đạt; TypeScript app/dev, catalog, assets, release records và đối chiếu records đều đạt.
- Test manifest kiểm tra đủ 31 ID, resolver dùng chung, file tồn tại, các mốc contact, reduced motion và geometry khác nhau. Thêm bốn ca reload/double-skip thật và kiểm tra VFX/contact cho cohort mới.
- Test cũ phân biệt hai caravan bằng `row` được cập nhật thành `sheet:row`: sau khi tách atlas, cả hai đúng là row 0 ở hai file khác nhau. Vẫn kiểm tra không trùng model, không thay dữ liệu gameplay.
- **128 frame khác nhau**, 12 file runtime khớp hash/byte provenance; HD/pixel/portrait đúng kích thước, alpha/gutter/pivot đạt. Tám PNG nguồn trong suốt không có pixel alpha >32 ở mép ngoài. Đã xem contact sheet toàn bộ pose và đối chiếu bốn nhận diện.
- Asset register **625 file**, runtime dependency graph **32 package**, không thêm dependency. Giữ 13 bằng chứng quyền asset cũ pending; `release:rights` là inventory, không phải commercial clearance.

## Browser

Mỗi Chromium 153.0.8010.0 và WebKit 26.5 Linux headless chạy **33/33 ca Adventure** tại 320×568, 390×844, 844×390, 1440×900:

- Attack/primary/support thật từ reducer ở bốn viewport, canvas VFX có pixel, pause giữ ổn định pose.
- Bốn tuyệt kỹ × bốn viewport: contact pose 18, portrait đúng ID, banner không tràn/che quá nửa arena, pause/skip và callback lặp không tính lại giao dịch.
- Thắng/gục, reload tuyệt kỹ đã commit, hoàn tất tự nhiên và reduced motion pose 16 cho cả bốn ID.

Script `dev/tools/verify-spirits5910.mjs` dùng `QA_COHORT=5911`; giữ cohort 5910 làm mặc định để bằng chứng cũ chạy lại được. Dùng đồng hồ browser có kiểm soát, fixture battle ID riêng; chờ React mount sau reload. Không sửa timeout/engine để qua kiểm tra.

Mỗi engine chạy thêm **3/3 ca Auto/TCG**: Auto ở 390×844 và 1280×800 có cast thật của Xôi xéo/Dưa hành cùng ba unit có sẵn; TCG tải cả bốn HD, bấm Xôi xéo đánh Người hái thuốc, xác nhận HP 100→98 và ready tiêu thụ, sau đó thi triển phép thật qua banner/sigil chung. Hai caravan không có trong catalog Auto nên không được đưa vào fixture Auto.

Không JS error, request lỗi hoặc MP4. Cả **12/12 đường dẫn asset mới** được tải qua các mode. Xem `chromium-qa.json`, `webkit-qa.json`, `modes-chromium/modes-qa.json`, `modes-webkit/modes-qa.json` và ảnh evidence. Một ảnh minh chứng bị rỗng khi xuất file đã được chụp lại bằng 12 ca focus tại 390 px (`chromium-focus-qa.json`); sau đó giải mã lại thành công đủ 22 WebP runtime/evidence trước khi commit. Bộ 33 ca đầy đủ được giữ riêng, không cộng trùng các ca focus. WebKit Linux không phải Safari/iPhone vật lý; GPU Chromium dùng SwiftShader. Không chứng nhận FPS hay hai thiết bị thật.

## Production và tải ban đầu

Build ở thư mục đầu ra mới: **110.353.952 byte / 683 file**, JS gzip **670.795/675.000 byte**, CSS gzip 103.289 byte. Guard không phát hiện source, map, archive, credential; cú pháp service worker đạt. Static cap 320 MB, target 300 MB và cache decoded image 64 MiB giữ nguyên.

| Route | Body byte lần đầu, gồm SW | Reload offline |
|---|---:|---|
| / | 3.184.748 | Đạt |
| /adventure | 4.360.189 | Đạt |
| /autochess | 3.552.741 | Đạt |

Mỗi route dùng context Chromium mới, không HTTP compression; số đo gồm SW precache/warm, không phải thời gian mạng hay tổng dist. Dưới target 8 MB/cap 12 MB. Không tải MP4 trước trận. `metrics.json` và `initial-load.json` lưu số đo.

## Giới hạn và phân công

WebKit ban đầu chưa mở được page vì runtime host thiếu `libGLESv2.so.2`; bổ sung dependency vào thư mục QA rồi chạy lại, không đổi app/dependency project. Một test cũ so row được sửa như nêu trên; toàn suite sau đó đạt. Không tăng budget, timeout hoặc đổi gameplay.

Thiết bị thật, review và merge do chủ dự án thực hiện. Networking không đổi; PvP khác mạng/NAT/TURN vẫn chờ nghiệm thu thực tế. Đợt này chỉ hoàn tất bốn ID, còn 108 nhân vật, 24 enemy đang dùng và animation nâng cao trong roadmap.
