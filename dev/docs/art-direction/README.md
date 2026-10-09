# Art direction & runtime assets

Các file WebP trong thư mục này là bảng tham chiếu được tạo riêng cho MealGacha:

- `foodchest-loot-client-concept.webp`: bố cục desktop loot client.
- `foodchest-asset-board.webp`: ngôn ngữ hình khối rương, chìa khóa, lõi sáng và khung rarity.
- `food-atlas-a-breakfast.webp`, `food-atlas-b-main.webp`, `food-atlas-c-dinner.webp`: atlas nguồn của 30 món.

Runtime không tải trực tiếp atlas. Mỗi món được crop và tối ưu thành một ảnh WebP canonical 512×512 trong `public/assets/food/full/`; component tự scale theo ba ngữ cảnh:

| Biến thể | Kích thước mục tiêu | Mục đích |
| --- | ---: | --- |
| `thumb` | render 256×256 | inventory và bộ sưu tập |
| `card` | render theo card | thẻ món |
| `full` | source 512×512 | reveal phần thưởng |

ID file khớp với `Dish.id` trong seed catalog. Registry và fallback nằm tại `src/infrastructure/assets/foodAssets.ts`.

Asset được tạo mới theo phong cách fantasy-tech nguyên bản; không sao chép logo, nhân vật hay asset độc quyền từ League of Legends.
