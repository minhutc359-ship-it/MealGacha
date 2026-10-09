import { AUTO_UNITS, LEGACY_UNIT_IDS, shopOdds } from "../../game/autochess/catalog"
import { poolSize } from "../../game/autochess/economy"

export function ShopOdds({ level, rulesVersion }: { level: number; rulesVersion: number }) {
  const units = rulesVersion >= 3 ? AUTO_UNITS : AUTO_UNITS.filter(u => LEGACY_UNIT_IDS.has(u.id))
  return <div className="ac-shop-odds">
    <h3>Tỉ lệ mỗi ô cửa hàng</h3>
    <table>
      <thead><tr><th>Cấp</th>{[1, 2, 3, 4, 5].map(cost => <th key={cost}>{cost} ◉</th>)}</tr></thead>
      <tbody>{[3, 4, 5, 6, 7, 8, 9].map(value => <tr key={value} className={value === level ? "is-current" : ""} aria-current={value === level ? "true" : undefined}>
        <th>{value === level ? "▸ " : ""}{value}</th>{shopOdds(value, rulesVersion).map((chance, index) => <td key={index}>{chance}%</td>)}
      </tr>)}</tbody>
      <tfoot><tr><th>Loại quân</th>{[1, 2, 3, 4, 5].map(cost => <td key={cost}>{units.filter(u => u.cost === cost).length}</td>)}</tr></tfoot>
    </table>
    <p>{units.length} quân khác nhau · bản mỗi quân theo bậc giá: {[1, 2, 3, 4, 5].map(poolSize).join(" / ")}.</p>
    <p>Mỗi ô roll bậc giá trước, rồi chọn quân theo số bản còn trong pool. Quân trên bàn, dự bị và shop đều giữ bản; bán quân trả bản lại. Pool của một bậc cạn sẽ chia lại tỉ lệ cho các bậc được phép còn quân.</p>
    {rulesVersion < 3 && <p>Phiên này dùng pool và tỉ lệ cũ. Bắt đầu phiên mới để chơi 44 quân và đối thủ mới.</p>}
    <div className="ac-keyboard-help"><kbd>W</kbd> Bàn ↔ dự bị <kbd>E</kbd> Bán quân dưới chuột <kbd>F</kbd> +4 XP <kbd>D</kbd> Đổi shop</div>
  </div>
}
