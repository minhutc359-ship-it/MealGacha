# MealGacha · Rương Vị Giác

Web app gợi ý món ăn sáng, trưa và tối qua trải nghiệm mở rương theo phong cách fantasy game client. Điểm danh nhận 10 chìa mỗi ngày, giải 3 câu Đoán món để nhận thêm 3 chìa và hoàn tất Taste Swipe nhận 2 chìa. Sưu tập 50 món thường cùng 39 món giới hạn trong 9 sự kiện, dung hợp 3 phần thưởng cùng ngày, ghi nhật ký ăn uống và mở danh hiệu. Thu thập đủ món thường để mở rương vô hạn.

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

- `VITE_GOOGLE_MAPS_API_KEY`: khóa cho Places API (New). Giới hạn theo HTTP referrer và chỉ bật API cần thiết. Nếu chưa có khóa hoặc vị trí bị từ chối, popup đưa ra liên kết tìm trên Google Maps; app không bịa quán hay đánh giá.
- `VITE_CATALOG_URL`: URL CSV của Google Sheet đã **Publish to web**. Người dùng cũng có thể cấu hình và xem trước nguồn trong trang Cài đặt.
- `VITE_CHEST_OPENING_AUDIO_URL`: URL ghi đè cho âm thanh mở rương. Mặc định app dùng file `public/assets/audio/chest-opening.mp3` dài 4,284 giây và đồng bộ timeline 4,14 giây.
- `VITE_DAILY_KEYS`, `VITE_CHEST_COST`: tham số kinh tế mặc định là 10 chìa/ngày và 1 chìa/lượt.
- `VITE_APP_TIME_ZONE`: múi giờ nghiệp vụ, mặc định `Asia/Ho_Chi_Minh`.

Hồ sơ, chìa, lịch sử và bài viết nằm trong `localStorage`; ảnh check-in nằm trong IndexedDB. Trang Cài đặt có xuất/nhập JSON (không chứa ảnh) và ZIP đầy đủ (có ảnh). Dữ liệu và tọa độ không được tải lên máy chủ của ứng dụng; kết quả Google Places phụ thuộc API key và quyền vị trí.

## Luồng sử dụng

- **Rương:** Chọn sáng, trưa hoặc tối; nhấn mở để chạy nghi thức chìa khóa, âm thanh và hiệu ứng. Món chỉ hiện khi nghi thức kết thúc (có nút bỏ qua và hỗ trợ giảm chuyển động). Chế độ sự kiện hiện riêng theo ngày và có thể ép bật trong DEV ở Cài đặt.
- **Hồ sơ:** Xem tổng quan, đổi tên và danh hiệu, xem lịch sử chìa khóa, viết check-in có ảnh; thẻ món có CTA check-in. Taste Swipe ghi nhận tag ưa thích và tăng trọng số món phù hợp tối đa 5% mà không đổi bậc hiếm.
- **Thành tựu:** Thu thập đủ 50 món thường để mở rương vô hạn vĩnh viễn. Tab Giới hạn hiển thị món của 9 sự kiện, gồm Tây Bắc, Năm Mới Rực Rỡ (01–15/01/2027) và Mùa Hè Thanh Mát (01/06–31/08/2027). Hai banner mới chọn 8 món đã có ảnh trong catalog cho mỗi sự kiện. Khi nhiều banner cùng diễn ra, popup thông báo ưu tiên sự kiện bắt đầu gần nhất và dẫn thẳng tới rương sự kiện. Trang quán lân cận yêu cầu vị trí khi mở popup.
- **Bảo trì catalog:** CSV có các cột cơ bản `id,name,search_query,meal_slots,category,description,image_url,tags,weight,rarity,price_tier,active`; tuỳ chọn `name_en,description_en,country,region,categories,search_queries,base_weight,type,limited_event_id`. Tag cách nhau bằng `|`. Món giới hạn cài sẵn và món thêm trong source vẫn được tự ghép vào catalog khi dùng CSV.

## Quản trị nội dung ở môi trường DEV

Chạy `pnpm dev`, vào các mục DEV ở cuối trang **Cài đặt** để tải banner thông báo, bật/tắt popup, thêm/sửa/xóa sự kiện giới hạn và món local kèm ảnh WebP. Các thao tác này ghi thẳng vào `src/infrastructure/banner/bannerConfig.ts`, `src/infrastructure/events/limitedEvents.json`, `src/infrastructure/catalog/localDishes.json` và `public/assets/…`. Kiểm tra các file thay đổi rồi commit/deploy để đưa nội dung lên bản production; giao diện quản trị và API ghi file chỉ chạy ở môi trường development. Chế độ xem thử sự kiện ở Cài đặt hoặc trang Sự kiện chỉ ảnh hưởng máy DEV hiện tại. Thời gian sự kiện Tây Bắc hiện được cấu hình từ 18 đến 19/09/2026 và sẽ không thể mở rương sự kiện sau khi hết hạn trừ khi chỉnh lại ngày trong source.

## Tài liệu thiết kế

- [`docs/specs/FoodChest_Product_Spec_v1.md`](docs/specs/FoodChest_Product_Spec_v1.md)
- [`docs/specs/FoodChest_UI_Animation_Spec_v2.md`](docs/specs/FoodChest_UI_Animation_Spec_v2.md)
- [`docs/art-direction/README.md`](docs/art-direction/README.md)

Đây là sản phẩm lấy cảm hứng từ nhịp điệu và cảm giác “loot reveal” của game client. Không sử dụng nhãn hiệu, logo, nhân vật, âm thanh hoặc asset độc quyền của Riot Games/League of Legends.
