# Làng Giao Ước — khu khởi đầu

AW2-006I nâng cảnh làng theo hai ảnh gốc Làng Linh Vị ở mainline: nhà ngói đỏ, tre, đèn lồng, cầu/sen/thác, sân gạch và hoa; ba tán cây tiền cảnh tạo chiều sâu. Bà Giữ Chỗ/bàn chung có mảnh khăn/giếng vẫn ở đúng điểm cũ. Một nhân vật đầu đội đã lưu đại diện khi khám phá; trước nhập môn dùng Than làm hình đại diện, chưa cấp sở hữu. Đây là art tham chiếu tĩnh, chưa phải NPC có chuyển động đầy đủ.

```sh
pnpm dev
```

Mở `/dev/aw2/world.html`, tạo bản lưu AW2 trong hồ sơ QA riêng. Dùng chạm lên lối đi/WASD hoặc ba nút trong “Điểm đến trong Làng Giao Ước”. Chọn **Bám nhân vật** để camera đi theo hoặc **Toàn cảnh** để xem phong cảnh rộng. Điểm chạm dùng đúng góc nhìn; chạm lên nhà/cầu ngoài sân không mở thêm đường. Nút góc nhìn chỉ thay cách xem, không đổi vị trí/save/nhiệm vụ. Reduced motion tắt độ lệch tán cây theo camera; cây che nhân vật sẽ mờ. Danh sách điểm đến luôn có thể dùng dù nhãn trên map khuất khỏi góc nhìn.

Các nút chỉ đưa nhân vật đi tới gần mục tiêu; khi đến nơi, bấm E hoặc Tương tác rồi chọn thao tác:

1. **Bà Giữ Chỗ → Nhận nhiệm vụ**.
2. **Bàn chung · mảnh khăn → Đọc mảnh khăn**.
3. **Bà Giữ Chỗ → Hoàn tất nhập môn** để nhận đúng năm starter và quà nhập môn một lần.
4. **Đến Phố Đèn Lồng → Đi qua**. Cổng tây Phố đưa về làng; không cần hoàn tất nhiệm vụ để dùng đường hai chiều.

Mục tiêu dừng32px dưới Bà/bàn để tránh đứng đè lên hình, vẫn trong khoảng tương tác hiện có. Nhãn và nút ghi trạng thái thực: chưa nhận nhiệm vụ, có thể đọc khăn, có thể hoàn tất hoặc đã kết thúc. Đi bộ/mở thoại/đóng thoại không tự nhận đội hoặc quà. Đến gần giếng vẫn bị chặn bởi vùng va chạm cũ; giếng giảm độ đậm khi che nhân vật phía sau. Kết thúc truyện trở về Bà vẫn dùng trạng thái/ending đã lưu.

Nếu ảnh làng không tải được, map báo lỗi và khóa các nút điểm đến; không thay bằng hình debug. Dữ liệu gốc được giữ, đọc lại/reload sau khi tài nguyên tải được. Các thao tác vẫn tuân theo save riêng `aw2.development.save`; không reset dữ liệu Soul of Meal.

Cảnh và tiền cảnh mới tạo bằng built-in imagegen: [PNG cảnh](../../dev/aw2/assets/environments/covenant-village/v2/landscape-source.png), [PNG tiền cảnh](../../dev/aw2/assets/environments/covenant-village/v2/foreground-source.png), [prompt/bằng chứng hai ảnh tham chiếu](../../dev/aw2/assets/environments/covenant-village/v2/prompts.json). PNG gốc/WebP lossless/khung alpha/provenance được giữ; Bà/bàn/giếng v1 tái dùng nguyên trạng. Dấu lối ra tái dùng ảnh gốc006C. Full environment/NPC motion/rights chưa được công nhận hoàn tất. Theo yêu cầu owner, lượt nghiệm thu độc lập/iPhone tạm gác để tiếp tục triển khai các vùng còn lại; trạng thái đó vẫn NOT_RUN.
