import {
  BALANCE_CONTRACT_ID,
  BALANCE_CONTRACT_STATUS,
} from "../../src/aw2/balance/contract"
import {
  GACHA_PROPOSAL_STATUS,
  PITY_LIMITS,
} from "../../src/aw2/gacha/proposal"

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
      <h3>Gacha chưa được bật</h3>
      <p>
        D11 hiện là <strong>{GACHA_PROPOSAL_STATUS}</strong>. Game không có nút
        quay, không tiêu hoặc mua tiền tệ, không lưu pity và không khóa cốt
        truyện sau rarity.
      </p>
      <p>
        Các mốc {PITY_LIMITS.sr}/{PITY_LIMITS.ssr}/{PITY_LIMITS.ur} chỉ phục vụ
        mô phỏng nội bộ; chúng không phải lời hứa phát hành.
      </p>
    </details>
  )
}
