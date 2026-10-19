# Phạm vi thay đổi

- `src/game/characterVisuals.ts`: bốn model mới, portrait canon/anchor và tám cột VFX sơn.
- `src/components/game/ultimateShowcase.css`: thu gọn banner Adventure ở màn hình ≤360 px.
- `public/assets/characters/spirits5921/`: tám atlas model HD/pixel và một atlas VFX; `spirits5917/ultimate.webp`: VFX cho bốn model cũ.
- `dev/tools/pack-campaign598.py`, `pack-spirit-vfx5921.py`: đóng gói pixel Imagegen và ghi provenance/hash.
- `dev/tools/verify-spirits5910.mjs`, `verify-showcase-modes597.mjs`, `verify-showcase-production597.mjs`: cohort mới, VFX thật, chẩn đoán banner, hero/viewport production và ngày báo cáo thực tế.
- `dev/tests/game/spirits5921.test.ts` cùng ba test manifest/VFX cũ: thêm model, portrait, contact và tám cột effect; cập nhật kỳ vọng VFX không còn bị hoãn.
- `package.json`, `rights/*`, notices, release-size/release-records và `.gitignore`: phiên bản 5.9.21, nguồn asset và báo cáo QA.
- `dev/docs/web-v5921/`: kế hoạch/tiến độ, prompt/hash, inspector, audit và báo cáo browser/build/offline; ảnh QA đã chuyển cục bộ.

Không sửa engine, catalog, dữ liệu kỹ năng/chỉ số, save schema hoặc networking. Không thêm dependency runtime.
