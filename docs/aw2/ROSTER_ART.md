# Danh mục 12 bộ hình AW2

2026-10-23 · Có đủ **12/12 bộ tham chiếu (100%)**. Mỗi nhân vật có portrait, chibi bốn hướng (16cels), tám trạng thái HD (32cels), FX và bốn cue âm thanh riêng. Đây là tài nguyên tham chiếu đã tích hợp và kiểm tra kỹ thuật; **0/12 nhân vật đạt full-character DoD**.

Chạy `pnpm dev`, mở http://localhost:8443/dev/aw2/roster.html rồi chọn nhân vật để xem world/HD/skill, tạm dừng, giảm chuyển động hoặc bật âm thanh. Muốn xem bản build: `pnpm build:aw2` rồi `pnpm exec vite preview --config dev/vite.aw2.config.ts`, dùng địa chỉ do Vite hiển thị.

| Nhân vật / ID | Tier · món ăn | Portrait gốc | Manifest |
|---|---|---|---|
|Than / aw2-than|N · Cơm tấm|[PNG](../../dev/aw2/assets/than/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/than.base-v1.json)|
|Lửa Nhỏ / aw2-lua|N · Bánh mì|[PNG](../../dev/aw2/assets/lua/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/lua.base-v1.json)|
|Lam Lam / aw2-lam|N · Phở|[PNG](../../dev/aw2/assets/lam/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/lam.base-v1.json)|
|Mộc Non / aw2-moc-non|R · Gỏi cuốn|[PNG](../../dev/aw2/assets/moc-non/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/moc-non.base-v1.json)|
|Sương Lành / aw2-suong|R · Bánh cuốn|[PNG](../../dev/aw2/assets/suong/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/suong.base-v1.json)|
|Muối Đen / aw2-muoi|R · Muối rang|[PNG](../../dev/aw2/assets/muoi/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/muoi.base-v1.json)|
|Nhiên / aw2-nhien|SR · Bún bò|[PNG](../../dev/aw2/assets/nhien/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/nhien.base-v1.json)|
|Hải / aw2-hai|SR · Canh chua|[PNG](../../dev/aw2/assets/hai/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/hai.base-v1.json)|
|Liên / aw2-lien|SR · Chè sen|[PNG](../../dev/aw2/assets/lien/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/lien.base-v1.json)|
|Mộc / aw2-moc|SSR · Cốm|[PNG](../../dev/aw2/assets/moc/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/moc.base-v1.json)|
|Bách / aw2-bach|SSR · Bánh chưng|[PNG](../../dev/aw2/assets/bach/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/bach.base-v1.json)|
|Vân / aw2-van|UR · Bữa ăn thất lạc|[PNG](../../dev/aw2/assets/van/base-v1/portrait.png)|[base-v1](../../src/aw2/assets/van.base-v1.json)|

Đợt hoàn thành mới: Hải/Liên/Mộc/Bách/Vân có25ảnhPNG được chọn,25WebP lossless,80world+160HD+80FX cels và20cue âm thanh tổng hợp.27lượt image_gen, haiHD Hải bị loại vì vùng cắt,25output được dùng; prompt/nguồn/hash nằm trong từng thư mục. Năm bộ mới chiếm29,527,308byteWebP; nếu giải mã đồng thời năm bộ,157,264,128byteRGBA (trang chỉ tải bộ đang chọn). Toàn roster có384motionHD cels; các starter còn giữ pose tham chiếu gốc cho reduced motion.

Source cohort `PENDING_COHORT_SOURCE`, Hải57b160f. [Evidence Hải](evidence/AW2-004L.md), [evidence bốn bộ cuối](evidence/AW2-004M-P.md). Bảy kit chiến đấu hiện có và năm starter sở hữu giữ nguyên; năm bộ mới chưa có kit/leveling/collection. Art/continuity/listening/playtest/device/rights/release cần nghiệm thu riêng. Demo≈90%, sản phẩm≈40% (35–45%), giữ nguyên vì danh mục tài nguyên không đo hoàn thiện toàn game. Next BA/mechanic xác lập actual Hải kit; character/animation duyệt art độc lập.
