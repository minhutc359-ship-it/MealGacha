import { useAppStore } from "../../store/useAppStore";
import { CARD_MAP } from "../../game/catalog";
import { SPIRIT_RARITY, SPIRIT_RARITY_NAMES } from "../../domain/spiritSummons";
import { collectedSpiritCards, spiritProgress } from "../../domain/spiritCollection";
import { SpiritArt } from "../game/SpiritArt";
import "./ChestSpiritCard.css";
export default function ChestSpiritCard({ id }: {
    id: string;
}) {
    const user = useAppStore(s => s.user), progress = spiritProgress(id, collectedSpiritCards(user));
    return <a className="chest-spirit-card" href={`/adventure?hero=${encodeURIComponent(id)}`}>
    <SpiritArt id={id}/><span><small>+1 THẺ VỊ LINH · {SPIRIT_RARITY_NAMES[SPIRIT_RARITY[id]]}</small><strong>{CARD_MAP[id].name}</strong><b>{progress.collected}/{progress.needed} thẻ {progress.ready ? "· ĐỦ GIAO ƯỚC" : "· Mở khóa nhân vật"}</b><span className="chest-spirit-meter"><i style={{ width: `${Math.min(100, progress.collected / progress.needed * 100)}%` }}/></span><small>Xem hồ sơ & tuyệt kỹ ↗</small></span>
  </a>;
}
