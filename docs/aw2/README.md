# Soul of Meal Adventure World 2 — Next Game

**AW2-016B VERIFIED development slice — Em Đem Nước tuần tra với vị trí tương tác thật.** Bốn hướng/16 tư thế nguyên bản; sprite, nhãn, độ sâu, E, điểm đến native và chỉ đường dùng cùng snapshot. Đi tới NPC giữ vị trí hiện tại; khi cần ký ức nhiệm vụ, em về điểm nhiệm vụ ngay. Menu/hội thoại/ghi lỗi/tải lỗi/mất focus/giảm chuyển động đều dừng tuần tra. Sửa tràn khung chữ lớn, nhãn bị cắt ở mép bản đồ và loại tệp tạm khỏi bản đóng gói AW2.

**110 kiểm tra trình duyệt mới = 55 source + 55 compiled PASS**, bốn viewport/chữ20px, ghi lỗi→thử lại, ba ký ức/80XP, hai mode đi–về, reload, atlas404→khôi phục; không lỗi bất ngờ.22 ca NPC đạt và đã nằm trong lượt hồi quy tổng: **1.687/1.689 ca đạt mặc định; hai mô phỏng cũ timeout20s**, sau đó cả2 đạt với allowance120s, giữ nguyên assertion/seed/loop và nguồn test. Không gọi lượt mặc định là full PASS. Hai typecheck, asset audit, AW2/stable builds đạt. [Cách chơi](NPC_PATROL.md) · [Bằng chứng và ngoại lệ](evidence/AW2-016B.md).

**Demo90% / product≈40%(35–45%) giữ nguyên.** Đây là một NPC locomotion reference, chưa phải full NPC/rights/nghiệm thu độc lập hoặc điện thoại thật; D18/D20/D11 giữ nguyên. Next: preload/rollback khi chuyển vùng, rồi một nội thất có canon/migration riêng. D16 phát triển/push trực tiếp AW2; không product/master/deploy/release/reset. Các bản ghi bên dưới là lịch sử; trạng thái hiện hành theo016B.

**AW2-015B /016A /008B VERIFIED — trận và bản đồ trong khung chơi cố định.** Sảnh/TCG/Auto Chess/boss trên `game.html` đã phân trang cùng44pxcontrols; giữ ghim/trang nhật ký/vùng đang xem qua lượt chơi. Quầy cờ đánh dấu và đếm bản đang có. **Thêm → Bản đồ hành trình** có sáu vùng, vị trí/mục tiêu, cửa mở/khóa và đi bộ tới cửa kế; tự E/Đi qua, không tự dịch chuyển. Registry typed/runtime-validation chiếu sáu map/támNPC/portal/spawn hiện hành, không đổi luật/save/geometry; preload/rollback/nội thất mới vẫn là hợp đồng kế tiếp.

**205ca unit riêng biệt/11files, hai typecheck, AW2+stable builds PASS. 1,016fresh browser checks=508source+508compiled**, gồm501main+7faults mỗi flavor; thêm276source exploration regression tách riêng. Bốn viewport/font16–20px, ván TCG thật có nhắm đích thủ công, cờ xếp quân/giao tranh/sang vòng, hành trình mới đủ sáu vùng→boss45tick→ghi lỗi/thử lại→ghi chép/kết thúc/reload300XP. Tab cũ/atlas404/khôi phục/rút lui đấu lại giữ dữ liệu; không lỗi browser bất ngờ. Fingerprint399inputs `34a7e3e6b138fa00afabf7b768e77faa1bf81c6f2459e32991e0d7dd97a32ad3`; build302files/120,602,933bytes/256runtimeparity, stable851files/177,450,422bytes/72textisolation. [Bằng chứng](evidence/AW2-COMPLETION.md) · [Cách chơi](ACTIVITY_SHELL.md) · [Bản đồ/contract](WORLD_REGISTRY.md).

**Demo90% / product≈40%(35–45%) giữ nguyên**; D20gác nghiệm thu độc lập/điện thoại, D18milestone chưa đóng. D11PROPOSED; không thêm gacha/quyền phát hành/save field/ảnh/nhạc/dependency. Next016B: một NPC tuần tra bằng sprite nguyên bản và vị trí tương tác sống; sau đó preload/rollback và một nội thất có canon/migration riêng. Phát triển/push trực tiếp AW2 theoD16; không master/rpg/deploy/release. Các mục phía dưới là lịch sử; ưu tiên mới theo đoạn này.

**AW2-015A VERIFIED — đã tích hợp đặc tảv1.1 và thêm UI khám phá một màn hình đầu tiên.** [Bản gốc kèm hình](design/world-v1.1/SOUL_OF_MEAL_AW2_MAP_NPC_WORLD_SPEC_v1.1.md) được lưu nguyên22tệp/1,980,952bytes với provenance;23tệp đầu vào/ZIP giữ nguyên ngoài commit. D23chuẩn hóa UI decision bị trùngD13; luồng mới015thay aliasUItrùng012, giữ quyết định5starter và lịch sử tích hợp. [Ma trận tích hợp/hai luồng](WORLD_V1_1_INTEGRATION.md).

Entry mới `/dev/aw2/game.html` có map/HUD/dock cố định, QuestJournal/đội/túi/bếp/địa điểm phân trang, một modal, J/Escape/focus trap và pause giữ nguyên canvas. Dùng cùng save/rules/controller với `/world.html`; không tự nhận thưởng/qua cửa, không tạo Lilia/xu/gacha minh họa.88unit/4files, hai typecheck, build302files/256assetparity/cách ly stable PASS.552fresh browser assertions=276source+276compiled,0unexpected errors,4viewport/20pxtext/intro/2entrysharedprogress/modesreturn/requiredassetfault/exactsave. Source `0936b948db633c66e5539f631e3f8aaf7920fda1`, base `601fed31d9965c883afc14774b123c56f4b272ef`. [Cách mở](GAME_SHELL.md) · [Bằng chứng](evidence/AW2-015A.md).

**Demo90% / product≈40%(35–45%) giữ nguyên.** Đây là migration scopekhám phá/menu opt-in; battle/TCG/Chess vẫn dùng cảnh hiện có, full no-scrollUI cần[015B](tasks/AW2-015B.md). Luồng world chạy theo[016A](tasks/AW2-016A.md) contractmap/portal, rồi[016B](tasks/AW2-016B.md) patrolcó vị trí tương tác thật;008Boverview chuyển vào shell. D17một đại diện map/nămcombat giữ nguyên; D14canon/D11PROPOSED/D18/D20không đổi. Không master/rpg/deploy/release/reset.

Các mốc bên dưới là lịch sử; trạng thái/Next hiện hành theo015A→015B +016A/D23ở trên.

**AW2-008A VERIFIED — hướng dẫn đường theo mục tiêu nhiệm vụ.** Hiện người/đồ vật cần tới, tuyến qua các cửa đang mở và nút đi bộ tới điểm kế tiếp; đủ lựa chọn ký ức, từng bước bếp, boss/ghi chép/đường về Bà. Tới nơi vẫn tự E/Tương tác, không tự qua cửa hoặc nhận quà. Nút khóa theo tải/lỗi cảnh, lưu lỗi/tab cũ và hội thoại; giữ một đại diện map/năm combat. Source `45a54471750961d382c807c338e75248ee261783`, base `045a30c9b796b5b08559e4a78c5e3466fb8cdc48`. [Cách dùng](DAN_DUONG.md) · [Bằng chứng](evidence/AW2-008A.md).

57unit/3files, hai typecheck, AW2build300files/256assetparity/stable isolation PASS.335browser assertion instances=167source+168compiled:305fresh+30current-task prefix đã đạt, không cộng trùng. Source là lượt mới từ tạo save tới boss thật45tick/hai ending; compiled giữ30prefix+138mới từ đúng checkpoint đã ghi sau đổi đội, sửa harness chờ commit/render. [Machine report](evidence/AW2-008A-verification.json).

**Demo90% / product≈40%(35–45%) giữ nguyên.** D20tiếp tục gác010C/011A; next[008B](tasks/AW2-008B.md) bản đồ hành trình sáu vùng. Điều này sửa ưu tiên next-human/phone của006Q, không đóng gate nghiệm thu. Không đổi quest/geometry/save/reward/mode/asset authority, không master/rpg/deploy/release.

Các mốc bên dưới là lịch sử; trạng thái/Next hiện hành theo008A→008B/D20 ở trên.

**AW2-006Q VERIFIED:** Sân Bếp có3hơi bếp+3gợn nước từ2atlas/8frame, tải nhiều sheet đúng vùng với lease/pause/reduced/resume và không đổi save/geometry.282fresh browser assertions/36captures/0unexpected errors; full1588units/types/assets/AW2+stable builds PASS. Source `15c0cd2f6d833191c8b1b00ab392dfd7c0c34880`; [bằng chứng](evidence/AW2-006Q.md). Demo90%/product≈40%(35–45%) giữ nguyên; next independent human+physical phone.

Các mốc bên dưới là lịch sử; trạng thái hiện hành theo006Q ở trên.

**AW2-006P VERIFIED:** ambient006N đã PASS final source/compiled browser acceptance:270fresh assertions,36captures,0unexpected errors. Pixi texture lease nay unload qua asset manager và serialize remount; full1587units/types/assets/AW2+stable builds PASS. Source `84ae0b959e60149335af39e79dd0b1f87ed29d1e`; [bằng chứng](evidence/AW2-006P.md). Demo90%/product≈40%(35–45%) giữ nguyên; next independent human + physical phone, không `rpg`/deploy/release.

Các mốc bên dưới là lịch sử; trạng thái hiện hành theo006P ở trên.

**AW2-006N VERIFIED LOCAL:** hai gợn nước Làng và bốn quầng đèn Phố dùng hai atlas bốn frame, tải theo vùng, chung clock NPC, pause/reduced-motion và unload khi rời vùng. Source `3fc7d536a9a00d0be3b6eade1168470f279d9307`; full1587/1587units, types, assets, AW2/stable builds PASS; final browser/device NOT_RUN. Demo90%/product≈40%(35–45%) giữ nguyên. [Bằng chứng](evidence/AW2-006N.md).

Publication PASS: remote source `112befddc6bf97a1f54fc6eaf8a03c8d5310c3e7`, docs `9e2c5bccf903cb6da3fb8140a519bd2cfb2bd7f2`; exact final tree `d2d9db25c9d8e4ba2f083a530016a66df524ae7c` khớp local và remote.

**AW2-006O — thêm 32 công trình quanh ba khu ngoài trời:** 10 ở Làng, 12 ở Phố, 10 ở Sân Bếp; gồm nhà, tiệm trà/tạp hóa/đèn lồng, quầy bữa sáng, xưởng, bàn chơi và sân chơi. Chín điểm đến đi bộ mới; góc bám nhân vật rộng hơn ở zoom0.65, mái che mờ khi che nhân vật/NPC. Tám NPC vẫn có32frame idle. Source `f7a51673061d5fb1017c3da78d7109cf649ea48b`, base `734cab6086b4ddddf7a8da8e6adf9a5a90af9099`. [Cách xem/ảnh/prompt](KHU_PHO.md) · [Bằng chứng](evidence/AW2-006O.md).

39ca unit riêng biệt/3files, hai typecheck, exactRGBA/8safe frames/repeat10paths, review286files/242asset parity/stable isolation PASS.248kiểm tra trình duyệt mới=124source+124compiled: kiến trúc/điểm đến/che khuất, NPC/pause/reduced, intro/ký ức/host/Dì, hai ending từ checkpoint boss thật, đi–về đủ sáu vùng, từng10atlas NPC/kiến trúc thiếu–khôi phục/exactsave. Cả hai process exit0, không lỗi bất ngờ; chưa có lượt boss mới liền mạch. [Machine report](evidence/AW2-006O-verification.json).

**Demo90% / product≈40%(35–45%) giữ nguyên.**6/6cảnh mở rộng,8/8NPC idle,32công trình là tiến độ hình ảnh riêng; nhà/tiệm mới là phong cảnh, dịch vụ thực vẫn qua NPC hiện có. Không thêm phòng/giao dịch/va chạm/save mới. Một đại diện map/năm combat giữ nguyên. D20gác nghiệm thu độc lập; next[006N](tasks/AW2-006N.md) chuyển động môi trường Làng/Phố. Full characterDoD/rights còn mở; không master/rpg/deploy/release.

Các mốc bên dưới là lịch sử theo source; trạng thái/Next hiện hành theo006O→006N ở trên.

**AW2-006H/J/K — đã bổ sung phong cảnh và điểm đến cho Kho, Phố, Sân Bếp.** Source `8543ad5c309d982ba0e7ae60753371aea384699e`, base `fd1513306ea6cc5052bd08a04eaba666ce07b6cf`. Ba cảnh1536×1024 theo D21, bảng dấu hơi/rương/thùng hàng, đủ sáu NPC Phố và Dì/cổng lối tắt; cả8NPC có hình tham chiếu tĩnh trên map. Camera Bám nhân vật/Toàn cảnh, nhãn và điểm chạm theo cùng góc nhìn. Trạng thái rương đọc biên nhận thực, hint/ký ức/cửa đọc tiến trình; điểm đến chỉ đi tới gần. Một đại diện map/năm combat, luật/save/tọa độ cũ giữ nguyên. [Cách chơi sáu vùng](THE_GIOI.md) · [Bằng chứng](evidence/AW2-006HJK.md).

88unit/7files, hai typecheck, asset audit/review239files/stable isolation PASS.222browser assertion instances=111source+111compiled được xác minh qua chuỗi checkpoint thật trong phiên này:168prefix đã đạt giữ theo hash +54ca tiếp nối cuối, không cộng trùng hoặc gọi là một lượt fresh liền mạch. Intro→modes→ký ức→rương lỗi ghi/thử lại→puzzle/nấu→boss→hai kết thúc/shortcuts→6ảnh thiếu/khôi phục, không sửa flag/HP/save để vượt bước. [Machine report](evidence/AW2-006HJK-verification.json).

**Art tham chiếu3/6→6/6vùng;4vùng có cảnh mở rộng/camera, Lửa/Bàn vẫn là nội thất v1 đơn giản. Demo90% / product≈40%(35–45%) giữ nguyên.** D20tiếp tục gác nghiệm thu độc lập. Tiếp theo [006L](tasks/AW2-006L.md): nâng phong cảnh hai phòng Lửa/Bàn theo D21, rồi chuyển động NPC/môi trường.12kit/12bộ tham chiếu/0fullDoD, full environment/NPC motion/rights chưa đóng. Không reset hoặc cập nhậtmaster/rpg/deploy/release.

Các mốc bên dưới là lịch sử theo source; ưu tiên hiện hành theo006H/J/K→006L, D20/D21 ở trên.

**AW2-006I — làng đã có phong cảnh nhiều lớp theo hình Làng Linh Vị ở mainline.** Source `f0c1be37cef1c83416c5eb76be2943d1e768f2bc`, base `5d3ec842afbeb8518f6da957b78ad04cc59d94da`. Dùng hai ảnh gốc của dự án tại `master` (nhánh mặc định, không có remote `main`) làm tham chiếu: mái ngói đỏ, tre, đèn lồng, cầu/sen/thác, sân gạch và vườn hoa. Cảnh rộng1536×1024 + ba tán cây tiền cảnh, camera bám nhân vật/Toàn cảnh, chạm theo đúng góc nhìn; cây che nhân vật sẽ mờ. Giữ một đại diện đầu đội/năm combat và toàn bộ tọa độ/va chạm/nhiệm vụ/save.72unit riêng biệt/6files,82browser assertions=41source+41compiled, hai typecheck/asset audit/review224files/stable isolation PASS. [Cách xem](LANG_GIAO_UOC.md) · [Bằng chứng](evidence/AW2-006I.md).

Art vẫn3/6zone tham chiếu; **demo90% / product≈40%(35–45%) giữ nguyên**. Nhà/cầu bên ngoài sân là phong cảnh, chưa phải phòng/tương tác mới; full environment/NPC motion/rights còn mở. D20tiếp tục gác nghiệm thu độc lập. Việc tiếp theo là [006HPhòng Kho](tasks/AW2-006H.md) theo cùng phong cách, sau đó Phố/Sân. D21đồng bộ hình ảnh, không đổi tên/canon và không merge `master`/`rpg`.

Các mốc bên dưới là lịch sử theo source; ưu tiên hiện hành theo006I/D20/D21 ở trên.

**AW2-006G — đã hoàn thiện khu khởi đầu Làng Giao Ước theo ưu tiên sản phẩm (D20).** Source `42f36d7c55921e6d2df474640cdfc212151bc4c0`, base `22103f244fc9d9e2bba278977f0cfebcd167407f`. Nền sân, Bà Giữ Chỗ, bàn–mảnh khăn/giếng có ảnh gốc và ba điểm đến native; giữ một đại diện map/năm combat.51unit riêng biệt/60source+compiled browser assertions, hai typecheck/review219files/asset audit/stable exclusion PASS.3/6zone có art tham chiếu, còn Phố/Sân/Kho. **Demo90% / product≈40%(35–45%) giữ nguyên**. D20gác nghiệm thu độc lập/iPhone khỏi công việc hiện tại; tiếp theo[006HPhòng Kho](tasks/AW2-006H.md), không chờ011A. [Cách chơi làng](LANG_GIAO_UOC.md) · [Bằng chứng](evidence/AW2-006G.md).

Các mốc dưới giữ source/bằng chứng lịch sử; Next hiện hành theo006G/D20,010C/011A được gác khỏi ưu tiên triển khai.

**AW2-011B — đã chuẩn bị phiếu phản hồi và mã bản chơi cho lượt iPhone.** Source `eef69e8a0ee7ffe65fed7b9868817cd95a7d23f6`, base `ccb84bae740a05cc091ea68f9e1263ff8580f4df`. Tạo/đọc/sao chép/tải JSON từ màn khám phá; không tự ghi save hay gửi mạng.31unit/2files,100browser assertions trên Chromium+WebKit source/compiled, hai typecheck/review build/stable exclusion PASS. Hành trình mới110assertions=55source+55compiled PASS qua mode/puzzle/nấu/boss/hai ending. Fingerprint279đầu vào khớp cả4bản; WebKit không có JS heap ghi `null`. Hướng dẫn HTTPS/iPhone đã có; điện thoại thật/người chơi độc lập vẫn NOT_RUN, chưa deploy. **Demo90% / product40%(35–45%) giữ nguyên**. [Cách thử iPhone](IPHONE_PLAYTEST.md) · [Bằng chứng](evidence/AW2-011B.md). Next BA/tester010C/011A: lượt chơi độc lập trên cùng artifact HTTPS desktop+iPhone, đóng blocker; D18target100/45 còn mở.

Các mốc bên dưới giữ bằng chứng lịch sử theo source; Next/trạng thái hiện hành theo011B ở trên.

**AW2-013B — hợp nhất lịch sử PR #82 vào AW2, xác nhận `rpg` là nhánh product theo D19.** Source `0e65fc33624f072b026b80da02f2ae90bacc93bc`, base `9596f54b831a588f74d5eec7d08ab122b421a75f`, second parent `c34c6a20dc9755d622117bb594b80e4787b5bf6c`. Đã audit47tệp/30xung đột;14tệp giống hệt,33tệp đã phát triển tiếp trong AW2. Toàn bộ2583tệp ngoài docs/policy giữ nguyên; các chức năng PR đã được tiếp nhận từ013A. Full unit mới **1471/1471ca,120files PASS**, không fail/skip. Type/build/browser006F giữ bằng chứng trong phạm vi không đổi; không có browser/điện thoại mới. Demo90%/product40% giữ nguyên; D18outgoing milestone100%/45% còn nghiệm thu độc lập. PR publication/readback PASS: GitHub closed/merged into AW2 at0e65fc3; [audit](evidence/AW2-013B.md).

**Mục tiêu PR tích hợp kế tiếp (D18): demo 100%, sản phẩm 45%.** Đây là đích nghiệm thu, chưa phải tiến độ hiện tại: baseline vẫn demo90%/product40%. Phát triển tiếp trực tiếp trên `game/adventure-world-2`; chỉ mở PR milestone vào `rpg` sau playtest độc lập toàn hành trình, đóng blocker, nghiệm thu tuyến Phòng Lửa→Phòng Bàn và baseline desktop + ít nhất một điện thoại thật. [Cổng chi tiết](tasks/AW2-014A.md) · [cách tính](PROGRESS.md).

**AW2-006F VERIFIED development slice: Phòng Lửa đã có nền gạch riêng, ba hình puzzle và năm điểm đến native.** Source `4d463302f95a33788ac9cb9c8274f12b18d86281`, base `e7dac41819b71ec881a3511b5aa842369ac5426b` trên `game/adventure-world-2`. Puzzle/hint/cửa khóa/đi hai chiều/reload/nấu-chia bữa đã kiểm chứng bằng thao tác thật; D17một đại diện map/năm combat giữ nguyên. **83ca unit riêng biệt được xác minh (68ca giữ từ lượt đầu +15ca file đã sửa),72browser assertions=36source+36compiled PASS**, hai typecheck/review build/cách ly stable đạt. Hai ảnh mới built-in imagegen; bàn gỗ/dấu lối ra tái dùng ảnh gốc006B/006C. Hai phòng có art tham chiếu, bốn vùng còn debug. **Demo90% / product40%(ước lượng35–45%) giữ nguyên**: tuyến world/UX, người chơi độc lập và điện thoại thật chưa nghiệm thu. Mục tiêu D18 vẫn100%/45%, PR milestone chưa mở. [Cách chơi](PHONG_LUA.md), [bằng chứng](evidence/AW2-006F.md), tiếp theo[010C](tasks/AW2-010C.md)/[011A](tasks/AW2-011A.md).

Nhánh: `game/adventure-world-2`. Incubator tiền đề game riêng, không phải bản patch/đè lên master. Giai đoạn đầu hoàn thiện 12 nhân vật rồi mở lên 16–20; kết nối map, đi tự do, team 5 tự đánh/ultimate thủ công, pixel world + HD anime battle, TCG/Auto Chess trong thế giới kèm quick-entry, khám phá dungeon/rương/nấu ăn.
## Quy tắc
Được reset **AW2 pre-release dev data riêng** sau xác nhận rõ; không clear dữ liệu của game Soul of Meal hiện tại. Kể từ release đầu tiên phải migration save và patch an toàn. 5 tier **N R SR SSR UR**, tách luật 4-tier cũ; tài nguyên/canon legacy chỉ tái sử dụng có chọn lọc.
## Khởi động ngữ cảnh
Đọc `AGENTS.md`, `DECISIONS.md`, `CANON.md`, `STATUS.md`, `BACKLOG.md`, `TEST_LEDGER.md`, `HANDOFF.md` và skill tương ứng. Agent skills là vai trò + tài liệu bền vững, không phải background agents tự chạy.

**Xem nhanh cho chủ dự án:** [REPORT.md](REPORT.md), do `scretary-agent` tổng hợp sau mỗi task. [Phần trăm và cách tính](PROGRESS.md) · [Chơi thử demo](DEMO.md) · [Chạy local từng bước](LOCAL_TEST.md). [HANDOFF.md](HANDOFF.md) ghi chi tiết triển khai và việc bàn giao.

## Quy trình phát triển và push

Theo yêu cầu owner ngày 2026-10-21 (D16), tiếp tục chức năng trực tiếp trên `game/adventure-world-2`, **không tạo branch mới**. Mỗi task hoàn thành: chạy kiểm tra phù hợp, cập nhật tài liệu, commit rồi **push ngay vào `game/adventure-world-2`** và xác minh SHA trên remote trùng local. Quy định này thay thế hướng dẫn feature branch trước đây. Chi tiết lệnh và dọn nhánh đã tích hợp tại [WORKFLOW](WORKFLOW.md), [AW2-012B](tasks/AW2-012B.md).

## Bộ sưu tập và đội hình lưu — AW2-007L

Mở **Đội và túi đồ** trong world. Sau mốc nhiệm vụ, bấm **Mời …** một lần, chọn đủ năm người và nhấn Vân, rồi **Lưu đội hình**. Chọn một người đang ở slot khác sẽ đổi chỗ; Hủy chọn đội giữ bản lưu. Draft không đổi nhân vật đại diện trên map hoặc trận đang chạy. Đội mới áp dụng cho lần bắt đầu boss tiếp theo. Save cũ tải không tự nhận thêm nhân vật/XP; thao tác ghi tiếp theo mới lưu schema5. [Quy tắc/giới hạn](COLLECTION.md). Sau kết thúc chọn đội đồng hành rồi tới Phòng Bàn để **Đấu lại boss · không nhận thưởng** (007M). Gacha vẫn chưa triển khai.

Các bản ghi asset/kit có source cũ dưới đây giữ bằng chứng gốc; nhận định pending inventory/collection được thay bởi STATUS/COLLECTION hiện tại, không đổi canon hoặc nghiệm thu art.

## AW2 development preview — expedition, TCG and Auto Chess practice

**AW2-007H VERIFIED — Liên đã có kỹ năng hồi phục thật và cấp1–20**. Source `5247fd0963f261f156f00d673b0961657182b4af`, base `b4d8d90d9ed6efb0be686bb4e49479cdcf51efab`. Hẹn Sau Cơn Mệt hồi ba nhịp hữu hạn; Mở Lời tẩy đúng một debuff được phép rồi hồi hai nhịp; nội tại cấp kháng một lần ngắt khi thực sự hồi HP cho người còn debuff.1201full unit tests/110files (37new Liên),278browser assertions,60simulations, cả hai typecheck/review+stable builds/isolation PASS.9actual kits/12bộ hình/5starter lưu/0full-characterDoD. Demo≈90% và sản phẩm≈40% (35–45%) giữ nguyên; collection/art/playtest/device/rights/release còn mở. [Luyện Liên](LIEN_PRACTICE.md), [bằng chứng](evidence/AW2-007H.md).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:8443/dev/aw2/index.html`. This standalone development entry does not mount the Soul of Meal app, native bridge or legacy save services. It is excluded from the production entry graph. This entry is the save test screen; the world preview is separate at `/dev/aw2/world.html`. Neither entry mounts legacy gameplay or native save bridges.

Choose **Tạo bản lưu AW2** to initialize `aw2.development.save`, **Lưu thử AW2** to advance its revision, then reload to inspect persistence. **Bắt đầu lại AW2…** opens a modal; each reset requires the exact phrase `RESET AW2` and an explicit final action. Hủy/Escape leaves stored bytes intact. Normal writes preserve invalid/future saves, stale tabs must read again, and failed writes report an error. Confirmed development reset may replace an invalid/future AW2 save as disclosed in the dialog.

Writes require Web Locks and a secure context (localhost or HTTPS); unsupported browsers can inspect/read only. Schema v5 stores world/quest/boss/note/ending, inventory/shared XP/receipts and collection/saved party/Van emphasis. Valid v1/v2/v3/v4 saves upgrade in memory without writing or granting until an explicit action, preserving identity/timestamps/prior progress and legacy data. Ordinary position-save cannot change quest/objectives; locked world/economy actions own reward changes. Future production migrations/native durability remain future work. No operation on this screen clears Soul of Meal saves.

```sh
pnpm test dev/tests/aw2/save.test.ts dev/tests/infrastructure/protectedStorage.test.ts
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm build
# Requires Playwright (or playwright-core) and Chromium available locally:
node dev/tools/verify-aw2-save.mjs --url http://localhost:8443/dev/aw2/index.html
```

The browser tool also accepts `--playwright /absolute/path/to/playwright-core/index.mjs` and `--chromium /path/to/chromium`. It uses a fresh isolated browser profile, seeds test legacy keys, checks reset/conflicts/failures, and writes captures/report under ignored `.asset-work/aw2-001/`. It never uses the owner's browser profile. See [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md) and [handoff](HANDOFF.md).

## World / quest foundation

Open `http://localhost:8443/dev/aw2/world.html`. Click/tap a clear destination, WASD/arrows or hold the on-screen direction buttons; E / Tương tác near an object. D17/006E: only the first member of the committed team appears on the map; the pre-intro Than fallback grants no ownership. Saving a reordered team changes the representative; draft/cancel/failed writes keep the old one. Reread restores the saved position and committed representative. Closing dialogue changes nothing. Explicit actions and Lưu vị trí commit one coherent AW2 save; walking alone remains local until saved. Blur/keyup/pointer release stop movement, and dialogs pause it.

Flow: meet Bà Giữ Chỗ → read the cloth → hand in to unlock five approved N/R starters. Go east to Phố, accept at An, listen to three memories in any order, choose a thread. Accept at Dì, read the hint in Kho, solve the three-step puzzle in Phòng Lửa, then return to Dì to report. Wrong order resets only the attempt. All six zones have safe return routes.

For the fourth quest, explicitly accept **Thêm một chén** at Dì, reach Người Giữ Bàn Quên in Phòng Bàn and choose **Bắt đầu thử thách**. A safe checkpoint is written before combat mounts. The five development starters use persisted team XP to derive actual stats and auto-fight; manual ultimates remain available. The current fresh earned-XP journey wins at tick45; this is development tuning, not final balance. The boss now announces Mời hụt/Tắt bếp and shows Ghế trống protection; see [boss practice](BOSS_PRACTICE.md) for counters. Pause/step/reduced motion and retreat are available. Choose **Lưu kết quả và trở về** after win/loss/retreat. Failed writes keep the live result for retry; another-tab writes require reread. Reload/reread abandons an uncommitted attempt at its checkpoint and never implies a win.

After a committed win, explicitly read **Ghi chép bên chén**, return to Bà and choose either **Để ghế trống chờ** or **Mời cả làng dùng bữa**. Both finish the same quest once, grant its development XP/ingredients atomically and open the reciprocal Sân↔Phòng Bàn shortcut. Closing dialogue does not choose an ending or grant rewards.

Phòng Bàn now uses original reference floor/furniture and native state-aware waypoints; 006C now supplies original note/two-exit floor props in this room, while the other four zones and their NPC/chest objects retain debug visuals;006F adds the adjacent authored hearth floor/three puzzle props and native waypoints. The map representative uses the first saved member’s original world manifest; battles still use all five saved members. Development XP/inventory/chest/cooking are now implemented below. The boss development kit is verified through AW2-007D; full boss motion/world art/audio, independent acceptance of the12 spirit reference sets, final balance/device usability and full AW2-006/008/010 gates remain open.

```sh
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-world.mjs --url http://localhost:8443/dev/aw2/world.html
# Full four-quest/boss/checkpoint/failure/ending flow:
node dev/tools/verify-aw2-world.mjs --boss --url http://localhost:8443/dev/aw2/world.html
```

The world browser script accepts `--playwright` and `--chromium`; fresh isolated profiles only, normal captures under `.asset-work/aw2-006a/`, `--boss` captures/report under `.asset-work/aw2-007c/`. [AW2-006A foundation](tasks/AW2-006A.md), [current AW2-007C task](tasks/AW2-007C.md), [current evidence](evidence/AW2-007C.md), [canon](CANON.md), [handoff](HANDOFF.md). Original schema-v1/v2 evidence remains historical; current save/world results supersede affected ledger rows.

## Persistent progression and separate review build — AW2-013A

Open **Đội và túi đồ** for actual shared EXP/levels/items. Quest hand-in saves progress and reward together. Phòng Kho has a one-time ingredient chest. After completing the third quest, stand near Dì or the opened hearth: cook 1 rice +1 herbs +1 broth into a warm bowl, then share it for 45 team XP. Old saves expose an explicit **Nhận quà … nhiệm vụ đã hoàn tất** catch-up action; loading grants nothing. Failed writes preserve items/receipts; stale tabs must reread. These amounts use `aw2-economy-development-v1`, not final balance.

```sh
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1 --port 8455
# Open http://127.0.0.1:8455/ → compiled world
node dev/tools/verify-aw2-rpg.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/verify-aw2-build.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/simulate-aw2-gacha.mjs
```

`dist-aw2/` is a local review artifact with separate world/save/battle/starter/Than entries and runtime assets, excluding source PNG/code/maps/archives. `pnpm build` still creates the stable game without AW2. No deployment/release. The two new browser verifiers own ports8454/8455; close a manual preview before using8455. Captures stay ignored under `.asset-work/`. [Development contract and fresh evidence](evidence/AW2-013A.md). Gacha simulation is a [proposal for D11](proposals/AW2-005A-RATES.md), with no runtime draw/spend/save.

## Embedded TCG / Auto Chess practice — AW2-009A/B/C

With a ready AW2 save, choose **Ghé nhanh TCG/Auto Chess** from the world, or approach either table in Phố, interact and choose **Ghé bàn**. Both paths checkpoint current exploration before entering. The lobby now opens **Chơi TCG thử** or **Chơi Auto Chess thử**. Both actual borrowed-resource practices are integrated; mode prizes/collected progression are not. Return reads the same checkpoint without another write; changed data requires **Đọc lại hành trình**. Reload abandons the match at its checkpoint. Active world battle/visits block nested entry; no legacy store or schema change.

This supersedes the old AW2-009A subsection that said actual games were not integrated; that statement described its historical transition-only milestone. [Navigation foundation](tasks/AW2-009A.md), [TCG](TCG_PRACTICE.md), [Auto Chess](AUTO_CHESS_PRACTICE.md).

```sh
node dev/tools/verify-aw2-modes.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/verify-aw2-chess.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
pnpm build:aw2
node dev/tools/verify-aw2-chess.mjs --compiled --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
```

Navigation owns/closes source8456/compiled8457, TCG8458/8459, Chess8460/8461. Fresh isolated browser profiles only. [Current task](tasks/AW2-009C.md), [evidence](evidence/AW2-009C.md). Embedded-practice/navigation subset verified; production mode balance/art/persistence/prizes and complete release gates remain open. [AW2-010A](tasks/AW2-010A.md) automated integration gate now passes; independent playtest remains open.

## Deterministic combat core — AW2-007A

`src/aw2/combat` is a development-only pure rules module for one-to-five units per side. It owns movement/range, melee contacts, launched projectiles, auto skills, manual ultimates, interruptions, bounded starter passives and the terminal result. Renderer-facing events describe outcomes that already happened; they cannot apply damage or grant rewards. Numeric stats use `aw2-combat-development-v1` and are not final approved balance.

```sh
pnpm test dev/tests/aw2/combat.test.ts
pnpm test dev/tests/aw2
pnpm typecheck
pnpm typecheck:dev
```

These rules are consumed by the independent preview below and AW2-007C's private world encounter controller. The renderer never applies world results; the save boundary accepts an authentic terminal/retreat bound to its exact checkpoint raw bytes. BATTLE-02's development boss subset is now verified; production/native continuation remains open. AW2-013A adds development numerical rewards through locked save transactions. [Rules task](tasks/AW2-007A.md) · [world integration](tasks/AW2-007C.md).

## Event battle preview — AW2-007B

Open `http://localhost:8443/dev/aw2/battle.html` after `pnpm dev`; verification runners own temporary ports and do not leave a8452 server running. The five approved starters auto-fight with HD reference atlases and can use manual ultimates. Pause, step one tick, choose development levels 1/5/10/20, reset, and enable reduced motion. Choosing a level applies only when creating the next battle; current cards retain their active level/stats. Terminal events clear unfinished visual projectiles. Enemy units temporarily reuse tinted starter atlases and are not finished enemy assets.

The canvas consumes `CombatEvent` presentation state; it does not calculate damage or award outcomes. `aw2-leveling-development-v1` is a deterministic development curve, not approved balance. The standalone page never writes XP, rewards or save data; world encounters now project persisted team XP through the same curve. Audio is opt-in and consumes confirmed events only.

```sh
pnpm test dev/tests/aw2/combat.test.ts dev/tests/aw2/battle-presentation.test.ts
node dev/tools/verify-aw2-battle-browser.mjs --url http://localhost:8443/dev/aw2/battle.html
```

The browser verifier needs Playwright/Chromium and uses a fresh profile. It accepts a package name, file URL, or local Windows/POSIX module path through `--playwright`, and a browser executable through `--chromium`. Current Chromium gate: 22 checks PASS; desktop/mobile/terminal captures inspected. Device/mobile UX/FPS remain open. The separate world boss/save integration and mode transitions now have their own verified development scopes. [Task](tasks/AW2-007B.md) · [evidence](evidence/AW2-007B.md).

## Than asset / animation reference — AW2-004A/C

Open `http://localhost:8443/dev/aw2/than.html` after `pnpm dev`. Eight HD states, four world directions, four skill FX/audio tracks, pause/replay and reduced motion. Audio starts only after opting in. Preview does not access or change saves. World uses the same reference atlases for followers/battle; this manual asset preview itself grants no gameplay outcome.

Five original PNG sources plus two motion PNGs and their lossless WebP counterparts live in `dev/aw2/assets/than/base-v1/`, alongside four synthesized WAVs, exact original `prompts.json`, additional `motion-prompts.json` and `provenance.json`. Runtime metadata at `src/aw2/assets/than.base-v1.json` binds canonical identity/variant/asset/skill IDs to measured frames, foot anchors, timings/contact markers and source hashes. Generated sheet dimensions/spacing were not exact uniform grids; explicit calibrated rectangles preserve complete visible sprites without repainting or mirroring. Alpha edges tolerate at most 8/255 (observed maximum 4/255 on the selected cells).

World has 16 chibi cels: one idle + three authored walking poses per direction, played as a four-step cycle. AW2-004C adds32 HD motion cels (four per eight states); the original eight poses remain reduced-motion frames. Sparse reference clips still need independent art/continuity/contact review. Skill FX has four stages per skill, 16 frames. Than is melee, no projectile substitute. Actual development combat supplies confirmed passive status events; the manual asset preview proc grants no gameplay. Original audio cues are synthetic sounds, not sampled recordings/music. All image creation/repair used built-in `image_gen`, not a CLI/API fallback.

```sh
python3 dev/tools/build-aw2-than-assets.py
python3 dev/tools/verify-aw2-than-files.py
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-than-browser.mjs --url http://localhost:8443/dev/aw2/than.html
```

Build processing requires Pillow (recorded version in provenance); source PNG artwork remains unchanged. Build only encodes lossless WebP, writes atlas/timing metadata and synthesizes the four cues. Browser verification accepts the existing `--playwright` and `--chromium` options; uses a fresh temporary profile and writes captures under ignored `.asset-work/aw2-004a/`.

[Task](tasks/AW2-004A.md) · [evidence](evidence/AW2-004A.md) · [source prompts](../../dev/aw2/assets/than/base-v1/prompts.json) · [provenance](../../dev/aw2/assets/than/base-v1/provenance.json). License remains REVIEW_REQUIRED / commercial release NOT_CLEARED. Than is a reference asset set, not a completed character: five-starter development combat/leveling are verified separately, while full-character/device/human-listening/legal gates remain open. Other four starters now have reference sets through AW2-004B; seven non-starters remain NOT_CREATED. No AW2-010 completion or release follows from these tasks.

## Five starter references — AW2-004B/C/D/E/F

After `pnpm dev`, open `http://localhost:8443/dev/aw2/starters.html`; do not assume an old verification server is still running. Choose Than, Lửa Nhỏ, Lam Lam, Mộc Non or Sương Lành. Selection resets playback/audio opt-in; only selected unit image atlases are loaded. Pause/replay, reduced motion, world directions, eight HD states, four skills, portrait and source links are shared. Missing atlas gives an explicit error and blank canvas. Optional `?spirit=aw2-lam` selects the initial unit.

Historical AW2-004B originals: `dev/aw2/assets/{lua,lam,moc-non,suong}/base-v1/`; each contains four unchanged original PNGs and four lossless WebPs (portrait also serves as identity reference), four WAVs, exact prompts and generation provenance. Canonical manifests: `src/aw2/assets/{lua,lam,moc-non,suong}.base-v1.json`; registry `starters.ts`. Sixteen selected images from nineteen built-in image_gen calls, no external artwork references or CLI/API fallback. Total new WebPs 16,509,218 bytes. Explicit measured cells preserve source art; Sương Lành source rows map down/right/left/up. Mộc Non's faint world gutter permits declared edge alpha 9/255, other sets 8/255; all visible alpha≥96 bounds inset ≥2px.

Current inventory: all five starters (Than/Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành) each have32 additional HD motion cels,160 total. Original reduced poses and source art remain. Lửa Nhỏ basic has contacts at220/380ms with explicit idle recovery; Lam Lam ultimate pulses at520/1040ms. Three ranged basics have separate authored projectile cels/flight and impact cels (launch260/impact700ms). These are reference presentation timings/coordinates, not approved damage/speed/balance or engine hit confirmation. Passives in this preview are manual, while actual development combat supplies authoritative events. Lua actual combat shows only each confirmed basic beat. Lam actual cast/launch suppress outcome FX; independent clocks retain confirmed target impacts and one healing cue per pulse without inventing later effects or reviving expired reduced FX. Moc actual confirmed shields attach at the ally target, passive requires its rules status, and grouped ultimate recipient guards keep their own art. Sương confirmed area pulses group actual same-tick recipients without replaying future contacts; pull statuses add no damage FX. Full character completion remains false for all five.

```sh
python3 dev/tools/build-aw2-starter-assets.py
python3 dev/tools/verify-aw2-starter-files.py
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-starter-browser.mjs --url http://localhost:8443/dev/aw2/starters.html
# Than compatibility:
node dev/tools/verify-aw2-than-browser.mjs --url http://localhost:8443/dev/aw2/than.html
```

Build uses preserved sources, encoder/synth helpers, explicit reference timelines and unit-owned metadata; it never inherits another spirit's mutable motion manifest or generates/repaints art. `--unit moc-non` rebuilds only Mộc Non (also supports lua/lam/suong); scoped repeat-build identity/other-manifest preservation verified through004G. Motion browser `--reuse-originals` skips byte-identical original audio/world tests, `--combat-only` checks only the affected renderer. Follow WORKFLOW selective coverage rather than automatically rerunning unrelated PASS. Browser tools accept `--playwright`/`--chromium`, use fresh isolated profiles and keep QA PNGs under ignored `.asset-work/`. [Task](tasks/AW2-004B.md), [verification](evidence/AW2-004B.md), [handoff](HANDOFF.md). AW2-007C now connects the development canvas to world/save boss progress. AW2-013A now adds numerical loot/cooking and followers; authored enemies/seven remaining spirit sets/full character gates remain open.

## Muối Đen reference inventory —AW2-004J

Current authored spirit inventory is six sets, six absent; supersedes earlier seven-absent inventory statements only for Muối. Open `/dev/aw2/roster.html?spirit=aw2-muoi` after pnpm dev; this shows references, not ownership.007E actual isolated combat is linked separately; world collection remains pending. Original five-starter selector and actual world team remain fixed. Source `7643ec4cb4e1e56d0c1013f7135a065e5ad3af36`. Build only Muối via `python3 dev/tools/build-aw2-muoi-assets.py`, verify with generic file checker plus manifest path; new browser `verify-aw2-muoi.mjs [--compiled] --playwright <module> --chromium <exe>` owns8474/8475. Do not run unrelated starter builders/passing suites automatically. [Gates](MUOI_CHARACTER_GATES.md), [actual007E](tasks/AW2-007E.md), [next004K](tasks/AW2-004K.md).

## Nhiên reference preview —AW2-004K

After `pnpm dev`, open `/dev/aw2/roster.html?spirit=aw2-nhien`. Seven authored sets/five absent; this supersedes earlier six-reference counts only for Nhiên. Four directions/eight HD states, finite two-basic/three-ultimate cues and optional synthesized audio; actual Nhiên combat/leveling is now in007F isolated practice; no ownership/save. `python3 dev/tools/build-aw2-nhien-assets.py` rebuilds only Nhiên with preserved measurement/encoding helpers; `verify-aw2-than-files.py src/aw2/assets/nhien.base-v1.json` is read-only audit. `verify-aw2-nhien.mjs [--compiled] --playwright <module> --chromium <exe>` owns8480/8481. `--remaining-only` exists for documented source alias recovery, not a full preview run. [Gates](NHIEN_CHARACTER_GATES.md), [actual007F](tasks/AW2-007F.md), [practice](NHIEN_PRACTICE.md).

2026-10-23: [Sau boss rematch: một nhóm demo còn lại và bốn gói đề xuất tới product≈50%](NEXT_MILESTONES.md). Điểm hiện tại vẫn90%/≈40%; không tự đóng nghiệm thu người chơi/nhân vật/thiết bị.

006L source publication PASS: `36c2231bafb9de8778f380183780af242cfa9281`, exact staged/fetched tree`51798249d483bf50fa177c2096104fd37eb8c7ac`; all40blobs/4binarySHAs/index/ancestry/expected-head guards verified, non-force update and clean local sync PASS. Clean326input fingerprint remainsc24de0805c292c6d. [Publication proof](evidence/AW2-006L-publication.json). Completion changes documents only; final fresh remote=clean local required before reporting success.

006M source publication PASS: `639609b986389cc7743d977679ca361c010911f8`, exact staged/fetched tree`ac7b7235a3f1908a6834c94ad7286f2b90bb7f1b`; all69blobs/16binarySHAs/index/ancestry/expected-head guards verified, non-force update and clean local sync PASS. Clean361input fingerprint remains12638bb685907682. [Publication proof](evidence/AW2-006M-publication.json). Completion changes documents only; final fresh remote=clean local required before reporting success.
