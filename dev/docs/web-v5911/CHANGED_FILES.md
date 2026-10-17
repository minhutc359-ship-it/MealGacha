# Phạm vi thay đổi 5.9.11

| Nhóm | Nội dung |
|---|---|
| Runtime | `src/game/characterVisuals.ts`: bốn visual mới, đường dẫn/pivot/contact; `src/game/starterVfx.ts`: bốn motif geometry riêng |
| Asset | `public/assets/characters/spring5911/`: 12 WebP, 128 pose HD/pixel và bốn portrait |
| Sản xuất | `dev/tools/pack-campaign598.py` thêm cohort hero; `inspect-character-atlas.py` kiểm tra file cuối và tạo contact sheet |
| Browser | `verify-spirits5910.mjs` nhận cohort 5911, giữ 5910 mặc định; `verify-showcase-modes597.mjs` cho phép roster Auto riêng và lọc asset theo root |
| Test | `rare595`, `regional5910`, `visualManifest591`: thêm cohort vào các kiểm chứng hiện có; `challenge`: so identity bằng sheet+row thay vì row sau khi tách atlas |
| Bản phát hành | `package.json` 5.9.11; script release records, asset register, dependency version header, third-party notices và build-size cập nhật; graph dependency giữ nguyên |
| Bằng chứng | `dev/docs/web-v5911`: canon/prompt/hash, asset QA, browser Adventure và Auto/TCG, cold/offline/metrics, ảnh evidence và hướng dẫn review |

Không sửa engine, catalog gameplay, battle/reward, unlock, collection, save/storage, networking, schema/version hay dependency lockfile. Các atlas cũ vẫn phục vụ ID còn lại. Các sửa đổi trong `dev` không được đưa vào dist; release guard đã kiểm tra build mới.

Nguồn nền là Web 5.9.10; các PR cũ đã được chủ dự án merge theo chuỗi. `master` tại `b4014c14ced61d45286a2599bb09debff2f91fb1` có cùng tree `3a514c23c8dee501b736c15fbb717ec3ff462271` với bản 5.9.10, nên PR này nhắm `master`. ChatGPT không thực hiện merge.
