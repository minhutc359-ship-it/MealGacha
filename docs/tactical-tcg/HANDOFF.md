# Handoff

Nhánh: `game/tactical-tcg`.

TCG-008 hiện hành: `presentation/models.ts` resolve đúng identity, alias6 fixtures, không dùng food/borrow hero.77/139 atlas animated,62 portrait-only. `model-assets.json` là closure data-only cho Vite production config, equality test chống drift; không import runtime graph vào config (browser env evaluation).128 referenced assets,60.2MB source closure, package465files/~108MB dưới180MB. `TacticalSpirit` dùng renderer/shared clock/cache/old poses; `TacticalCombatEffects` đo anchors trong arena và tái dùng BattleVfxCanvas contact override. `transitions.ts` suy ra snapshot deltas/combos, giữ casualty đến hết fall. Controller chờ action duration cả auto/manual, final save vẫn trước presentation. Quiet/system reduced bỏ chờ/VFX. Full2,357/180; focused87/12; both types/release/build PASS. Browser actual summons/attack-hit/ultimate and5viewports PASS; [evidence](evidence/TCG-008.md). Next owner: art/animation cho62 atlas còn thiếu và tester đo device/touch/FPS; không merge/deploy.

TCG-007 hiện hành (05/11): `TacticalTable.tsx`/`tacticalTable.css` là view production khi có cardGame; controller giữ save locks/conflict/reward cũ, view preset cũ chỉ còn tương thích fixture/dev. Bàn fixed 100dvh; màn nhỏ dùng 4 lá/trang và modal đọc/dùng thẻ, màn ngang ngắn có nút Đọc & dùng ở tay. Sidebar nền bị ẩn khỏi bàn/keyboard. Modal Tuyệt kỹ liệt kê quân đủ 100 Hương lực. Placement targets và live attack/HP/shield không lấy chỉ số giả.

`playAutomaticRound` có callback snapshot tùy chọn; kết quả cuối được commit trước rồi view trình diễn các snapshot bất biến và khóa thao tác đến hết. Rời bàn/reload đọc kết quả đã lưu, không mất thao tác hoặc chạy đòn hai lần. Quiet/reduced motion bỏ chờ trình diễn; CSS honoring same preferences. Native trap reveal dùng armed→triggeredRound transition; log địch không lộ tên lá úp.

`deckLibrary.ts`: năm recipes 24 lá/max2 hợp lệ; 3 intro có receipt một lần tặng đủ thiếu tới 2 bản và thêm bộ nếu còn slot (max12). Không đổi active/tiền/tiến trình cũ, không đổi tỷ lệ pack. Hai recipe nâng cao thể hiện thiếu bao nhiêu lá/Tinh Vị; chỉ Lưu & trang bị khi sở hữu đủ. Library công thức mặc định gấp lại để editor nằm ngay sau tab bộ bài.

Verification TCG-007: 2,354/179 full, 84 focused, hai types, release32/774/3, build376 PASS. Browser tác vụ thật và 5 iframe viewport PASS; xem evidence/JSON. QA captures chỉ ở `.asset-work`, không commit. Font/large chunk warnings còn; touch/device/human balance/FPS/audio chưa được nhận là PASS. Không merge/deploy.

TCG-006: bản nguồn xây lại từ `e855a67` sau khi phiên browser chọn tệp bị timeout và workspace tạm bị maintenance dọn. Các kiểm tra cuối được chạy lại: 2,349/178 unit, 79 focused, cả hai typecheck, release records và production/package 376 files PASS. Failure full-suite đầu là source assertion cũ đòi `<GameErrorBoundary>` không có props; đã giữ kiểm tra boundary bằng regex/open+close và chạy lại toàn bộ PASS.

`backup.ts` quản lý export cũ/mới, strict preview, so raw snapshot trước khi import/undo, journal/readback/rollback và khôi phục trước migration. Game reload sau import/undo để các store Rương/profile đọc cùng dữ liệu. Recovery panel vẫn dùng được khi Tactical render lỗi; raw recovery export gồm cả prefix Tactical. Snapshot undo chỉ giữ một lần nhập gần nhất. Không merge nhiều thiết bị hoặc cung cấp server authority.

Checkpoint writes nhận expected checkpoint, so bản lưu trước khi cập nhật; thay đổi wallet độc lập không chặn trận. Home có resume practice/campaign; component cảnh báo trước khi thay trận chưa xong/chưa nhận thưởng. `newTacticalRequestId` dùng UUID nếu có, random bytes+timestamp+sequence ở HTTP/WebView thiếu UUID; không thay đổi odds.

Browser giai đoạn đầu: daily disabled, triệu hồi/chi phí/rút bài, resume+reload, stale-tab reject/read-latest, campaign replace confirm và pack reveal PASS. File chooser timeout, phiên mất và ảnh local bị dọn; native file import/touch/device chưa được nhận là PASS. Kiểm tra cuối tiếp tục sau mốc lưu Git này. Xem evidence TCG-006.

TCG-005 là bản khôi phục vòng TCG thực sau phản hồi prototype sơ sài: `/` mở sảnh; collection/decks/packs/guide đã có route tab. Trận luyện/campaign nhận active deck (24 lá, owned/limit validated), tay đầu 4 lá và sân người chơi trống. Native IDs/art/lore của 181 thẻ được giữ; Tactical text mô tả hiệu ứng đã chuyển đổi, nội tại/công thức có engine authority.

New fields bổ sung trên progress v1, không đổi/xóa key cũ: account/decks/tickets/pity/pack receipts/choices/checkpoint. `ensureTacticalAccount` hồi phục một lần legacy profile và thêm starter. `withTacticalLock` serialize UI writers khi browser hỗ trợ; transaction fallback vẫn là optimistic localStorage, không phải database/server lock. Rương cũ giữ dữ liệu/receipt; gói TCG ở màn riêng. Chưa có UI import backup mới hoặc cloud save.

Luồng thử nhanh: Sảnh → nhận quà ngày → Mở thẻ → lật 5 lá → Bộ sưu tập tìm thẻ mới → Bộ bài sửa/lưu → Luyện tập chọn lá và ô/mục tiêu → Giao chiến/Tuyệt kỹ/Kết vòng → reload checkpoint → Hành trình đọc cảnh trước/sau/nhận reward → Manga. Thử cả 390px dọc/ngang và desktop trên preview thật trước merge.

Local verification hiện hành: 2,337 tests/177 files, 67 focused, hai typecheck, release records và build/package 375 files PASS. 84 mô phỏng chiến dịch bằng public commands (không sửa HP/kết quả) chứng minh có đường đi đủ 8 nút với thẻ kiếm được và lựa chọn ending. Xem evidence TCG-005; đây không là kết quả human balance/playtest.

TCG-003 hoàn tất local: Chest cấp collectible/Tinh Vị exact-once, bẫy/reaction/Tuyệt kỹ dùng được, boss ba pha, merge campaign/PvP đúng số bản, tutorial trận đầu và Manga lazy boundary. Không xóa hoặc ghi đè reward Chest cũ.

TCG-004 hoàn tất local: battle hierarchy, commander HP, boss phase, Vị Linh card/inspector, trap panel, result/log, campaign progress và Chest reward UI đã được đồng bộ; responsive 760/430px và reduced-motion có kiểm tra source/SSR. Vite dev server không khởi động được trong sandbox do `uv_interface_addresses`; production build vẫn PASS. QA hình ảnh/touch trên thiết bị thật chưa chạy.

Kiểm tra trước merge: checkout đúng remote SHA, chạy `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm release:verify`, `pnpm build`; sau đó review `/`, `/?tab=campaign`, `/?tab=manga`, `/chest` ở desktop và mobile.

Không đưa các tệp staging ẩn trong `dev/aw2/assets` vào commit. Không merge hoặc deploy nếu chưa hoàn thành QA thiết bị thật.
