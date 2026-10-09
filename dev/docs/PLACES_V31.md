# Soul of Meal 3.1 — tìm quán không cần API key

## Trải nghiệm

Từ món vừa mở rương, Bộ sưu tập hoặc Thành tựu, chọn Tìm quán. Người chơi có thể bấm dùng vị trí, nhập phường/quận + thành phố và chọn một trong các khu vực trả về, hoặc chọn trung tâm Hà Nội/TP.HCM/Đà Nẵng. Preset là tâm thành phố, không giả làm GPS của người chơi.

Kết quả gồm tên, địa chỉ khi có, khoảng cách đường chim bay và mức liên quan. Tên quán khớp từ khóa, thông tin cuisine/description liên quan và quán lân cận chưa xác nhận món được phân biệt. Match dùng chuẩn hóa dấu/đ, ranh giới từ và alias catalog; tag chung Vietnamese/Asian không được dùng để khẳng định quán có bán món. Không bịa sao, review, giá hoặc trạng thái đang mở. Giờ mở cửa chỉ hiển thị nguyên văn khi OSM có ghi; cần xác nhận thực đơn/giờ trước khi đến.

Sau khi chọn khu vực, form vị trí thu gọn; nút Đổi khu vực mở lại để dành thêm chỗ cho danh sách. Bán kính 1/3/5 km, lọc tên/địa chỉ, sắp theo liên quan/gần nhất; toàn bộ dữ liệu được lọc trước phân trang hiển thị 40 quán mỗi lần. Không cắt top-N trước lọc bán kính. Xem bản đồ OSM trong dialog, chỉ đường Google Maps dùng tọa độ kể cả địa chỉ thiếu, đi bộ/đi xe, gọi điện/website khi có, sao chép địa chỉ/ghim. Nút tìm Google Maps luôn ở footer, cả khi GPS bị từ chối, dữ liệu rỗng, chậm hoặc lỗi.

Dialog native giữ focus bàn phím, Escape/backdrop đóng, body không scroll; danh sách cuộn nội bộ. Hủy tìm/đổi khu vực/đóng modal hủy request và bỏ kết quả cũ; callback GPS cũ không ghi state. Không tự xin vị trí hay tìm theo từng phím gõ.

## Nguồn dữ liệu

- Geocode/tìm tên: [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md), public server `photon.komoot.io`; tìm khu vực giới hạn countrycode=VN và 5 lựa chọn. Đã bỏ `lang=vi` vì server public hiện trả HTTP 400 với tham số này; khi bỏ tham số, live request trả khu vực Cầu Giấy/Hà Nội và CORS `*`.
- Nearby venue: [Private.coffee Overpass](https://overpass.private.coffee/api/interpreter), instance public nêu tại [OSM Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API). Một truy vấn nwr cho 5 loại amenity trong khoảng 5 km, tối đa 700 element, timeout server 15s, maxsize 8 MB. Request live với Origin của app trả 200, CORS `*`, quán có tọa độ thật. Lỗi/remark từ Overpass không được coi là kết quả rỗng hợp lệ.
- Khi dưới 3 match có thêm tối đa một Photon text query giới hạn bbox/30 kết quả; lọc loại quán, khoảng cách và tọa độ sau khi nhận. Hợp nhất node/way/relation theo ID và tên+tọa độ gần nhau. Một nguồn lỗi vẫn giữ dữ liệu nguồn còn lại và báo chưa đầy đủ; cả hai lỗi báo lỗi, không tuyên bố khu vực không có quán.
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) chỉ mở trang bản đồ ngoài và chỉ đường, không gọi Places API, không cần API key. Không scrape Google hoặc lấy dữ liệu đánh giá vào app.

## Độ bền và quyền riêng tư

Cache bộ quán theo khu vực 10 phút, tái dùng giữa món/bán kính; cache Photon theo từ khóa+khu vực và geocode. Mỗi cache tối đa 24 entry, chỉ trong RAM; GPS không ghi localStorage hoặc save code. Đổi món tính lại match và khoảng cách từ metadata gốc. Request có AbortController/timeout; HTTP 429/406 khóa host ít nhất 30s hoặc theo Retry-After. Không retry vòng lặp hoặc xoay endpoint để vượt giới hạn. GPS chỉ khi bấm nút, có timeout 10s.

Các public service có thể chậm, thiếu dữ liệu hoặc giới hạn lượt; ứng dụng không cam kết danh sách đầy đủ/availability vô hạn. Nếu lưu lượng tăng mạnh cần vận hành endpoint riêng hoặc thỏa thuận với nhà cung cấp, vẫn có thể không dùng API key với instance tự host. Maps URL là đường tiếp tục tìm kiếm không phụ thuộc hai nguồn này.

## Branding và tiến trình

Tên Soul of Meal và logo mới dùng cả ba mode, browser metadata/icon/manifest và postcard/chia sẻ. Các namespace `foodchest.*`, `mealgacha.*`, IndexedDB ảnh và mã MGC1 giữ nguyên để tương thích tiến trình cũ. Tên repository và deployment không đổi. Logo và prompt: [branding/LOGO.md](branding/LOGO.md).
