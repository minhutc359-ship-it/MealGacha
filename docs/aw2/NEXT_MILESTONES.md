# PR tích hợp kế tiếp: demo100% và sản phẩm45%

**Dự báo hiện hành sau AW2-017F (2026-10-28):** nếu tiếp tục gom tối thiểu15 kế hoạch kỹ thuật mỗi commit, còn khoảng **5–7 commit lớn** để có production candidate web có thể đưa cho người chơi độc lập, và **14–20 commit lớn** để đạt phạm vi product đầy đủ hiện mô tả. Khoảng14–20 bao gồm các batch character DoD, balance/economy/gacha decision, durability/offline/save, art/audio polish, device/FPS/accessibility, human blocker fixes, rights và release. Đây không phải deadline hay số commit cố định: gate art/rights/người chơi/thiết bị có thể tạo thêm vòng sửa. Next engineering commit là **AW2-018C** scene-level media/chunk + cold-load/durability; không tự đóng D18.

**Ưu tiên owner2026-10-24 (D20): tiếp tục hoàn thiện, gác phần nghiệm thu.**006G triển khai khu khởi đầu Làng Giao Ước; việc tiếp theo là Phòng Kho (bảng dấu hơi/rương/đường qua Lửa), sau đó Sân/Phố. Không đặt010C/011A làm bước công việc kế tiếp trong lúc phát triển; các gate chưa quan sát vẫn NOT_RUN, D18outgoing PR không tự đạt. Demo90/product40 giữ nguyên. [Làng](LANG_GIAO_UOC.md), [task](tasks/AW2-006G.md).

Các NEXT/ưu tiên bên dưới là lịch sử, đọc theo006G/D20 ở trên.

D19/013B: `rpg` đã được owner xác nhận là nhánh product về sau, AW2 giữ nhánh phát triển/tích hợp. Incoming PR82 merge vào AW2 được phép riêng; D18outgoing milestone100/45 và hiện tại90/40 không đổi. Lịch sử PR đã được tiếp nhận chức năng từ013A; lần hợp nhất này không tự cộng điểm product. [Evidence](evidence/AW2-013B.md).

2026-10-24 · BA/tester/scretary · D18/AW2-014A đặt mục tiêu cho PR `game/adventure-world-2` → `rpg` kế tiếp là **demo10/10=100%, sản phẩm45/100**. Chỉ báo hiện tại vẫn **demo9/10≈90%, sản phẩm≈40% (35–45%)**. [Mẫu số/trọng số](PROGRESS.md) giữ nguyên; không tính phần trăm theo số task, test hoặc số khung hình. PR chỉ mở sau bằng chứng, không tự merge/deploy/release/master.

**Demo còn1gói nghiệm thu:** một người chơi độc lập đi hết nhập môn→6vùng/4quest→rương/nấu/chia bữa→TCG/Chess→boss→ghi chép→ending→reload, ghi bản build, trình duyệt/thiết bị, đường đi, lỗi và đánh giá hướng dẫn; sau đó sửa và xác minh hết lỗi chặn demo. TCG/Chess/partial smoke đã được owner thử, nhưng chưa có bằng chứng hoàn tất toàn hành trình. Kiểm tra tự động không thay thế lượt chơi này. Một nhóm tiêu chí còn lại có thể sinh nhiều bug task, nên không thể hứa chỉ còn một lần sửa code. Demo100% cho phép art tham chiếu, không đồng nghĩa release/12 nhân vật hoàn chỉnh.

**Sản phẩm≈50%: đề xuất4gói chính sau rematch**, theo thứ tự dưới. Đây là phạm vi lập kế hoạch để BA đánh giá lại sau nghiệm thu, chưa phải điểm đã đạt hay cam kết rằng đóng bốn ticket tự động bằng50%.

**Cut cho PR45:** ưu tiên đóng gói2 (`+3`) và phần playtest/device của gói4 (`+2`). Gói1 cân bằng cuối và gói3 hai nhân vật full DoD tiếp tục sau PR nếu chưa đạt độc lập; không hạ tiêu chí của chúng để lấy điểm. AW2-006F đã có bản kỹ thuật tham chiếu của gói2; nghiệm thu tuyến độc lập còn mở, AW2-010C/AW2-011A đóng gói4.

| Gói | Kết quả cần có để nghiệm thu | Phần điểm dự kiến trong mẫu số100 | Owner/dependency |
|---|---|---:|---|
|1. Cân bằng đội và tiến trình —007N | Đo đội đại diện của đủ12kit tại cấp thực sự kiếm được; phân tích defeat/timeout/ultimate policy, điều chỉnh lỗi rõ ràng và trải nghiệm chọn đội. Chốt tiêu chí challenge thực tế trước tuning, giữ đội starter/không bắt UR, không yêu cầu mọi đội thắng. Save/rewards/ending regression đạt. |+2: runtime+1, kinh tế/cân bằng+1 | BA/mechanic/tester, sau007M |
|2. Hoàn thiện một tuyến thế giới/dungeon và UX | Chọn tuyến đi tới boss hiện có, authored map/NPC/interactions/telegraph và hướng dẫn nhất quán; mở rộng spec trước khi đổi lore. Test navigation/collision/return, mobile/keyboard/readability và quan sát người chơi. Không chỉ thay portrait hoặc thêm placeholder. |+3: world+2, UX+1 | story/animation/mechanic/BA/tester, sau scope review |
|3. Hai nhân vật mẫu qua đủ DoD | Ưu tiên Than và Lửa Nhỏ để đo vận tốc; mỗi người đạt identity/lore/kit/progression/chibi4hướng/HD8trạngthái/FX/contact/audio/provenance, nghiệm thu art/animation/listening/cân bằng/thiết bị/rights theo CANON và gate riêng. Hiện cả12 vẫn0fullDoD; không tự ký nghiệm thu độc lập. |+3: nhân vật+3 | character/animation/story/mechanic/tester và reviewer phù hợp; có thể làm song song tiến trình sản phẩm khi đủ người |
|4. Playtest demo và baseline thiết bị thật | Đóng nhóm demo còn lại ở trên; thử hành trình trên desktop và một điện thoại thật, đo tải/FPS/bộ nhớ/audio, ghi save/reload/recovery và lỗi; sửa blocker theo phạm vi. Baseline này chưa đóng toàn bộ offline/native/production-save/release gate. |+2: UX+1, release baseline+1 | BA/tester/người chơi độc lập, sau build ổn định; không thay bằng viewport giả lập |
| **Tổng mục tiêu** | Nghiệm thu từng gói rồi BA/tester đối chiếu lại bằng chứng và trọng số | **+10:40→≈50** | Không ghi nhận trước |

Điểm đích nếu phạm vi trên thực sự được chấp nhận: runtime21/25, world12/15, nhân vật8/30, UX5/10, kinh tế3/10, release1/10 =50/100. Đây vẫn là ước lượng khối lượng, có thể cần hiệu chỉnh sau hai nhân vật mẫu; không nâng chỉ báo hiện tại theo phép cộng giả định. Rematch cải thiện nhóm nền đã tính, không có điểm thưởng riêng. Gói4 chứa nghiệm thu demo nên không cộng thêm lần nữa.

007N đã hoàn tất baseline96lượt và hướng dẫn vai trò/chỉ số/draft starter/kết quả trận; cân bằng cuối/nghiệm thu gói1 vẫn OPEN, chưa cấp+2điểm. 006B đã hoàn thành nền/bàn riêng và waypoint Phòng Bàn trong gói2; 006C đã thêm note/hai dấu lối, 006Dđã có boss chibi4idle, full motion còn mở, 006Fđã có nền/ba puzzle props Phòng Lửa, bốn vùng khác vẫn debug. Tiếp theo là[AW2-010C](tasks/AW2-010C.md)/[AW2-011A](tasks/AW2-011A.md) nghiệm thu độc lập và thiết bị. Gói2/full tuyến và nghiệm thu độc lập vẫn OPEN, chưa cấp+3điểm; không triển khai gacha. D11 vẫn PROPOSED, D12 OPEN. Các phần để từ50% tới sản phẩm hoàn chỉnh vẫn gồm10nhân vật còn lại/full art, thế giới/dungeon còn lại, mode/economy/gacha nếu được duyệt, UX/audio, production-save/offline/performance/rights/release; owner phải cho phép deploy/release riêng. [Delivery plan](DELIVERY_PLAN.md), [REPORT](REPORT.md).

006E/D17 ưu tiên theo owner: một nhân vật đầu đội đã lưu đại diện trên map, đội chiến đấu vẫn5; không tăng điểm demo/product. Task này hoàn tất trước006D, kế hoạch world boss và các gate độc lập vẫn mở. [Bằng chứng](evidence/AW2-006E.md).

006Dđã thêm boss world4idle riêng, giữ D17một đại diện và5combat; full enemy/motion/gói2/nghiệm thu độc lập vẫn OPEN. Không tăng % hay rút ETA từ một atlas/test xanh. 006Fđã có Phòng Lửa kỹ thuật; tiếp theo010C/011A. [Bằng chứng](evidence/AW2-006D.md).

006F current: technical room route/puzzle/reload/cook/share/native menus verified; independent route/UX acceptance still OPEN. Actual90%/40%, D18target100%/45%; no package points or PR before010C/011A evidence. [006F evidence](evidence/AW2-006F.md).
