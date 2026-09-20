# MealGacha · Rương Vị Giác

Web app gợi ý món ăn sáng, trưa và tối qua trải nghiệm mở rương theo phong cách fantasy game client. Điểm danh nhận 10 chìa mỗi ngày, giải 3 câu Đoán món để nhận thêm 3 chìa và hoàn tất Taste Swipe nhận 2 chìa. Sưu tập 58 món thường cùng 54 món giới hạn trong 9 sự kiện, dung hợp 3 phần thưởng cùng ngày, ghi nhật ký ăn uống và mở danh hiệu. Thu thập đủ món thường để mở rương vô hạn.

## Chạy local

Yêu cầu Node.js 22 và pnpm 10.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Các lệnh kiểm tra:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm validate:catalog
```

## Cấu hình

- Tìm quán hoạt động không cần API key: xin quyền vị trí hoặc nhập khu vực; dùng Photon và OpenStreetMap/Overpass tìm quán gần đó, nhấn từng quán để mở bản đồ OpenStreetMap ngay bên dưới. Dữ liệu OSM không có sao/đánh giá nên ứng dụng ghi rõ điều này và nhắc kiểm tra thực đơn. Dữ liệu vị trí được gửi trực tiếp từ trình duyệt tới dịch vụ bản đồ để tìm kiếm, không lưu vị trí trong hồ sơ.
- `VITE_GOOGLE_MAPS_API_KEY` (tùy chọn): khóa cho Places API (New) để lọc quán theo sao/số lượt đánh giá và giờ mở cửa. Giới hạn khóa theo HTTP referrer và chỉ bật API cần thiết; khi API lỗi, ứng dụng quay về nguồn OpenStreetMap không cần khóa.
- `VITE_CATALOG_URL`: URL CSV của Google Sheet đã **Publish to web**. Người dùng cũng có thể cấu hình và xem trước nguồn trong trang Cài đặt.
- `VITE_CHEST_OPENING_AUDIO_URL`: URL ghi đè cho âm thanh mở rương. Mặc định app dùng file `public/assets/audio/chest-opening.mp3` dài 4,284 giây và đồng bộ timeline 4,14 giây.
- `VITE_DAILY_KEYS`, `VITE_CHEST_COST`: tham số kinh tế mặc định là 10 chìa/ngày và 1 chìa/lượt.
- `VITE_APP_TIME_ZONE`: múi giờ nghiệp vụ, mặc định `Asia/Ho_Chi_Minh`.

Hồ sơ, chìa, lịch sử và bài viết nằm trong `localStorage`; ảnh check-in nằm trong IndexedDB. Trang Cài đặt có xuất/nhập JSON (không chứa ảnh) và ZIP đầy đủ (có ảnh). Dữ liệu và tọa độ không được tải lên máy chủ của ứng dụng; kết quả Google Places phụ thuộc API key và quyền vị trí.

## Luồng sử dụng

- **Rương:** Chọn sáng, trưa hoặc tối; nhấn mở để chạy nghi thức chìa khóa, âm thanh và hiệu ứng. Món chỉ hiện khi nghi thức kết thúc (có nút bỏ qua và hỗ trợ giảm chuyển động). Ba banner thường chỉ có món dùng quanh năm; mỗi rương sự kiện chỉ có món độc quyền của chính sự kiện đó và chỉ mở được trong thời gian diễn ra (DEV có thể xem thử).
- **Hồ sơ:** Xem tổng quan, đổi tên và danh hiệu, xem lịch sử chìa khóa, viết check-in có ảnh; thẻ món có CTA check-in. Taste Swipe ghi nhận tag ưa thích và tăng trọng số món phù hợp tối đa 5% mà không đổi bậc hiếm.
- **Dung hợp:** Ghép 3 phần thưởng cùng ngày; chọn banner thường hoặc sự kiện đang diễn ra để xác định pool đầu ra. Hết sự kiện không thể ghép ra món của sự kiện nữa. Món đã nhận vẫn nằm trong bộ sưu tập và vẫn có thể dùng làm nguyên liệu ghép món thường.
- **Thành tựu:** Thu thập đủ 58 món thường để mở rương vô hạn vĩnh viễn. Tab Giới hạn hiển thị 6 món riêng cho từng sự kiện mùa và 6 món Tây Bắc. Tết Việt Sum Vầy diễn ra 04–16/02/2027 (mùng Một 06/02); Mùa Hè Thanh Mát diễn ra 01/06–31/08/2027. Khi nhiều banner cùng diễn ra, popup ưu tiên sự kiện bắt đầu gần nhất và dẫn thẳng tới rương sự kiện. Trang quán lân cận yêu cầu vị trí khi mở popup.
- **Bảo trì catalog:** CSV có các cột cơ bản `id,name,search_query,meal_slots,category,description,image_url,tags,weight,rarity,price_tier,active`; tuỳ chọn `name_en,description_en,country,region,categories,search_queries,base_weight,type,limited_event_id`. Tag cách nhau bằng `|`. Món giới hạn cài sẵn và món thêm trong source vẫn được tự ghép vào catalog khi dùng CSV.

## Quản trị nội dung ở môi trường DEV

Chạy `pnpm dev`, vào các mục DEV ở cuối trang **Cài đặt** để tải banner thông báo, bật/tắt popup, thêm/sửa/xóa sự kiện giới hạn và món local kèm ảnh WebP. Các thao tác này ghi thẳng vào `src/infrastructure/banner/bannerConfig.ts`, `src/infrastructure/events/limitedEvents.json`, `src/infrastructure/catalog/localDishes.json` và `public/assets/…`. Kiểm tra các file thay đổi rồi commit/deploy để đưa nội dung lên bản production; giao diện quản trị và API ghi file chỉ chạy ở môi trường development. Chế độ xem thử sự kiện ở Cài đặt hoặc trang Sự kiện chỉ ảnh hưởng máy DEV hiện tại. Thời gian sự kiện Tây Bắc hiện được cấu hình từ 18 đến 19/09/2026 và sẽ không thể mở rương sự kiện sau khi hết hạn trừ khi chỉnh lại ngày trong source.

## Tài liệu thiết kế

- [`docs/specs/FoodChest_Product_Spec_v1.md`](docs/specs/FoodChest_Product_Spec_v1.md)
- [`docs/specs/FoodChest_UI_Animation_Spec_v2.md`](docs/specs/FoodChest_UI_Animation_Spec_v2.md)
- [`docs/art-direction/README.md`](docs/art-direction/README.md)

Đây là sản phẩm lấy cảm hứng từ nhịp điệu và cảm giác “loot reveal” của game client. Không sử dụng nhãn hiệu, logo, nhân vật, âm thanh hoặc asset độc quyền của Riot Games/League of Legends.
