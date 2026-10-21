# Ước lượng hoàn thiện AW2

Cập nhật 2026-10-21 · BA/scretary · **Ước lượng sơ bộ có điều kiện, chưa phải ngày cam kết hoặc quyết định phát hành.** Các mốc dưới tính từ hiện trạng đã kiểm chứng, không cộng dồn từng khoảng. D12 còn mở về nền tảng/tên/monetization; web trước là giả định lập kế hoạch, không phải owner approval mới.

| Mốc | Khoảng thời gian còn lại | Điều kiện hoàn thành |
|---|---|---|
| Web chơi thử trọn luồng |1–2 tuần làm việc liên tục | RPG→TCG→Auto Chess→quay về; hướng dẫn dễ hiểu; quest/boss/hai kết thúc/save hoạt động; không có lỗi chặn luồng. Cho phép art tham chiếu và chưa có gacha runtime |
| MVP theo phạm vi12 nhân vật |6–10 tuần làm việc liên tục | Đủ12 nhân vật qua DoD; map/NPC/boss có art/animation phù hợp; kinh tế/cân bằng/UX được thử; gacha chỉ có nếu D11 được duyệt; hồi quy trên các thiết bị mục tiêu |
| Web đủ điều kiện phát hành ổn định |10–16 tuần làm việc liên tục | Đóng lỗi nghiêm trọng, đo tải/FPS/bộ nhớ/offline, migrations/save production, kiểm tra quyền sử dụng; chốt phạm vi/nền tảng và owner duyệt phát hành |

Đây là khoảng lập kế hoạch với độ tin cậy **thấp–trung bình**; không có dữ liệu vận tốc nhiều sprint hoặc đội art/QA được phân bổ để chốt lịch chắc chắn. Giả định một lập trình viên làm đều, có năng lực art/animation và QA tham gia thường xuyên, phản hồi duyệt nội dung trong1–2 ngày làm việc, giữ phạm vi12 nhân vật/arc hiện tại. Thời gian chờ người duyệt/asset/thiết bị cộng thêm theo thực tế. Nếu một người phải tự làm toàn bộ code, art và QA, hoặc chỉ làm gián đoạn, cần ước lượng lại. Các phiên Codex không tự chạy liên tục khi cuộc trò chuyện đã kết thúc.

Giả định phát hành web chơi đơn, lưu cục bộ; không tính tài khoản/cloud save, PvP/server, thanh toán, vận hành dịch vụ hoặc native Android/iOS/store. Nếu bổ sung các phần này, phải chia task/thiết kế và ước lượng riêng trước khi nhận mốc phát hành. Không thể suy ra đã hoàn thiện sản phẩm từ số test xanh hoặc số task VERIFIED; nhiều gate vẫn chỉ là development subset.

## Cơ sở và đường đi còn lại

Đã có nền6 zone/4 quest, đội5 người, boss thật/hai kết thúc, save v4/túi đồ/EXP/nấu ăn và TCG luyện tập. AW2-009C bổ sung Auto Chess thực tế qua cùng adapter; kết quả kiểm chứng nằm trong [REPORT](REPORT.md)/[ledger](TEST_LEDGER.md). Hai mode mượn tài nguyên riêng và chưa có phần thưởng/tiến trình sưu tập. Thông số hiện tại còn là thử nghiệm.

1. **Chốt demo — AW2-010A:** phần tích hợp/hướng dẫn và kiểm chứng tự động source+compiled đã PASS; còn playtest bởi người chơi độc lập và sửa lỗi dùng thử. Dự trù3–5 ngày cho tích hợp/hướng dẫn và2–5 ngày cho playtest/sửa lỗi; không tự đánh dấu đủ12 nhân vật.
2. **Nhân vật/art — AW2-004 và phần còn lại006/007:**7 bộ chưa tạo;5 bộ hiện có chỉ là tham chiếu và đều `fullCharacterComplete=false`. Hoàn thiện lore/kit/leveling, chibi4 hướng, HD8 trạng thái, portrait, projectile/impact/ultimate, âm thanh và provenance cho từng người. Map/NPC/boss riêng còn thiếu. Đây là đường găng lớn nhất; cần đo thời gian thực tế của1 nhân vật hoàn chỉnh trước khi siết mốc6–10 tuần.
3. **Cơ chế và nội dung hoàn thiện:** kiểm thử/cân bằng các đội12 nhân vật, dungeon, kinh tế/phần thưởng, UX; duyệt D11 trước runtime gacha nếu giữ phần đó trong MVP. Không tự áp tỷ lệ đề xuất. Chốt tiêu chí mode sản phẩm nếu muốn vượt bộ luyện tập mượn hiện tại.
4. **Release gate — AW2-011:** trình duyệt/thiết bị thật, hiệu năng/offline/âm thanh, migration/save production không phá dữ liệu, quyền sử dụng art/audio và full regression. Owner duyệt trước deploy/release; làm xong code không tự đóng các gate này.

**Cách cập nhật ước lượng:** phần kỹ thuật010A đã qua; cập nhật tiếp sau playtest độc lập và sau nhân vật đầu tiên đạt đầy đủ DoD, BA/tester đối chiếu công sức thực, lỗi còn mở và thời gian duyệt; scretary cập nhật REPORT/bản này. Theo yêu cầu owner về %, dùng [PROGRESS](PROGRESS.md): đếm nhóm tiêu chí demo đã kiểm chứng và ghi riêng ước lượng sản phẩm có trọng số/độ bất định. Không suy phần trăm từ số test hoặc hẹn ngày không có cơ sở. [STATUS](STATUS.md), [BACKLOG](BACKLOG.md), [CANON](CANON.md), [HANDOFF](HANDOFF.md) là nguồn phạm vi/gate.


AW2-004C cập nhật cơ sở:32 cels/tám trạng thái Than đã được tạo, sửa gutter và kiểm chứng, nhưng full DoD vẫn mở. Bốn lần image_gen/hai sheet được chọn và gate cụ thể nằm tại [Than ledger](THAN_CHARACTER_GATES.md); chưa phải số ngày/chi phí của một nhân vật hoàn chỉnh. Giữ nguyên các khoảng có điều kiện ở trên, không suy vận tốc12 nhân vật từ một gói motion. Task triển khai kế tiếp004D Lửa Nhỏ; kiểm duyệt độc lập/playtest/thiết bị/rights vẫn là phần phải tính riêng.


AW2-004D bổ sung gói32-cel Lửa Nhỏ và sửa trình diễn hai hit/builder; ba lần image_gen gồm một sửa layout. Đây vẫn chưa phải mẫu nhân vật đủ DoD. Giữ nguyên các khoảng/giả định ở trên, không rút lịch từ64 cels mới của hai starter; cần thời gian đóng art/telegraph/audio-hit/cân bằng/thiết bị/listening/rights và đo nhân vật được chấp nhận đầy đủ. [Lua gaps](LUA_CHARACTER_GATES.md), [bằng chứng](evidence/AW2-004D.md); next004E Lam Lam.

AW2-004E tạicf0b394 thêm32 cels Lam và sửa trình diễn đạn/hai nhịp heal/FX reduced;4 lần image_gen,2 layout sửa được chọn.3/5 starter có motion packages, vẫn0/12 đầy đủ DoD. Giữ các khoảng/giả định có điều kiện trên; không rút lịch từ96 cels hoặc1007 test/471 browser checks. Demo≈90%, sản phẩm≈40% rough35–45% giữ nguyên; báo hai tỷ lệ sau mỗi cập nhật theo owner. Next004F Mộc Non, độc lập art/playtest/thiết bị/listening/rights vẫn mở. [Lam gates](LAM_CHARACTER_GATES.md), [evidence](evidence/AW2-004E.md).
