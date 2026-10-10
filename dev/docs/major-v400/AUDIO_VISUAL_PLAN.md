# 4.0 — Brief soundtrack, sân và hiệu ứng

Nghiên cứu ngày 10/10/2026. Không có nhạc, CG, animation hoặc engine 4.0 mới được thêm vào sản phẩm trong PR này. Các mốc thời gian/số lượng là brief để làm mẫu, cần nghe/chạm/đo trên thiết bị thật.

## Art direction và background

Giữ anime 2.5D, ánh sáng bếp ấm và đồ dùng Việt; quân và trạng thái nổi hơn tranh nền. Không vẽ một nền 4K chứa mọi chi tiết rồi đặt UI lên trên. Một arena cần manifest các layer, vùng không đặt tiền cảnh, chân nhân vật và clip; DOM UI vẫn xử lý nút, tay bài, menu và accessibility.

| Sân | Lớp xa / sàn / tiền cảnh | Chuyển động nền | Biến thể dùng lại cho truyện |
| --- | --- | --- | --- |
| Chợ Đêm | Mái sạp tối / gạch và vòng khắc / đèn tre ngoài mép | Một nhóm đèn, 2–3 làn hơi nhỏ, bóng mềm | Chợ có hai giọng; màu bình minh đổi tint, không thêm một ảnh lớn |
| Bến Ký Ức | Bến mưa / sàn gỗ / mái hiên ngoài vùng chọn | Ripple ít vùng, sợi dây thuyền, mưa cục bộ | Bến sau cơn mưa; chuyển pha boss đổi ánh sáng/vùng, không che ô |
| Bếp Đoàn Viên | Cửa bếp / mâm và sàn / khung tre hai góc | Hơi nồi, ánh bếp và bụi nhẹ | Bữa cơm ngày mai; dùng lại góc cắt làm tranh thoại |

Nền chính đề xuất 1280×720 hoặc 1440×810 WebP; chọn kích thước từ vùng hiển thị thật và kiểm tra chữ/nhân vật, không tăng theo DPR một cách máy móc. Layer nhẹ có thể dùng hình nhỏ, gradient/pattern code và tint. 3 CG mới là phần tùy chọn; mẫu đầu dùng crop nền có sẵn để ngân sách dành cho chuyển động nhân vật.

Đầu tiên 4 nhân vật + 1 boss. Sau khi mẫu đạt, mở đến 12 nhân vật ưu tiên + 2 boss. 24 frame/model là mục tiêu trong proposal; thử 192 hoặc 256 px/frame theo kích thước quân trên điện thoại. 24 frame 256² có **6 MiB RGBA/model** trước padding/texture copy; 14 model tương đương 84 MiB nếu cùng resident. Vì vậy manifest/cache phải tải nhóm dùng trong scene, không preload đủ pack. Neo chân và vùng va chạm không đổi qua frame/mirror.

Không dùng tranh concept như bằng chứng animation đã đẹp. Asset sheet phải đi qua kiểm tra hình dáng, alpha halo, crop, frame nối, silhouette và tính nhất quán dụng cụ. Nếu 24 frame không giữ được chất lượng hoặc byte budget, giảm số model đợt đầu; không nhân frame gần giống chỉ để đạt số lượng.

## Soundtrack có danh tính riêng

Đề xuất một motif gốc khoảng 4 nốt cho **lời mời**, biến tấu nhịp/hòa âm theo vùng. Không chép motif hoặc sample từ TFT/Pokémon hoặc bản ghi dân gian chưa rõ quyền. Có thể gợi chất tre, gốm, dây gảy và tiếng bếp bằng synth hoặc bản thu có quyền rõ ràng; không gọi synth là một bản trình diễn truyền thống chính xác.

| Cue family | Cảnh và cảm xúc | Nhịp thử | Cấu trúc và điểm chuyển |
| --- | --- | --- | --- |
| Mở cửa bếp | Hub/đọc truyện, có chỗ cho người tới | 76–84 BPM | Theme ấm; nhiều khoảng nghỉ để đọc |
| Hai giọng trong chợ | Prepare/TCG vùng chợ | 96 BPM | Groove nhỏ, motif đối đáp; tăng lớp khi combo thực giải quyết |
| Bến sau cơn mưa | Khám phá/Ủ vị | 84 BPM | Âm nước và dây; motif chưa kết, resolve ở lượt chờ |
| Giữ bàn tới sáng | Auto combat/boss | 112 BPM | 3 stem đồng nhịp, lớp áp lực/pha; không đổi BPM theo ×3 |
| Trang sổ tự sửa | Boss truyện | 96–112 BPM | Motif bị cắt ở nhịp đầu, trở về đầy đủ khi phá quy tắc |
| Bữa cơm ngày mai | Kết cảnh mới | 76–84 BPM | Coda lời mời; 2 ending cũ có sắc phối khác, không một ending bị coi là thua |

Đây là 6 **họ cue**, không mặc định 6×2 style×3 stem là 36 file mới. Dùng lại theme original/8-bit 3.5 và chỉ làm mới một họ combat 3 stem trong mẫu đầu. Hai phong cách có cùng BPM, cue, độ dài và loop boundary. Nhánh thoại dùng biến thể hòa âm/coda ngắn, không cả soundtrack riêng.

### Stem, decode và dung lượng

Mỗi họ combat có nền, lớp nhịp và lớp áp lực. Manifest ghi BPM, bars, số kênh, loopStart/End, gain, file bytes, decoded bytes và bằng chứng nguồn. Schedule theo `AudioContext.currentTime`, đổi gain tại đầu bar với hysteresis, không dùng timer render để giữ nhịp.

Ví dụ **8 bar, 4/4, 96 BPM = 20 giây**. Ở AudioContext 48 kHz, nền stereo + 2 stem mono dùng khoảng **15,36 MB PCM float**; hai họ cùng resident/crossfade khoảng 30,72 MB trước SFX. 16 bar làm con số này gấp đôi. Số kênh và sampleRate thực sau decode quyết định RAM; giảm bitrate MP3 chỉ giảm tải mạng, không giảm tương ứng PCM.

Ở bitrate minh họa 64 + 32 + 32 kbps, một họ 20 giây khoảng 320 kB, 2 style khoảng 640 kB trước metadata. Đây là tính toán, chưa phải chất lượng mix hoặc size encoder đã đo. Ba họ mới đã khoảng 1,92 MB trước ambience/stinger, có thể vượt phần tăng audio 850 kB trong budget ban đầu. Do đó bản 45 MB chỉ làm một họ mới và tái dùng theme khác; pack nhiều soundtrack cần ngân sách có số đo như [WEB_AND_ANDROID](WEB_AND_ANDROID.md).

Giữ một AudioContext, buses music/effects hiện có; thêm ambience tách volume. Cache có trần byte tính cả buffer còn được source giữ. Stem của scene đang phát có lease; hết lease mới evict. Hạn decode đồng thời và request epoch để không tải/xuất hiện nhạc của cảnh đã rời. Cache 2 bài hiện tại không đủ làm trần bộ nhớ cho stem.

### Mix và SFX

Mốc mix thử: nhạc integrated khoảng −18 đến −16 LUFS, peak tổng dưới −1 dBTP; không chỉ kiểm tra từng file. Đây là mục tiêu nghe thử, không tuyên bố mọi bản hiện tại đạt. Duck khoảng 3–6 dB khi thoại/stinger nếu giúp rõ; không ép volume hoặc tự bật âm. Nghe trên loa điện thoại, tai nghe có dây/Bluetooth và cả original/8-bit.

Chọn 2–3 biến thể nhẹ cho chém, ném, niệm, heal, vỡ chắn, hạ gục; ưu tiên boss/recipe/result khi nhiều event. Variation dùng RNG presentation riêng. Giữ giới hạn source, cooldown theo thời gian thực và cleanup panner hiện có. Một cue synth có thể tạo nhiều source, cần tính đúng. Khi ×3, giữ nhịp nghe dễ hiểu; bỏ bớt hit trang trí, không phát gấp ba lần toàn bộ âm.

Audio unlock sau thao tác, mute/volume giữ qua reload, tab ẩn dừng/suspend và resume không phát lại buffer event cũ. Không tự bật nhạc khi người chơi chọn style. Safari/WebView interruption phải có trạng thái “Chạm để bật âm” nếu cần, kiểm chứng bằng thiết bị thật.

## Hiệu ứng mượt và có thông tin

Simulation Auto vẫn 20 tick/giây. Nội suy vị trí, animation và VFX theo presentation clock; HP/damage/death theo event đã commit. Mốc tiếp xúc của clip phải khớp hit. Không trì hoãn gameplay để chờ animation hoặc quay camera, không dùng camera để quyết định vùng đánh.

| Event | Timing thử cho presentation | Khi reduced motion / nhẹ |
| --- | --- | --- |
| Chọn/nhấc quân | 80–120 ms viền và bóng | Viền tĩnh, vẫn đọc ô hợp lệ |
| Đòn thường | Chuẩn bị ngắn → contact → vệt tan 120–180 ms | Flash nhẹ + số gần mục tiêu |
| Cast lớn | Dấu nguồn 150–250 ms; vùng/cue theo engine | Vùng và icon giữ ổn định |
| Recipe | Nối nguồn 250–400 ms, banner tên thưởng | Tên và thưởng, không zoom/rung |
| Ủ vị | Icon chờ + 1 lượt; nở/gỡ đúng event | Icon, số lượt và đối sách không mất |
| Boss telegraph | Vùng được báo rõ trước nhịp giải quyết | Viền/pattern + label; không chỉ khác màu |
| Thắng/thua | Pose/stinger → kết quả, có bỏ qua | Pose tĩnh, nút nhận thưởng luôn tới được |

Timing chỉ là thử nghiệm, phải phù hợp engine/cue hiện có; không làm telegraph giả kéo dài hơn cửa sổ hành động. Hit-stop nếu dùng chỉ hold pose 40–60 ms ở đòn nổi bật, không dừng tick Auto. Không blur toàn atlas, không tạo gradient/filter cho mọi actor mỗi frame. Nhãn HP/trạng thái ở lớp riêng; có cap số nhãn và particles, thu hồi đúng TTL/unmount.

Mục tiêu p95 frame normal ≤20 ms, nhẹ ≤35 ms, input ≤100 ms trên thiết bị mục tiêu; cần đo distribution 15 phút, không suy từ FPS trung bình 3 giây. WebGL chỉ được chọn sau khi adapter Canvas/Pixi cho cùng kết quả seed, drag projection đúng và context-loss fallback dùng được. Giảm chuyển động độc lập quality, tôn trọng hệ thống và tùy chọn trong game.

## Asset, quyền và nghiệm thu

Mỗi file mới có SHA-256, nguồn/generator, quyền đầu vào và manifest đúng như `release:records`; file thử không lọt `public/`. Không đưa metadata prompt, ảnh chứng minh hay test vào dist. Crossfade/mute/style lỗi có fallback nhạc cũ, không cản combat hoặc sửa save.

Nguồn kỹ thuật: [PixiJS performance](https://pixijs.com/8.x/guides/concepts/performance-tips), [MDN AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer), [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Các số budget/timing/mix ở đây là quyết định thiết kế riêng, không phải bảo đảm của các thư viện.
