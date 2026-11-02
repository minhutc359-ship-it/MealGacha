# Art và quyền sử dụng nhân vật — AW2-019A

2026-11-02 · Nhánh `game/adventure-world-2` · Cả 12 Vị Linh giữ nguyên ID, tên, trang phục, vai trò và kit đã duyệt.

## Bộ art đã triển khai

Mỗi nhân vật tiếp tục dùng chibi bốn hướng, tám trạng thái battle/bốn cel mỗi trạng thái, portrait, bốn kỹ năng có cue FX/audio, cấp1–20 và collection/đội lưu hiện có. 019A bổ sung **12 minh họa HD tuyệt kỹ mới** tạo bằng built-in image_gen từ đúng ảnh nhận diện gốc; không thay chibi/sprite, không đổi gameplay hoặc save.

| Nhân vật | Tuyệt kỹ | Nhận diện / chủ đề minh họa mới |
|---|---|---|
| Than | Chỗ Sau Lưng | Áo chàm, khiên đồng ba hạt than, vòng bảo vệ màu hổ phách |
| Lửa Nhỏ | Dọc Phố Sớm | Áo xanh, khăn cam, túi đeo, dải hơi ấm theo bước lao |
| Lam Lam | Bữa Ăn Yên | Tóc tết xanh đen, tạp dề lam, dải hơi dịu màu ngà/xanh |
| Mộc Non | Chung Một Mâm | Tóc buộc cao, quạt tre, lá xanh và mâm ấm nhỏ |
| Sương Lành | Lối Qua Màn Trắng | Tóc tím, khăn trắng, cuộn thư và lối sáng qua sương |
| Muối Đen | Một Nhúm Đủ Rồi | Áo xám, hũ muối tay trái, nhúm tinh thể hữu hạn |
| Nhiên | Lửa Qua Ba Nhịp | Tóc búi khăn đỏ, hai dụng cụ gỗ, ba vệt lửa |
| Hải | Bờ Đợi | Áo xanh ngọc, khiên sóng cong, đường bờ bảo vệ |
| Liên | Mở Lời | Áo hồng sen, hạt sen, chỉ sáng và nhịp hồi phục |
| Mộc | Mở Gói Mùa Xanh | Áo lá màu cốm, bó lúa/lá gói, dấu phép xanh |
| Bách | Mở Vòng Dây | Người trưởng thành, khiên gỗ chữ nhật, vòng dây buộc |
| Vân | Bữa Ăn Chưa Gọi Tên | Tóc bạc, áo xám/ngà, vòng xà cừ còn khe hở, hai sợi nối |

Nguồn: `dev/aw2/assets/<nhân-vật>/ultimate-v1/art.png`; runtime:`art.webp`; exact prompt và input/output SHA-256:`prompts.json`; quy trình và trạng thái quyền:`provenance.json`. [Registry](../../src/aw2/assets/ultimate-art.v1.json) ghi byte/kích thước/hash/alpha. Bộ WebP **23.007.828bytes**, mỗi ảnh1536×1024, tối đa6.291.456bytes RGBA/ảnh; lossless chính xác RGBA, không repaint/mask/mirror/resize. Source PNG không ship trong production.

## Hiển thị trong game

`BattleCanvas` dùng cùng lớp art cho practice và encounter thật. Chỉ `cast-start` có actor/ultimate ID hợp lệ ở tick hiện tại mới sinh cut-in; tối đa một cue mới nhất, không replay lịch sử khi mount/đổi trận/tab ẩn. Không thay sát thương, heal, shield, thời điểm contact hay thao tác lưu. Cut-in tự đóng sau1.800ms; pause/stop/end/tab ẩn dọn ngay, giảm chuyển động bỏ animation. Portrait hiện trong lúc ảnh HD đang tải hoặc khi tải lỗi. Lớp không bắt input hoặc dừng engine.

Ảnh được tải khi có cue, không đưa cả12ảnh vào preload bản đồ hoặc offline core. QA:`pnpm dev:aw2`, mở `/dev/aw2/roster.html` để chọn12bộ và xem art; đây là tool review, không mở vào bundle chính.

## Quyền sử dụng đã có bằng chứng gì

- [Source register](../../rights/aw2/character-sources.json):126runtime files của12nhân vật, source PNG/runtime/audio hashes và selected-generation records;0đầu vào ngoài được **khai báo**. Đây là đối chiếu hồ sơ dự án, không phải bảo đảm tuyệt đối rằng không có quyền của bên thứ ba.
- [Provider-use basis](../../rights/aw2/provider-use.json): điều khoản OpenAI về quyền giữa nhà cung cấp và người dùng, trách nhiệm đầu vào và output có thể không độc quyền; reviewed2026-11-02. Xem [Terms of Use](https://openai.com/policies/terms-of-use/) và [Service Terms](https://openai.com/policies/service-terms/).
- Âm thanh nhân vật là48cue WAV tổng hợp xác định bằng mã nguồn có hash; không dùng ChatGPT Voice Output hoặc bản nhạc/giọng thu bên ngoài trong phạm vi pack này.
- [LICENSE](../../LICENSE) của dự án giữ nguyên: quyền được bảo lưu trong phạm vi có thật; không chuyển thành CC0/public-domain hoặc cấp quyền bán lại asset. Rương, thư viện/font và các tài nguyên ngoài roster giữ hồ sơ/điều kiện riêng.
- Credit người chơi nằm ở Hướng dẫn→Hình ảnh và âm thanh và trang `/legal/rights.html`. Trang pháp lý không công khai prompt/path nội bộ hay giả lập chứng nhận đăng ký.

Chạy `pnpm release:aw2-rights --check` để phát hiện drift so với hồ sơ đã ghi; `pnpm build` bắt buộc kiểm này. Sau khi thay asset hợp lệ, xem diff rồi `pnpm release:aw2-rights --write` để tạo lại hồ sơ. `--require-cleared` trả exit2 khi quyền phát hành còn mở: audit kỹ thuật không tự cấp clearance.

## Phạm vi chưa thể tự ký duyệt

12/12ảnh mới đã được assistant xem/đối chiếu nhận diện và kiểm kỹ thuật; đây không phải independent art review hoặc human/device/audio acceptance. `fullCharacterComplete=false`, commercialRelease`NOT_CLEARED`, không khẳng định bản quyền độc quyền/đăng ký thành công. Chưa nộp hồ sơ đăng ký, chưa có chữ ký/chứng nhận pháp lý, chưa nghiệm thu thiết bị thật. D20 tiếp tục cho phép triển khai trong khi các bằng chứng này chưa có; không tự đặt chúng thành PASS hoặc production100%.
