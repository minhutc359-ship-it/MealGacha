import { CONTENT_ACCEPTANCE_PUBLIC_SUMMARY as summary } from "../../src/aw2/world/contentAcceptance"

export function ContentAcceptanceDisclosure() {
  return (
    <details className="aw2-content-acceptance">
      <summary>Phạm vi nội dung AW2</summary>
      <p>
        Contract kỹ thuật: <strong>PASS</strong> · {summary.zones} vùng ·{" "}
        {summary.rooms} phòng · {summary.npcs} NPC · {summary.quests} nhiệm vụ ·{" "}
        {summary.spirits} Vị Linh.
      </p>
      <p>
        Portal/đường quay về: <strong>{summary.reciprocalPortals}/12</strong>.
        Copy placeholder: <strong>{summary.placeholderHits}</strong>.
      </p>
      <p>
        Duyệt cốt truyện/nội dung bởi người thật: <strong>NOT_RUN</strong>. PASS
        kỹ thuật không đồng nghĩa nội dung đã được ký duyệt phát hành.
      </p>
    </details>
  )
}
