# Web 5.9.14 — Tám Vị Linh TCG/Adventure đầu tuyến

Đợt này nâng cấp tám Vị Linh xuất hiện sớm trong TCG và Adventure từ portrait tĩnh lên bộ model 32 pose. ID, kỹ năng, chỉ số, phần thưởng, điều kiện mở khóa và save không đổi.

| ID | Nhận diện cố định từ portrait canon | Motif VFX |
|---|---|---|
| mi-van-than | Thỏ trắng, giáp teal-vàng, thương nước | Thủy thố |
| mi-cay | Sư tử bờm đỏ, giáp đen-vàng, thương teal | Xích triều |
| ga-ran | Hươu ngà có gạc, giáp lá vàng | Kim diệp |
| pizza | Hạc mào đỏ, lông trắng-than, thương vàng | Kim phong |
| pasta | Hổ cam, giáp tối viền vàng | Liệt dương |
| sushi | Cá koi đỏ-trắng, vây dài | San hô lưu |
| tokbokki | Cú sừng mắt hổ phách, giáp đỏ-đen-vàng | Xích vũ |
| lau-thai | Sói bạc, ấn đỏ trên mặt và giáp | Xích ấn |

`identity-sources.json` khóa ô portrait 18–25, hash atlas và crop canon. Hồ sơ, thẻ, banner và model trận đấu cùng resolve theo một ID; không suy diễn loài từ tên món.

## Sản xuất và tích hợp

- Built-in Imagegen tạo hai sheet 4×4 cho mỗi ID từ portrait canon và style sprite đã duyệt. Tổng cộng **256 pose vẽ**: idle, walk, attack, cast, ultimate, hit, fall, victory; bốn pose/trạng thái.
- `pack-campaign598.py` thêm cohort `tcg5914`, xuất **16 atlas**: HD 1024×2048 và pixel 256×512. Inspector giải mã file cuối, kiểm tra 256 frame, alpha, gutter, pivot và hash.
- Manifest chung thêm tám model, portrait cell, cast anchor, timing và tám motif VFX riêng. Adventure và TCG dùng model mới ngay trên catalog hiện có; Auto Chess không có tám ID này nên roster Auto không đổi.
- Adventure tiếp tục dùng atlas HD 256 px/frame từ 5.9.13. Atlas pixel chỉ dành cho ngữ cảnh pixel nhỏ, tránh tái phát lỗi nhân vật bị mờ khi phóng lớn trong trận.

## Tiến độ

Audit từ catalog/resolver ghi nhận **57/139** Vị Linh có bộ 32 pose, còn **82**: 78 portrait-only và 4 model animation cũ. Đối thủ giữ 16/40, còn 24. Theo yêu cầu mới, batch Vị Linh/boss kế tiếp tạm dừng sau PR này để ưu tiên manga cốt truyện TCG/Adventure có mở khóa theo chương.

Xem `VERIFICATION.md`, `HUMAN_QA.md`, `ROADMAP_STATUS.md` và `CHANGED_FILES.md`. Chủ dự án test thiết bị vật lý, review và quyết định merge; nhánh/PR không tự merge.
