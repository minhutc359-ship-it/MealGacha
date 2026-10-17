# Nhóm file cần review

| Đường dẫn | Thay đổi |
|---|---|
| public/assets/characters/regional5910/ | 4 × HD, pixel và portrait; 12 WebP |
| src/game/characterVisuals.ts | 4 identity/timing/anchor/root; VFX procedural thay vì tham chiếu texture không tồn tại |
| src/game/starterVfx.ts | 4 motif giới hạn số nét và thời gian, dùng chung ba mode |
| dev/tests/game/rare595.test.ts | Áp dụng contract resolver và reload/double-skip cho nhóm mới |
| dev/tests/game/regional5910.test.ts | Geometry khác nhau/có giới hạn và contact Auto/TCG |
| dev/tests/game/visualManifest591.test.ts | 27 nhân vật; chấp nhận effect procedural, tiếp tục kiểm tra asset thật |
| dev/tools/pack-campaign598.py | Mở rộng packer chung cho hero cohort/portrait và ghi revision nguồn |
| dev/tools/verify-spirits5910.mjs | Browser contract nhóm mới qua reducer và đồng hồ kiểm soát |
| dev/tools/verify-showcase-modes597.mjs | Tùy chọn QA_IDS để test cast Auto và TCG unit attack thật của nhóm mới |
| dev/tools/release-records.mjs, rights/, public/legal/ | Ghi provenance 12 asset, dependency runtime giữ nguyên |
| package.json, .gitignore, dev/docs/ | Version 5.9.10, ảnh review, ngân sách và trạng thái roadmap |

Không đổi engine, roster sở hữu, chỉ số, độ hiếm, giá, mở khóa, phần thưởng, save schema/version hay tiến trình. Test fixture chỉ sửa save cô lập để quan sát. Thiết bị thật và review/merge do chủ dự án thực hiện.
