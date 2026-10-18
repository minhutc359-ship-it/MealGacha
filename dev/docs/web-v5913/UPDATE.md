# Web 5.9.13 — Đội hình Auto Chess và Adventure HD

Đợt này hoàn tất model 32 pose cho mười Vị Linh còn lại trong nhóm món lõi Auto Chess và sửa nguyên nhân nhân vật bị mờ trong Adventure. ID, kỹ năng, chỉ số, pool, mở khoá và save không đổi.

| ID | Nhận diện lấy từ portrait canon | Motif VFX |
|---|---|---|
| banh-dau-xanh | Rồng trắng vàng, ngọc vàng | Ngọc châu |
| banh-khuc | Hồ ly trắng, miện lá xanh vàng | Diệp y |
| banh-can | Thỏ trắng, hai khiên tròn vàng | Kim luân |
| banh-tom-ho-tay | Sư tử hộ vệ cam trắng | Hồ hỏa |
| com-hen | Hươu trắng, gạc phân nhánh và ngọc trai | Châu giáp |
| che-lam | Hạc trắng, mỏ vàng | Khương vũ |
| chao-luon | Hổ trắng, vân nước teal | Thủy tuyến |
| banh-it-la-gai | Koi cam trắng, vây dài | Diệp lưu |
| banh-ram-it | Cú nâu trắng | Song nhịp |
| keo-cu-do | Sói xám trắng, áo choàng đỏ vàng | Xích xung |

Không suy diễn hình loài từ tên món hoặc chuỗi `species` cũ. `identity-sources.json` cố định ô portrait 112–121, hash atlas và crop canon; portrait hồ sơ/thẻ/banner tiếp tục dùng nguyên ô gốc.

## Sản xuất và tích hợp

- Built-in Imagegen tạo hai sheet 4×4 cho mỗi ID từ portrait canon và style sprite đã duyệt. Tổng **320 pose vẽ**: idle, walk, attack, cast, ultimate, hit, fall, victory; bốn pose/trạng thái.
- `pack-campaign598.py` thêm cohort `autochess5913`, xuất **20 atlas**: HD 1024×2048 và pixel 256×512. `inspect-character-atlas.py` giải mã file cuối, kiểm tra 320 frame, alpha, gutter, pivot và hash.
- Manifest chung thêm mười model, portrait cell, cast anchor, timing và mười motif VFX riêng. Adventure, TCG và Auto Chess cùng resolve một ID/model, không tạo alias gameplay.
- Adventure trước đây thay mọi model authored bằng `pixelSheet`, tức khung nguồn 64×64 bị phóng lên actor lớn. `RpgBattleView` nay giữ atlas HD 256×256; canvas vẫn tự chọn DPR 1/2 theo chế độ nhẹ và mật độ màn hình. Test hồi quy kiểm tra cả ally/enemy không thể quay lại sheet `-pixel`.
- Auto Chess và TCG dùng model mới ngay trên catalog hiện có. Toàn bộ 44 unit Auto vẫn có cặp sheet/row riêng; bốn NPC `loc`, `tinh`, `sen`, `recorder` vẫn dùng atlas legacy riêng của chúng.

## Tiến độ

Audit từ catalog/resolver thực ghi nhận **49/139** Vị Linh có bộ 32 pose, còn **90**: 86 portrait-only và 4 model animation cũ. Đối thủ giữ 16/40, còn 24. Đây là đợt P0 tiếp theo; rig/mesh, run riêng, turn nhiều hướng, biểu cảm/lip-sync, test thiết bị thật và quyền 13 asset cũ vẫn nằm trong roadmap.

Xem `VERIFICATION.md`, `HUMAN_QA.md`, `ROADMAP_STATUS.md` và `CHANGED_FILES.md`. Chủ dự án test thiết bị vật lý, review và quyết định merge; nhánh/PR không tự merge.
