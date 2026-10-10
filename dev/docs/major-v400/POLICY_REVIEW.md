# Chính sách 3.5 và việc cần chốt trước phát hành

Rà soát ngày 10/10/2026. Chính sách runtime đã được bổ sung trong PR này; gameplay 4.0/Android chưa được phát hành. Bộ văn bản hoàn thiện phạm vi chức năng hiện có, **không phải xác nhận mọi nghĩa vụ pháp lý/phát hành đã hoàn tất**.

## Đã sửa trong ứng dụng

Nguồn duy nhất là `src/legal/policies.ts`. `/legal/terms`, `/legal/privacy`, `/legal/rights` dùng cùng văn bản với HTML độc lập `.html` sinh bằng `release:records`. Header dùng mã chính sách `2026-10-10` và ngày cập nhật, bỏ nhãn ứng dụng 3.3 đã lỗi thời. Phiên bản game vẫn 3.5.0.

| Văn bản | Nội dung đã bổ sung |
| --- | --- |
| Điều khoản, 10 mục | Phạm vi/free/no-account; nhận diện dự án/kênh hỗ trợ; người chưa thành niên; tài nguyên ảo/ngẫu nhiên/không đổi tiền; sao lưu/nhập; nội dung người dùng; quán/ẩm thực; sử dụng hợp pháp; dừng/thay đổi; khiếu nại và quyền bắt buộc |
| Quyền riêng tư, 10 mục | Dữ liệu/local storage/ảnh/clipboard/export; vị trí chính xác và query; OSM iframe/Google Maps/Fonts/Vercel/GitHub/URL tự cấu hình; retention thực; xóa từng loại/toàn bộ; mục đích/lựa chọn; quyền dữ liệu; trẻ em/bảo mật; thay đổi |
| Quyền/ghi công, 5 mục | Phạm vi quyền nội dung/AI; third-party và GSAP; phông chữ OFL; OSM/ODbL; chuyển nhượng và nhận báo cáo quyền |

Sửa điểm sai cụ thể: nút xóa dữ liệu chung hiện gọi `repository.clearAll()` gồm cả GAME_KEY, không chỉ xóa Rương; policy đã nói xóa cả ba chế độ. Google Places thay thế không có trong source hiện tại, bỏ mô tả giả định provider được bật. Google Maps search có thể nhận tọa độ tâm, OSM iframe nhận tọa độ quán; nêu cả hai. Cache 10 phút là TTL sử dụng, không hứa xóa RAM đúng 10 phút. MGC1 chứa khóa, không gọi là mã bảo mật cá nhân. Không cam kết log của provider được xóa sau một số ngày chưa biết.

Không thêm cookie banner, popup tuổi, tracking, analytics, remote policy request hoặc SDK mới vào game. Không sửa reset/import/storage để cập nhật văn bản. Dữ liệu người chơi không bị migrate/xóa khi đọc chính sách.

Production browser QA đã đạt: 3 trang HTML không JavaScript và 3 route React ở 320×568, 390×844, 844×390, 1366×768 không tràn ngang. Hai save tổng hợp với ending `remember`/`release`, 18 màn đã qua và Survival còn 1 ý chí giữ nguyên toàn bộ chuỗi JSON qua mọi lần điều hướng chính sách; không chỉ so sánh xu. Không dùng dữ liệu thật của người chơi. Không có lỗi JavaScript hoặc HTTP cục bộ ≥400 trong luồng đã kiểm tra. Vite preview có hành vi extensionless HTML khác Vercel, nên harness mô phỏng đúng rewrite document của `vercel.json` cho route React; chưa kiểm tra URL deploy live/Safari/thiết bị Android. Xem [kết quả browser](browser-policy-results.json) và [ảnh điện thoại](privacy-phone.jpg).

## Bản đồ dữ liệu đã đọc từ source

| Hoạt động | Dữ liệu | Nơi xử lý/nhận | Trigger / xóa |
| --- | --- | --- | --- |
| Chơi/Taste/Timeline | Save, displayName, sở thích, ghi chú, history | localStorage ở origin trang | Game/hồ sơ; sửa, xuất, xóa dữ liệu trang |
| Chọn ảnh | WebP/thumb, ID, size, createdAt | IndexedDB `mealgacha-images` | File picker; xóa ảnh hoặc toàn bộ dữ liệu |
| Export/import | JSON/MGC1/ZIP; ZIP có ảnh | File/clipboard/người nhận do user chọn | Thao tác user; xóa ngoài app riêng |
| Lấy vị trí | Tọa độ, trạng thái permission | API trình duyệt, RAM phiên | Nút lấy vị trí, không watch/background |
| Tìm khu vực/quán | Area/dish query, lat/lng/radius, IP/metadata | Photon/Overpass, RAM cache | Submit/nút tìm; provider log không do app xóa |
| Bản đồ nhỏ | Bbox, marker quán, request | OSM iframe/tile infrastructure | Expand quán; không phải chỉ link rời trang |
| Maps/website/tel | Query/area/center hoặc destination | Google/browser/quán/OS | Nút mở ngoài app |
| Tải trang/font | IP, URL, timing/agent theo hạ tầng | Vercel, Google Fonts | Trang và CSS load; retention provider |
| Remote catalog/banner | URL/nội dung người dùng cấu hình | Host tương ứng, cache cục bộ | Chọn URL/khởi tạo khi đã cấu hình |
| Hỗ trợ | Nội dung tự gửi, GitHub account theo nền tảng | GitHub issue công khai | User gửi; không tự upload save |

Đường source: `storage.ts`, `repository.ts`, `imageRepository.ts`, `fullBackup.ts`, `saveCode.ts`, `PlacesModal.tsx`, `placesGateway.ts`, `csvAdapter.ts`, `src/index.css`, `SettingsPage.tsx`, `useAppStore.ts`. Mỗi thay đổi plugin/backend/host sau này phải audit lại, không sao chép Data Safety label của web sang Android.

## Thông tin còn thiếu, không được tự điền

| Việc chủ dự án cần xác nhận | Vì sao cần | Trạng thái |
| --- | --- | --- |
| Tên pháp lý/chủ thể vận hành, địa chỉ theo yêu cầu thị trường/store | Người dùng/cơ quan biết bên chịu trách nhiệm; GitHub login/email tác giả commit không chứng minh danh tính pháp lý | Chưa có bằng chứng trong repo; chưa điền tên suy đoán |
| Email/kênh riêng cho privacy, bảo mật, IP và khiếu nại | Không buộc user công khai save/ảnh/giấy tờ để thực hiện quyền | Hiện chỉ có GitHub Issues; đã nêu giới hạn rõ trong policy |
| Thị trường, nhóm tuổi và mô hình phân phối | Quyết định nghĩa vụ game, consumer, dữ liệu và nội dung | Chưa xác nhận; không tự phân loại “mọi tuổi” hoặc có giấy phép |
| Quyền đầy đủ đối với asset/brand | Registry/provenance không thay hợp đồng hoặc quyền đầu vào còn thiếu | Giữ gate trong `rights/COMMERCIAL_RELEASE.md` |
| Bên ngoài và retention/cross-border | Cần thông tin vận hành/thỏa thuận thực, không chỉ SDK list | Chưa xác nhận retention của các public map instances/host |

Các mục này là thông tin/điều kiện phát hành thực còn thiếu, không phải lý do dừng công việc nghiên cứu hoặc PR. Không phát hành store/thương mại với tuyên bố đã hoàn tất chỉ vì policy có đủ mục. Không tự ghi một số giấy phép, tên công ty, địa chỉ hay email cá nhân lấy từ commit.

## Đối chiếu Google Play cho Android tương lai

Play yêu cầu privacy policy công khai, truy cập toàn cầu, không PDF, trong app và listing; có nhận diện app/developer, contact, loại dữ liệu/bên nhận, bảo mật, retention/deletion. `/legal/privacy.html` là dạng đúng về kỹ thuật; phải kiểm tra URL live của bản đã công bố và nội dung đúng SDK native trước submission. PR này chưa xác minh store listing hoặc gửi review.

Data Safety cần đọc đúng định nghĩa: xử lý chỉ trên thiết bị khác với gửi ra ngoài; vị trí gửi tới dịch vụ quán không thành “không thu thập” chỉ vì không lưu save. Không đánh dấu ephemeral khi chưa biết provider có log gì. Trang Google có cả định nghĩa và FAQ cần đối chiếu lúc điền; xác minh native network/plugin/backup thay vì chọn label từ giả định. Chưa điền hoặc gửi Data Safety trong phiên này.

Account deletion của Play áp dụng khi app có tạo tài khoản. Bản hiện tại không có account: hướng dẫn xóa local data đúng hơn bịa một backend delete endpoint. Nếu thêm account/cloud save, cần xóa cả trong app và qua web resource theo yêu cầu tương ứng; cập nhật policy trước.

## Việt Nam và giới hạn kết luận

[Luật 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160) về bảo vệ dữ liệu cá nhân có hiệu lực 01/01/2026; không dùng Nghị định 13 như bằng chứng duy nhất cho release 2026. Định vị và ảnh cần xem trong cách xử lý thực tế, nhất là truyền vị trí ra provider và phân phối cho trẻ em. Văn bản ở đây mô tả chức năng/quyền; căn cứ, hồ sơ đánh giá/tổ chức xử lý và thông tin chủ thể cần được xem xét theo hoạt động thực khi phát hành.

[Nghị định 147/2024/NĐ-CP](https://vanban.chinhphu.vn/?classid=0&docid=211654&pageid=27160) và [trả lời chính thức về điều kiện game trên mạng](https://chinhsachonline.chinhphu.vn/dieu-kien-cung-cap-dich-vu-tro-choi-dien-tu-tren-mang-91976.htm) cần được đối chiếu để xác định loại hình/quy trình phát hành tại Việt Nam. Không suy rằng miễn phí, local save, không PvP hoặc bản APK offline tự động miễn mọi nghĩa vụ của bản web. PR nghiên cứu không xác định game thuộc G1/G2/G3/G4 và không chứng nhận có phép phát hành. Cần xác định mô hình với người phụ trách pháp lý/cơ quan phù hợp trước phân phối chính thức nếu nghĩa vụ đó áp dụng.

Điều khoản không miễn trách nhiệm bắt buộc, không ép trọng tài, không tước quyền khiếu nại. Không đưa giới hạn trách nhiệm bằng 0 hoặc dùng “tiếp tục chơi” thay consent cho tracking mới. Khi biết đúng chủ thể/thị trường, hoàn thiện văn bản theo thực tế đó thay vì đặt một luật/địa chỉ tòa án tùy ý.

## Nguồn chính thức

- [Play User Data/Privacy/Account deletion](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).
- [Play Data Safety definitions](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
- Luật 91/Nghị định 147 và trả lời chính thức liên kết ở trên.
- Hồ sơ quyền của dự án: [COMMERCIAL_RELEASE](../../../rights/COMMERCIAL_RELEASE.md), `LICENSE`, `THIRD_PARTY_NOTICES.md`, `rights/ASSET_REGISTER.json`, `rights/DEPENDENCIES.json`.

Rà soát này dùng để lập việc cần làm và viết chính sách đúng sản phẩm, không tạo ra quyền asset hoặc tư cách pháp lý còn thiếu. Mọi phát hành có thay đổi dữ liệu/SDK/thanh toán cần một lần rà soát tương ứng.
