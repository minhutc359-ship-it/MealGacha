# Balance development và công bố D11

Runtime hiện dùng contract `aw2-balance-development-v1`. Contract này khóa serialization ổn định của 12 combat kit, năm starter, level cap/công thức XP/hệ số stat, bốn quest reward, rương, công thức bữa ấm và XP chia bữa. SHA-256 trong test phát hiện mọi drift không được review.

Đây là **development tuning**, không phải cân bằng cuối. Thay đổi có chủ đích phải bump contract, chạy lại mô phỏng/regression và ghi bằng chứng playtest; fingerprint không chứng minh trò chơi vui hoặc công bằng.

## D11

D11 vẫn `PROPOSED_NOT_APPROVED`. Metadata đề xuất có đúng N/R/SR/SSR/UR, trọng số 10.000 và mốc mô phỏng 10/80/200, nhưng production chỉ hiển thị disclosure. Không có API/nút quay, tiêu hoặc mua tiền tệ, lưu pity hay khóa cốt truyện theo rarity. Simulator chỉ dùng cho test/tool nội bộ và không được import vào UI production.

## Authority

- `src/aw2/balance/contract.ts`: snapshot, guardrail, validator và serialization.
- `src/aw2/gacha/proposal.ts`: metadata D11 thuần dữ liệu.
- `src/aw2/gacha/simulator.ts`: mô phỏng nội bộ, không phải runtime feature.
- `src/aw2/economy/model.ts` và `src/aw2/combat/progression.ts`: constant được runtime thực thi.
- `dev/aw2/BalanceDisclosure.tsx`: nội dung minh bạch trong Hướng dẫn.

Final balance acceptance, D11 approval và human playtest vẫn mở; tài liệu này không trao quyền phát hành hoặc commerce.
