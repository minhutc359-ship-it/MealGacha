# Tích hợp đặc tả map/NPC/UI v1.1 —26/10/2026

Owner yêu cầu tích hợp v1.1 song song với phát triển AW2. [Bản gốc portable, giữ nguyên byte](design/world-v1.1/SOUL_OF_MEAL_AW2_MAP_NPC_WORLD_SPEC_v1.1.md) · [README](design/world-v1.1/README.md) · [Nguồn/hash/quyền](evidence/AW2-015A-spec-provenance.json) · [Task trước sửa mã](tasks/AW2-015A.md).

## Những điểm đã đối chiếu

| Mục | Nguồn sự thật hiện tại | Cách tích hợp |
| --- | --- | --- |
| UI một màn hình, submenu/tab/phân trang | Owner design ghi ở73ef962..601fed3vàv1.1§15 | D23;015A khung khám phá/Quest/đội/túi opt-in,015B chuyển battle/TCG/Chess; không đánh dấu toàn bộ UI đã xong |
| D13 bị trùng trong commit thiết kế | D13gốc là đội5starter đã duyệt | Giữ D13starter; đổi aliasUI mới thành D23, giữ nguyên lịch sử Git |
| AW2-012 bị trùng ở backlog | AW2-012gốc là tích hợp lịch sử | LuồngUI mới là AW2-015, không thay trạng thái012đã tích hợp |
| UI-QUEST6case nhập tay khác10case đặc tả | Ledger giữ tên/định nghĩa cũ | DùngUI-V11-01..10cho đặc tả; ánh xạ bên dưới, không gọi test cũ là PASS cho behavior mới |
| 1–2Vị Linh theo người chơi | OwnerD17một đại diện đầu đội | Giữ đúng1đại diện/nămcombat; phần follower của tài liệu không áp dụng |
| village/home/guild/... ID mẫu | D14sixaw2-zone IDs,8NPC,4quest; savev5strict | Giữ IDs hiện có; map mới cần authoredcontract/migration, không đổi ID/save ngầm |
| Lilia, xu, reward/công thức minh họa | Canon Bà/An/Dì và phần thưởngXP/nguyên liệu thực | Wireframe minh họa bố cục; không tạo NPC/tiền/thưởng mới từ hình |
| Gacha5tier | D07vàD11rates/pity PROPOSED | Luồng riêng; không nút quay/spend/rate chính thức khi chưa triển khai/duyệt |
| Hình Chapter4/diagram/wireframe | Tham chiếu owner, chưa phải runtimeart/nghiệm thu | Lưu ở docs; không đưa vào game atlas hoặc tuyên bố rights/commercial đã đạt |
| Không cuộn trang | ĐíchUIv1.1toàncore | 015A chỉ nghiệm thu scopeexploration/menu mới; battle/modes/legacydebug còn migration, không che/chặt nội dung để lấy PASS |

## Hai luồng triển khai trên cùng nhánh AW2

| Luồng | Đã có bằng chứng | Phần tiếp theo và phụ thuộc | Owner |
| --- | --- | --- | --- |
| UI/Quest | 008A directions, real quest/store, readiness; v1.1design | 015A opt-in game.html cùng controller + QuestJournal/paging/single modal;015B compactbattle/mode scenes;008Boverview trong panel | BA/mechanic/tester/scretary, animation/style |
| World/interiors | 6map/kết nối/geometry/camera,32công trình phong cảnh;savev5 | [016A](tasks/AW2-016A.md) contractMap/portal/spawn rồi migration đầu tiên, rồi một nhà thật/hội quán; preloaddestination/rollback/cooldown/spawn safety trước mở rộng nhiều phòng | BA/story/mechanic/animation/tester |
| NPC | 8NPC/32idleframes/sharedclock/interaction | [016B](tasks/AW2-016B.md) một patrolbounded có idle/walk4hướng/realpositions/proximity/collision/pause; lịchgame-time/fallback sau đó, không khóa mainquest theo giờ thật | story/character/mechanic/animation/tester |
| Quái/encounter | Boss riêng, actualengine/5savedparty/manualultimate/atomiccommit | WorldmonsterID/AI/patrol/notice/chase/safeencounter contract; art riêng trước runtime, không mượn hình VịLinh thay quái | character/mechanic/animation/tester |
| Dungeon/reward | Kho–Lửa–Bàn, puzzle3bước/rương/cook/share/2ending/receipts | Nội dung mới theo stable IDs, gate nguyên tố phải có đường free/story; giữ atomic/idempotent | story/mechanic/tester |
| TCG/Chess | Real borrowedpractices, portalsPhố +quickentry/contextsafe | 015Bsingleviewportscene trước đổi vị trí vào guild; không bắt thắng mode để qua mainstory | mechanic/BA/tester |
| Art/performance/QA | 12referencekits/6scenery/ambient12placements; technicalQA | FullDoD/FPS/totalGPUmemory/device/listening/rights cònOPEN;010C/011Agác theoD20, không suy PASS từ wireframe | animation/tester/BA |

Đây là các luồng phụ thuộc độc lập, không phải lệnh tạo branch/subagent tự chạy. Các task vẫn trực tiếp `game/adventure-world-2`, checks/docs/commit/push/remoteSHA theoD16. Không cập nhật `rpg`/master/deploy/release; D18vẫn cần gate thật. Không reset save để né thiết kế migration.

## Ánh xạ QA v1.1

| ID chuẩn mới | Spec§15.7 | Imported ledger alias | Trạng thái trước015A |
| --- | --- | --- | --- |
| UI-V11-01 | No scroll320×568/390×844/844×390/1280×720 | UI-QUEST-01 | NOT_RUN |
| UI-V11-02 | Tabs/pagination30–100quests/focus | UI-QUEST-02 | NOT_RUN |
| UI-V11-03 | Menu pause/no drift/returnposition | UI-QUEST-03 | NOT_RUN |
| UI-V11-04 | HUD/Journal/NPC sameprogress | UI-QUEST-04 | NOT_RUN |
| UI-V11-05 | Directions gated/no hidden teleport | SpecUI-QUEST-05, old008Asubsetonly | NOT_RUN for newUI |
| UI-V11-06 | Atomic reward/doubletap/reload | ImportedUI-QUEST-05 | NOT_RUN for newUI |
| UI-V11-07 | No map click-through under panel | New specUI-QUEST-07 | NOT_RUN |
| UI-V11-08 | Long Vietnamese/large text/pageddialog | New specUI-QUEST-08 | NOT_RUN |
| UI-V11-09 | Team/bag/singlepanelreturn;gacha whenreal | New specUI-QUEST-09 | NOT_RUN |
| UI-V11-10 | TCG/Chess in-frame/context | ImportedUI-QUEST-06 | NOT_RUN;015B |

015A chỉ cập nhật các scope đã chạy thực; gamepad/device/human/large quest content không tồn tại phải phân biệt propertyfixture và actual authoreddata. Không cộng test cũ vào số mới. Demo90%/product≈40%(35–45%) giữ nguyên cho đến khi denominatorgates thực sự đóng.
