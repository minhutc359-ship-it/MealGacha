# Nhà, tiệm và sân chơi AW2

Chạy `pnpm dev`, mở `/dev/aw2/world.html`. Dùng bản lưu AW2 hiện có hoặc tạo bản chơi thử riêng. Chọn **Bám nhân vật** để đi giữa các dãy nhà; chọn **Toàn cảnh** để xem bố cục khu phố.

| Khu vực | Công trình | Điểm đến đi bộ mới |
| --- | --- | --- |
| Làng Giao Ước |10nhà, tiệm trà/tạp hóa và sân chơi | Ngõ nhà, hiên trà, sân chơi |
| Phố Đèn Lồng |12nhà, tiệm đèn lồng, quầy sáng, xưởng, bàn chơi và sân chơi | Dãy tiệm, bàn chơi, hiên trà |
| Sân Bếp Bỏ Quên |10nhà, quầy bếp/tạp hóa, xưởng và sân chơi | Hiên bếp, ngõ nhà, sân chơi |

Danh sách **Dạo quanh khu phố** chỉ cho nhân vật đi bộ tới vị trí. Tới gần NPC rồi dùng E/Tương tác để trò chuyện, nhận ký ức hoặc mở bàn bài/bàn cờ như trước. Các công trình bổ sung là phong cảnh; chưa có thao tác vào nhà hay mua hàng. Mái che mờ khi che nhân vật/NPC. Lối đi, va chạm, bản lưu, phần thưởng và đội hình giữ nguyên; trên map chỉ có nhân vật đầu đội đại diện.

Hai atlas dùng **OpenAI built-in image_gen**,3lần gọi/2ảnh chọn/1ảnh nhà bị loại vì thiếu khe an toàn, được tạo lại bằng công cụ. Cả hai PNG1254×1254giữ nguyên; WebP nén lossless giữ chính xácRGBA. Tám ô hình tạo32công trình bằng scale đồng nhất; không lật/vẽ đè/sửa pixel. Tham chiếu ảnh Làng/Phố của dự án đã ghim Gitblob/SHA trong prompt và provenance.

| Bộ ảnh | PNG gốc được chọn | Prompt và lịch sử chọn |
| --- | --- | --- |
| Nhà/tiệm trà/tạp hóa/sân chơi | [homes-source.png](../../dev/aw2/assets/environments/settlement/v1/homes-source.png) | [homes-prompts.json](../../dev/aw2/assets/environments/settlement/v1/homes-prompts.json), [selection](../../dev/aw2/assets/environments/settlement/v1/homes-selection.json) |
| Tiệm đèn/quầy sáng/xưởng/bàn chơi | [shops-source.png](../../dev/aw2/assets/environments/settlement/v1/shops-source.png) | [shops-prompts.json](../../dev/aw2/assets/environments/settlement/v1/shops-prompts.json), [selection](../../dev/aw2/assets/environments/settlement/v1/shops-selection.json) |

[Manifest và vị trí](../../src/aw2/assets/settlement-v1.json) · [Provenance/quyền sử dụng](../../dev/aw2/assets/environments/settlement/v1/provenance.json) · [Kiểm chứng006O](evidence/AW2-006O.md). Quyền sử dụng hiện REVIEW_REQUIRED/commercialNOT_CLEARED; đây là bộ hình tham chiếu phát triển.

Hoạt ảnh đứng yên của tám NPC giữ nguyên. Việc tiếp theo[006N](tasks/AW2-006N.md) là thêm chuyển động môi trường có frame riêng ở Làng/Phố, có dừng khi hội thoại và chế độ giảm chuyển động. Demo90%/sản phẩm≈40%(35–45%) giữ nguyên.
