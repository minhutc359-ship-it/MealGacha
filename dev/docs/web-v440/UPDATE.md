# Soul of Meal Web 4.4 · Âm thanh, hình ảnh và độ mượt

## Người chơi thấy gì

- Adventure có bối cảnh sân bếp buổi tối mới, ánh sáng đèn lồng và sàn đá. Nhân vật chính dùng atlas 4 hướng × 4 tư thế, theo cùng khuôn mặt/trang phục từ chân dung hiện có. Cây, cỏ và ba loại nhà được dựng lại bằng vector mềm hơn; NPC khác giữ atlas/sprite đang có. Không thay map/collision hoặc vị trí tương tác.
- Đạn kỹ năng, vòng niệm phép, trúng đòn và triệu hồi theo 5 hệ trong Adventure. Thời gian trình bày độc lập với luật chiến đấu; PP/HP/sát thương vẫn lấy từ reducer. Nền và thanh HP rõ hơn, kỹ năng giữ tương khắc dễ đọc. Màn ngang chia bàn đấu và bảng kỹ năng để hạn chế cuộn trang.
- TCG, Auto và Rương có cùng tông ngọc/đồng ấm, ánh sáng và bóng nhẹ. Lớp bụi/lá/mưa/hạt sáng dùng chung Canvas. Giới thiệu vẫn 25 giây, ẩn/hiện chú thích và dùng màn chơi thật; sửa Rương nằm gọn trong màn ngang.
- Bước chân, cửa và thu phục có âm riêng; kỹ năng và chime có phản xạ phòng ngắn, stereo nhẹ. Mixer có master headroom/compressor giảm các đỉnh âm lớn. Rương/quay hưởng mức âm lượng hiệu ứng đã chọn. Soundtrack hiện có được giữ và trộn lại; không tuyên bố thêm một album nhạc mới.
- Lớp môi trường theo nhóm cảnh: nước/gió bến, chợ, bếp và đêm. Volume môi trường độc lập với nhạc; tắt nhạc vẫn có thể giữ môi trường. Tắt âm thanh dừng các voice/timer đang có. Cooldown ngắn giảm các âm trùng lặp dày.

## Độ mượt

- Clock sprite dùng 60 Hz khi có chuyển động chiến đấu và 30 Hz khi idle; mỗi Canvas đọc cùng clock, không cập nhật React mỗi frame. Giới hạn mật độ pixel theo chất lượng.
- Không vẽ sprite ngoài màn hình. VFX Canvas tự bỏ đăng ký khi đã hết thời gian. Bỏ preload hàng loạt ảnh Vị Linh/hiệu ứng trong mỗi lần mount CombatEffects; hình có renderer thủ tục và asset lease riêng.
- Theo dõi khung hình: sau tải chậm liên tục, hạ DPR/chi tiết và nhịp vẽ; phục hồi sau một khoảng ổn định dài hơn để tránh bật/tắt liên tục. Tùy chọn Đồ họa nhẹ luôn được ưu tiên. Hệ thống chỉ thay trình bày, không đổi tick chiến đấu, tài nguyên, phần thưởng hoặc save.
- Rương Pixi nâng nhịp tối đa cho chế độ bình thường, giảm ở chế độ nhẹ; dừng ticker khi tab ẩn và dọn listener khi đóng. Giảm chuyển động giữ đường tĩnh và không bật các lớp môi trường.
- Mount mixer được đếm theo người dùng: đóng demo không đóng AudioContext của màn đang chơi ở bên dưới. Dọn callback/node/timer khi người dùng cuối rời.

## Asset và nguồn

Ảnh tạo bằng `image_gen.imagegen`, tối ưu WebP trong project: [sân bếp](../../../public/assets/tcg/boards/courtyard-v440.webp), [atlas nhân vật](../../../public/assets/adventure/hero-v440.webp). Prompt, reference và cấu hình lưu tại [artwork.json](artwork.json). Hình tham chiếu atlas là chân dung nhân vật chính của project. Vector có source tái tạo [world-symbols.json](world-symbols.json), dùng `build-adventure-assets.mjs`; registry quyền có mục riêng cho atlas mới.

Tham khảo kỹ thuật: [MDN – compressor](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createDynamicsCompressor), [MDN – Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas). Hình/âm thanh là nội dung project, không nhập soundtrack hoặc asset Pokémon.

## Phạm vi và dữ liệu

Web only; không sửa hoặc sync Android/iOS, không build APK. Không đổi save schema, luật gameplay, progression hoặc tài nguyên người chơi. Ngân sách giữ **100 MB**; mã/source/test/prompt/screenshot ở dev không vào dist. Branch mới từ master đã merge PR #33, không tự merge.

## Kiểm chứng

401 kiểm thử / 39 file, typecheck app/dev, catalog/assets và release records. Thêm kiểm tra hysteresis, dữ liệu âm môi trường hữu hạn/bounded, mixer dùng chung, môi trường khi tắt nhạc, coalescing hiệu ứng trùng lặp. Máy local chậm hơn ở các mô phỏng 200 trận/20 hành trình: chạy với 2 worker và timeout 20s; không đổi luật, số kịch bản hoặc assertion. CI vẫn dùng lệnh test mặc định.

Browser QA gồm desktop 1440×900, dọc 390×844 và ngang 844×390; xem dữ liệu kèm theo. Kiểm tra hero/background giải mã, atlas/VFX, đồ họa nhẹ, 4 demo vừa viewport và save trước/sau. Kiểm tra AudioContext thật bằng OfflineAudioContext với nhiều SFX đồng thời. Mẫu clock đo trên Chromium headless là số liệu máy kiểm tra, không bảo đảm FPS trên Safari hoặc điện thoại thật; chưa đánh giá tai nghe/loa hoặc Safari thiết bị thật.

Dữ liệu browser: [browser-qa.json](browser-qa.json). Mẫu nhiều SFX: peak **0,2802**, RMS **0,0208**, hữu hạn và dưới 1. Mẫu clock chung trong cảnh đang có trên software-render Chromium: **32,5 callback/giây**; đây không phải bằng chứng toàn bộ game chạy 60 FPS.

Ảnh chụp QA bản đồ Adventure và trận màn ngang có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.

Build sạch cuối: **64.407.117 byte / 100 MB**, JS gzip **609.995 / 650.000 byte**, CSS gzip **90.578 byte**, 429 file, 0 leak. Có 330 asset được ghi trong registry; kiểm tra 134 tham chiếu không thiếu file. Hai ảnh game mới thêm khoảng 583 KB dữ liệu nén; SVG bản đồ giữ nguồn dựng lại.
