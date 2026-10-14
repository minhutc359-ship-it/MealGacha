# Chứng cứ Web 5.1

- `browser-qa.json`: campaign/dungeon, boss thao tác tay ở 390px, pause/reload, camp và thưởng một lần, không đổi wallet/collection/save cũ; đủ bốn viewport.
- `finesse-qa.json`: đường tuyệt kỹ, focus, liên hương/Sinh trưởng, canvas không dựng lại theo cue (0 width/height writes), ba demo không đổi save. RAF được đo trong SwiftShader, chưa phải FPS điện thoại.
- `pvp-regression/browser-qa.json`: WebRTC thật hai context ở bốn viewport. Khách reload cần một lần bấm nối lại thêm; token, ghế và ID trận vẫn giữ. Bẫy giữ nội dung 2.264–2.267s, che bài/bẫy trong mọi frame.
- `diagnostics/`: timeout ở lần thử PvP đầu, giữ để không che giấu vấn đề nối lại. Driver đạt ghi rõ retry.
- 505 tests / 46 files; app/dev typecheck, catalog 123 món, assets 143 refs/0 missing, release registry 356 assets; production build, SW syntax, size guard và git diff checks.

Ảnh commit là WebP từ PNG của script QA, chỉ đổi encoding để giảm kích thước repo. Chạy lại script sẽ tạo PNG cùng tên; các ảnh không có trong public/dist. Cut-in được chụp với reduced-motion và pause sau khi người chơi bấm chiêu, để giữ tên/ảnh tuyệt kỹ cho kiểm tra bố cục.

Khởi chạy QA với `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR`; PvP thêm `PVP_QA_MODULES` trỏ đến bộ peer server **chỉ dùng cho QA**, không là dependency runtime. Các script tự khởi động Vite trong cùng process/network namespace. Không dùng các script 4.9/5.0 để ghi đè chứng cứ lịch sử.
