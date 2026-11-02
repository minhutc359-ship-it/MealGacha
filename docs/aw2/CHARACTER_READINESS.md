# Readiness 12 Vị Linh

Contract `aw2-character-readiness-v1` tách hai khái niệm: **technical reference package** chỉ xác nhận manifest/model/chuyển động/bốn skill/combat kit/provenance có cấu trúc hợp lệ; **release-ready character** còn bắt buộc full-character DoD, art review độc lập, thiết bị thật, người nghe audio và rights clearance.

| Vị Linh | Tier | Vai trò | Reference kỹ thuật | Full DoD | Rights | Release |
|---|---:|---|---|---|---|---|
| Than | N | Tank | READY | OPEN | NOT_CLEARED | BLOCKED |
| Lửa Nhỏ | N | Striker | READY | OPEN | NOT_CLEARED | BLOCKED |
| Lam Lam | N | Healer | READY | OPEN | NOT_CLEARED | BLOCKED |
| Mộc Non | R | Support | READY | OPEN | NOT_CLEARED | BLOCKED |
| Sương Lành | R | Mage | READY | OPEN | NOT_CLEARED | BLOCKED |
| Muối Đen | R | Debuffer | READY | OPEN | NOT_CLEARED | BLOCKED |
| Nhiên | SR | Striker | READY | OPEN | NOT_CLEARED | BLOCKED |
| Hải | SR | Tank | READY | OPEN | NOT_CLEARED | BLOCKED |
| Liên | SR | Healer | READY | OPEN | NOT_CLEARED | BLOCKED |
| Mộc | SSR | Mage | READY | OPEN | NOT_CLEARED | BLOCKED |
| Bách | SSR | Tank | READY | OPEN | NOT_CLEARED | BLOCKED |
| Vân | UR | Hybrid | READY | OPEN | NOT_CLEARED | BLOCKED |

## Tổng hợp hiện hành

- Technical reference: **12/12**.
- Full-character DoD: **0/12** (`fullCharacterComplete=false`).
- Independent art review: **NOT_RUN**.
- Physical device acceptance: **NOT_RUN**.
- Human audio review: **NOT_RUN**.
- Rights-cleared: **0/12** (`REVIEW_REQUIRED` / `NOT_CLEARED`).
- Release-ready: **0/12**.

Nguồn máy đọc nằm ở `src/aw2/roster/readiness.ts`; test khóa identity/order/count/provenance/status và serialization. Bảng này không cấp license, không thay thế kiểm tra pháp lý hay nghiệm thu con người.
