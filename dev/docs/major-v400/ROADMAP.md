# Roadmap và nghiệm thu 4.0

**Roadmap nghiên cứu được giữ để đối chiếu acceptance.** Trạng thái triển khai hiện tại xem [IMPLEMENTATION.md](IMPLEMENTATION.md); các gate máy thật/nghe thật/Play không được tính đạt chỉ từ build và headless. Auto mới dùng rules7 để giữ nguyên run rules6 đã lưu. Không tự merge.

## Mẫu đầu cần chơi được

Mẫu tập trung vào **Chợ Đêm**: 4 nhân vật hiện có có clip tốt hơn, 1 boss, sân nhiều lớp và UI giữ vị trí thao tác. TCG có một lá Nêm vị/một lá Ủ vị thử nghiệm trong trận rules mới, một ví dụ combo 3.5 được giải thích đúng. Auto chess có 2 augment mới để so sánh đường build. Một theme với 3 lớp nhạc/cue, giữ original/8-bit và preset nhẹ.

Mẫu này cần giữ save 3.5, có switch Canvas/Pixi, seed tái lập và nghe/chạm được trên thiết bị mục tiêu. Asset mẫu tạm chỉ dùng để kiểm tra chuyển động phải được ghi rõ; chưa mở rộng toàn roster trước khi chất lượng mẫu được duyệt bằng trải nghiệm thật.

## Thứ tự PR

| Mốc | PR dự kiến | Nội dung review được | Gate để đi tiếp |
| --- | --- | --- | --- |
| 0 | `fix/save-recovery-before-v4` | Recovery loader, snapshot/journal, writer guard và fixture 3.5 | Load lỗi không tạo autosave mới; import/ghi lỗi/old-tab có đường phục hồi |
| 1 | `feat/living-market-render-slice` | Adapter scene, một sân, 4 clip, clear labels và Canvas fallback | Thay renderer không đổi kết quả seed; input/drag/pause/context loss đạt |
| 2 | `feat/tcg-seasoning-and-steeping` | Lookup rules 350/400, 2 keyword và 2 lá mẫu, preview/AI/coach | Trận/chuyến cũ tiếp tục đúng luật; lựa chọn/trigger/load không lặp |
| 3 | `feat/autochess-tactical-promises` | Rules 6, 2 augment mẫu, offer/boss recap | Pool/RNG/ý chí/retry/điểm đúng; có matchup và gợi ý dựa event thật |
| 4 | `feat/adaptive-market-audio` | Mixer theo byte, 3 stem, SFX variants/ambience | Nghe thật, autoplay/lifecycle, clipping/cache/×3 đạt |
| 5 | `feat/v4-content-and-art-pack` | 8 thẻ hỗ trợ, 6 augment mới, 12 model/2 boss/3 sân, 9 màn truyện + 6 đợt Auto nối | Mỗi phần đi qua budget và playtest; không làm chết đường build cũ |
| 6 | `release/v4-acceptance` | Release notes, hồ sơ asset, production QA, benchmark và migration matrix | Các gate bên dưới đều có bằng chứng; lúc này mới bump 4.0 |

Mốc 1–4 có thể review theo phần nhưng không bỏ mốc 0. Không dùng PR đồ họa để đổi kinh tế/ngẫu nhiên/schema gameplay; không dùng PR cân bằng để tăng budget mà không có profile. Âm thanh/VFX chỉ trình diễn state đã commit.

## Backlog có đường code và acceptance

| ID | Công việc | Điểm chạm chính | Phụ thuộc | Acceptance cụ thể |
| --- | --- | --- | --- | --- |
| S01 | Loader phân biệt thiếu/lỗi/future save | `src/game/storage.ts`, `useGameStore.ts` | — | Save JSON sai, card/rules chưa hỗ trợ giữ raw; thao tác ghi bị chặn, có export recovery; thiếu save thật sự vẫn tạo game mới |
| S02 | Snapshot/journal và write revision | storage/repository, `transferBundle.ts`, `fullBackup.ts` | S01 | Quota fail/refresh giữa commit không trộn hai hồ sơ; old-tab overwrite không xóa snapshot 4.0; hai writer mới phát hiện xung đột |
| S03 | Catalog/resolver theo rules | TCG catalog/battle/expedition/coach; Auto catalog/combat/economy | S01–S02 | Bản lưu thiếu rules TCG dùng 350; mọi lookup chạy đúng version; run Auto rules 1–5 giữ RNG/pool/offer cũ |
| R01 | Scene adapter và quality policy | `AutoBoard.tsx`, `BattleVfxCanvas.tsx`, assets; module adapter mới | S01 | TCG/Auto events sang presentation, không sửa combat/save; một ticker, unmount dọn hết; reduced motion độc lập quality |
| R02 | Mẫu WebGL và Canvas fallback | renderer mới, `AutoBoard.tsx`, `BattleBoard.tsx` | R01 | Context init fail/loss có fallback; resize/dọc↔ngang không đổi ô chọn; UI còn usable khi GPU tắt |
| R03 | Resource manager theo byte | `characterSprites.ts`, atlas manifest; cache mới | R01 | Dedupe load, chỉ evict resource không có lease; đổi ba mode 20 lần không tăng cache mãi; missing asset có fallback rõ |
| R04 | Clip và stage Chợ Đêm | sprite manifest, animation resolver, sân/layer | R02–R03 | 4 model neo chân đúng, không crop khi flip; cast/hit/death đúng event; HP/tên không bị FX che |
| T01 | Nêm vị và command/preview | TCG types/schema/battle/card view/coach | S03 | Hai nhánh khác result; cancel không tiêu bài/mana/RNG; action thật khớp preview, một lần trigger/phép, một recipe phù hợp |
| T02 | Ủ vị và đối sách | TCG pending effects/schema/battle/AI | T01 | ≤2 pending/phe; resolve đúng lượt/thứ tự một lần; gỡ/chết/full heal/game over có luật; reload/import ở đầu lượt không trigger lần hai |
| T03 | Deck roles và nhóm thẻ chủ lực | `deckStrategy.ts`, `DeckBuilder.tsx`, `cardAbilities.ts` | T01–T02 | Tìm/giải thích vai trò từ catalog thật; starter hợp lệ; mô phỏng combo/hay dead hand có seed; thẻ cũ đổi behavior vẫn có legacy resolver |
| T04 | Encounter/relic thám hiểm | `expedition.ts`, encounter/narrative/progression | S03, T02 | Đề nghị/thay bài lưu theo seed; skip reward hợp lệ; giới hạn thưởng ngày giữ nguyên; chuyến cũ vẫn đủ node và đến kết thúc |
| A01 | Rules 6 và 2 augment mẫu | Auto types/schema/catalog/combat/economy | S03 | Cap cooldown tick; không recursive mana/heal/extra cast; offer có lựa chọn dùng được, không reroll free ngoài luật |
| A02 | Recap và boss telegraph | Auto events, panels, AI/gợi ý vị trí | R01, A01 | Damage/heal/shield dựa event; preview vùng khớp hit; gợi ý không tự mua/xếp/tiêu vàng; result/retry không thêm điểm |
| U01 | Mixer/stem cache và cue priority | `gameAudio.ts`, `soundscape.ts`, `audioScore.ts` | R01 | Byte budget tính cả voices; một context; stem schedule theo audio clock, ×3 không đổi BPM; mute/visibility không phát lại event |
| U02 | Theme và cue gốc cả hai style | composer, audio manifest, release records | U01 | Loop không click, 3 stem đồng nhịp, nghe loa/tai nghe; peak/clipping tổng mixer được ghi; request lỗi thời không đổi cảnh |
| C01 | Mở rộng content/asset | catalog/manifest/public/rights | R04, T03–T04, A01–A02, U02 | Đạt số lượng ở proposal bằng asset được dùng thật, có profile và provenance; không asset placeholder lọt release |
| Q01 | Balance, production và thiết bị | tests/benchmark/browser harness/release | T01–C01 | Ma trận save/gameplay/presentation/lifecycle đạt, có báo cáo giới hạn; budget hiện có vẫn pass |

Tên module mới ở bảng là dự kiến, không phải file đã tồn tại. Đọc hướng dẫn repo và current `master` trước từng PR vì số liệu ở tài liệu này chỉ gắn với baseline đã nêu.

## Luật Ủ vị cần khóa trước khi viết code

Hiệu ứng gắn đơn vị chỉ resolve khi UID mục tiêu còn sống/hợp lệ; hiệu ứng toàn đội lấy chủ tướng làm owner, không đòi một spell đã giải quyết phải còn trên sân. Phép gỡ chọn đúng một pending effect; không hủy toàn bộ lượt của địch. `executeRound` dùng lượt của owner, không tính số lần animation/tick.

Mỗi effect có `consumed`/receipt; thứ tự resolve theo sequence. Nếu một effect khiến trận kết thúc, các effect chưa giải quyết dừng theo luật; không hồi sống chủ tướng đã thua. Không hoàn tiền vì bị counter. Nếu pending đầy hoặc target không hợp lệ, command bị từ chối **trước** tiêu bài/mana. AI/preview dùng cùng các kiểm tra này.

## Thử cân bằng trước khi mở đủ nội dung

TCG: bốn archetype trong proposal, starter và deck đối sách được chạy vòng tròn với seed/đổi bên. Bắt đầu 200 seed/matchup với agent heuristic có phiên bản, ghi win rate, số lượt, timeout/cycle guard, combo/keyword được dùng và dead hand. Test riêng alpha card mạnh/yếu; tỉ lệ gần 50% giữa AI giống nhau không chứng minh cân bằng cho người.

Auto chess: ít nhất 12 đội hình đại diện, gồm dồn hệ, đa hệ, caster, tank/heal, reroll carry và XP/carry đắt. Chạy 100 seed/matchup, giữ board/cấp/sao/trang bị/augment rõ; đổi vị trí và từng augment riêng để hiểu counter. Reroll/economy cần mô phỏng cả phiên, không chỉ final board. Thử loop heal/khiên/khống chế dài và overtime thay vì cắt trận bằng timeout giả.

Các ngưỡng trên là kích thước thử khởi đầu; điều chỉnh bằng độ biến thiên/thời gian mô phỏng. Đánh cờ chất lượng khi một nhóm áp đảo phần lớn matchup hoặc một lựa chọn bị bỏ qua ở mọi tình huống; không ép mọi cặp 50/50 vì còn counter. So sánh với 3.5 theo cùng agent/seed và ghi rõ khác biệt rules.

Playtest đề xuất 5–8 người trước release, có người mới và người đang chơi 3.5: chơi TCG/Auto rồi tự giải thích combo, vì sao thua và đã đổi gì khi retry. Quan sát thao tác không gợi ý; kiểm tra họ nhận ra ít nhất hai đường build. Đây là kế hoạch tuyển thử, chưa có người tham gia hay số liệu hoàn thành. Không gửi lời mời/tin nhắn khi chưa được yêu cầu.

## Ma trận giữ tiến trình

| Fixture/tình huống | Bất biến cần so sánh trước/sau |
| --- | --- |
| Hồ sơ 3.5 đã chơi lâu | Cards/copies/foils, deck/activeDeck, xu/tinh chất/XP/vé, pity, màn, lựa chọn, quest receipts và Rương |
| TCG giữa lượt/expedition | ID, deck/hand/board/health, RNG, round, node/route/relic, reward/settled; không replay AI hay đổi luật |
| Nêm vị/Ủ vị | Selection chưa commit không tiêu tài nguyên; đã commit thì pending/branch/receipt còn đúng sau reload/import |
| Auto prepare/combat | rulesVersion, seed/rng, pool/shop, quân/sao/ô/dự bị/đồ, vàng/XP, tick và activeTicks |
| Survival 3/1/0 ý chí | Thua 1, thắng không hồi, retry cùng wave; 0 kết thúc/ghi điểm một lần; migration marker không đổi lần hai |
| Campaign/Daily | Campaign trừ theo địch còn sống và retry; Daily thua là hết lượt; quá 55 s vẫn ×3 đến khi có kết quả |
| Result/reward/history | `paidWaves`, `settled`, `finished`, claimed rewards; import/click lặp không thêm điểm/Ấn/xu/thẻ |
| MGC1/ZIP | Nén/không nén, code cũ, corruption, clipboard denied, ảnh/check-in; dữ liệu lỗi không thay bản chính |
| Ghi lỗi/xung đột tab | Quota, storage blocked, interruption và binary cũ ghi lại key; snapshot recovery còn nguyên, không merge state chiến đấu |
| Rollback | Renderer/audio rollback dùng cùng reader/rules mới; tiến trình chơi sau update được giữ |

Fixture chứa dữ liệu giả lập, không commit save thật hoặc thông tin hồ sơ riêng của người chơi. Hash toàn bộ save không phải luôn bất biến vì `updatedAt`, day rotation và migration marker có thay đổi hợp lệ; so sánh các trường gameplay/receipt, giải thích mọi delta cho phép.

## Gate presentation và web

| Nhóm | Thử và bằng chứng |
| --- | --- |
| Viewport/touch | 320×568, 390×844, 844×390, 1366×768; tay 8 lá, 9 quân/dự bị, shop đầy, drag/hold/cancel, dialog không che xác nhận |
| Điều kiện khắc nghiệt | Boss, 18 actor hoặc summons thực tối đa engine cho phép, nhiều hit/heal/cast, ×3, xoay lúc cast, pause lúc hit, skip kết quả |
| Thiết bị | Safari trên iPhone 12/iOS 17.7.x, Android RAM 4 GB/Chrome, desktop Chrome/Firefox, Safari hiện hành; OS/browser ghi rõ |
| Giảm chuyển động | Theo hệ thống hoặc bật trong game; thông tin pending/HP/telegraph/recipe vẫn có; không ép preset đồ họa thấp |
| Audio | Unlock mới, mute/slider/style, headphone/Bluetooth/cuộc gọi, tab ẩn 5 phút, lockscreen, context suspend; không phát bù/event duplicate |
| Cache/context | Missing/corrupt/slow asset, đổi mode 20 lần, WebGL init fail/loss, điều khiển vẫn dùng được khi fallback; giới hạn byte thực |
| Hiệu năng | 15 phút Survival/boss trên máy thật; frame distribution, memory, cold/warm transfer theo profile, nhiệt/pin nếu công cụ hỗ trợ |

Headless screenshot/FPS và ffmpeg decode có thể bổ sung, không thay cho chạm/nghe thật hoặc Safari. Bằng chứng tự động mới được nối ở IMPLEMENTATION.md; nghiệm thu thiết bị vẫn còn chờ.

## Ước lượng và điều kiện giảm phạm vi

| Phần | Khoảng công, một developer |
| --- | --- |
| Save/rules/baseline | 4–6 ngày |
| Mẫu renderer/clip/UX | 6–9 ngày |
| TCG/expedition | 5–8 ngày |
| Auto chess/recap | 4–6 ngày |
| Mixer/content audio | 3–5 ngày |
| Mở rộng asset/content | 5–8 ngày |
| QA/cân bằng/release | 4–7 ngày |
| Nền gameplay/presentation | **31–49 ngày công** |
| Truyện nối, lựa chọn và sổ mới | **7–12 ngày công** |
| Tổng mở rộng | **38–61 ngày công**, khoảng 8–13 tuần |

Ước lượng đã gồm chỉnh sửa kỹ thuật thông thường, chưa gồm chờ thiết bị/tester hoặc vòng sản xuất/duyệt tranh và nhạc kéo dài. Asset clip có thể cần hỗ trợ họa sĩ/animator nếu generator không giữ thiết kế. Mẫu đầu khoảng 2–3 tuần là cơ sở hiệu chỉnh; có thể dùng lại model 3.5 để test adapter trước khi clip hoàn chỉnh.

Nếu vượt budget hoặc không đạt Safari: giữ Canvas/clip mới và giảm filter/parallax, thu gọn số model/sân trước; không bỏ guard save/luật ý chí. Nếu keyword thứ hai làm UI/AI quá phức tạp: hoàn tất Nêm vị và preview rồi tách Ủ vị sang bản kế tiếp. Cắt số lượng nội dung trước khi giảm chất lượng đường chơi/kiểm thử.

## Lệnh kiểm chứng cho PR feature

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm validate:catalog
pnpm release:verify
pnpm build
pnpm release:size
```

Nếu thêm/đổi asset/dependency, chạy `pnpm release:records` trước `release:verify` và review diff notices/manifest. Browser harness hiện có nằm ở `dev/tools/verify-depth.mjs`; phải mở rộng cho rules/keyword mới và chạy sau build production. Không thêm test chỉ để kiểm tra một đoạn văn của PR tài liệu.

## Backlog bổ sung truyện và native

| ID | Phạm vi | Dependency và gate |
| --- | --- | --- |
| N01 | Namespace story400, content version, choices/seen scenes/receipt | S01–S03; save cũ không tự chọn ending, Zod/MGC1/ZIP giữ trường mới, replay không thưởng lặp |
| N02 | Mẫu Chợ có hai giọng rồi 3 chương/9 màn | N01, T01–T02; giữ remember/release, skip/recap, boss báo đúng luật, starter qua được |
| N03 | Chiến dịch Auto nối 6 đợt và trang sổ | N01, A01–A02; không thay run rules5 đang chạy, không khóa nội dung theo chế độ kia |
| H01 | Spike Capacitor Android (nhánh riêng) | Môi trường/app ID thật; APK debug có trận/audio/rotation/lifecycle, không gọi web build là native build |
| H02 | Beta storage/backup/offline/permissions | S01–S03, H01; hydrate trước autosave, web↔native round-trip, kill/update cùng key giữ save |
| H03 | Hồ sơ Play và QA thiết bị | H02 + chủ thể/contact/quyền/thị trường; Data Safety theo SDK thật, signed AAB/closed test khi áp dụng; không tự phát hành |

N01–N03 nằm trong phần tăng7–12 ngày ở tổng trên. H01–H02 khoảng10–18 ngày công riêng; H03 có thời gian store/testing ngoài công kỹ thuật. Chi tiết ở [STORY_AND_SYSTEMS](STORY_AND_SYSTEMS.md), [AUDIO_VISUAL_PLAN](AUDIO_VISUAL_PLAN.md), [WEB_AND_ANDROID](WEB_AND_ANDROID.md), [POLICY_REVIEW](POLICY_REVIEW.md). Trạng thái từng nhóm và giới hạn nghiệm thu được cập nhật ở IMPLEMENTATION.md.
