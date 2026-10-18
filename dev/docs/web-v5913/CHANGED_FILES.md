# Phạm vi 5.9.13

| Nhóm | Thay đổi |
|---|---|
| Runtime | Mười visual definition, portrait cell, cast anchor, timing và motif VFX; helper chọn model HD cho Adventure |
| Sửa mờ | Adventure bỏ ép `pixelSheet` 64 px, dùng atlas HD 256 px/frame; DPR canvas vẫn thích ứng |
| Asset | `public/assets/characters/autochess5913/`: 20 WebP, 320 pose; portrait canon tái dùng |
| Pipeline | Packer thêm cohort `autochess5913`; inspector/provenance/hash; audit thêm thống kê model Auto |
| Regression | Test HD Adventure, manifest/VFX/contact/reload, model TCG; QA script nhận 2–5 ID và viewport tuỳ chọn |
| Release | Version 5.9.13, asset/dependency records, notices, metrics, offline và browser evidence |

Nhánh bắt đầu từ `35be078b4a8a46ad533106575478806ba6a0bbe3` trên `master`. Gameplay engine, chỉ số, pool, reward, unlock, storage/schema và networking không đổi. Không tự merge.
