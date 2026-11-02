import {
  BALANCE_CONTRACT_ID,
  BALANCE_CONTRACT_STATUS,
} from "../../src/aw2/balance/contract"
import {
  GACHA_PROPOSAL_STATUS,
  PITY_LIMITS,
} from "../../src/aw2/gacha/proposal"
import { FREE_SUMMON_PROFILE } from "../../src/aw2/gacha/runtime"

export function BalanceDisclosure() {
  return (
    <details className="aw2-balance-disclosure">
      <summary>Minh bạch cân bằng và gacha</summary>
      <h3>Cân bằng bản phát triển</h3>
      <p>
        Combat, cấp độ và phần thưởng đang dùng cấu hình có version{" "}
        <code>{BALANCE_CONTRACT_ID}</code> ({BALANCE_CONTRACT_STATUS}). Đây chưa
        phải cân bằng cuối và có thể đổi sau playtest có ghi nhận.
      </p>
      <h3>Triệu hồi miễn phí</h3>
      <p>
        Hồ sơ <code>{FREE_SUMMON_PROFILE}</code> có nút gặp Vị Linh bằng vé kiếm
        qua nhiệm vụ và bàn chơi, lưu kết quả và bảo hiểm. Không mua vé, không
        thanh toán và không khóa cốt truyện sau rarity.
      </p>
      <p>
        Bảo hiểm {PITY_LIMITS.sr}/{PITY_LIMITS.ssr}/{PITY_LIMITS.ur} dùng chung
        luật với mô phỏng. D11 gốc vẫn có nhãn {GACHA_PROPOSAL_STATUS}; triển
        khai miễn phí không thay cho nghiệm thu tỷ lệ cuối hay quyền phát hành.
      </p>
    </details>
  )
}
