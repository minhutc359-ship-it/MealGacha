# MealGacha · Rương Vị Giác

Web app gợi ý món ăn sáng, trưa và tối qua trải nghiệm mở rương theo phong cách fantasy game client. Mỗi ngày người dùng điểm danh nhận 10 chìa khóa, mở rương để sưu tập 50 món, ghép 3 phần thưởng cùng ngày thành món mới, hoàn thành Thành tựu để mở rương vô hạn, tìm quán gần vị trí hiện tại và dùng vòng quay tự do.

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
```

## Cấu hình

- `VITE_PLACES_PROVIDER`: mặc định là `osm`, dùng Photon + dữ liệu OpenStreetMap miễn phí và hiển thị attribution. Đặt `google` để dùng Google Places API (New).
- `VITE_GOOGLE_MAPS_API_KEY`: khóa cho Google Places API khi `VITE_PLACES_PROVIDER=google`. Rating/review chỉ có từ Google; với OSM, app dùng tên, địa chỉ, khoảng cách và giờ mở cửa nếu dữ liệu có.
- `VITE_CATALOG_URL`: URL CSV của Google Sheet đã **Publish to web**. Người dùng cũng có thể cấu hình và xem trước nguồn trong trang Cài đặt.
- `VITE_CHEST_OPENING_AUDIO_URL`: URL ghi đè cho âm thanh mở rương. Mặc định app dùng file `public/assets/audio/chest-opening.mp3` dài 4,284 giây và đồng bộ timeline 4,14 giây.
- `VITE_DAILY_KEYS`, `VITE_CHEST_COST`: tham số kinh tế mặc định là 10 chìa/ngày và 1 chìa/lượt.
- `VITE_APP_TIME_ZONE`: múi giờ nghiệp vụ, mặc định `Asia/Ho_Chi_Minh`.

### Thêm món mới

Vào **Cài đặt → Thêm món local** khi chạy `pnpm dev` để thêm món và kiểm tra ngay trên trình duyệt developer. Dev server sẽ ghi món vào `src/infrastructure/catalog/localDishes.json`, vì vậy dữ liệu đã trở thành source code và có thể commit để deploy. Section này không được render trong production và store cũng từ chối action ngoài dev.

Để món có ảnh khi deploy:

1. Đặt ảnh WebP tại `public/assets/food/full/<id>.webp`.
2. Nhập `imageUrl` là `/assets/food/full/<id>.webp` trong form, hoặc thêm dòng món vào catalog CSV/seed catalog.
3. Commit ảnh và dữ liệu catalog lên repository rồi build/deploy lại.

Nếu không commit `localDishes.json` và ảnh, món chỉ tồn tại trên môi trường dev/browser đã thêm món đó; user trên server không thể mở setting này.

### Banner thông báo mới

Trong local, vào **Cài đặt → Banner thông báo local**, tải ảnh lên và bật popup để xem thử. Dev server sẽ ghi ảnh vào `public/assets/banners` và cập nhật `src/infrastructure/banner/bannerConfig.ts`; commit các file này để banner chạy khi deploy. Override local chỉ được đọc trong dev, và setting không xuất hiện ở production.

Để banner chạy trên mọi environment:

1. Đặt ảnh vào `public/assets/banners/<file>.webp`.
2. Mở `src/infrastructure/banner/bannerConfig.ts`.
3. Đổi `id` sang một ID mới, đặt `imageUrl` thành `/assets/banners/<file>.webp` và `enabled: true`.
4. Commit ảnh cùng file config rồi build/deploy.

Checkbox “không hiển thị lại lần sau” được lưu theo `bannerId`. Khi `id` đổi cho banner mới, popup sẽ hiện lại và trạng thái checkbox cũ không được dùng.

Toàn bộ dữ liệu người dùng được lưu trong `localStorage`; chức năng xuất/nhập backup nằm trong Cài đặt.

## Tài liệu thiết kế

- [`docs/specs/FoodChest_Product_Spec_v1.md`](docs/specs/FoodChest_Product_Spec_v1.md)
- [`docs/specs/FoodChest_UI_Animation_Spec_v2.md`](docs/specs/FoodChest_UI_Animation_Spec_v2.md)
- [`docs/art-direction/README.md`](docs/art-direction/README.md)

Đây là sản phẩm lấy cảm hứng từ nhịp điệu và cảm giác “loot reveal” của game client. Không sử dụng nhãn hiệu, logo, nhân vật, âm thanh hoặc asset độc quyền của Riot Games/League of Legends.
