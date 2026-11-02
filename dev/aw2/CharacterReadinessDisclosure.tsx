import { characterReadinessInventory } from "../../src/aw2/roster/readiness"

const readiness = characterReadinessInventory()

export function CharacterReadinessDisclosure() {
  const summary = readiness.summary
  return (
    <details className="aw2-character-readiness">
      <summary>Readiness 12 Vị Linh</summary>
      <p>
        Reference kỹ thuật:{" "}
        <strong>{summary.technicalReferenceReady}/12</strong>. Full-character
        DoD: <strong>{summary.fullCharacterComplete}/12</strong>. Rights phát
        hành: <strong>{summary.rightsCleared}/12</strong>.
      </p>
      <p>
        Có model, chuyển động, bốn skill và combat kit không đồng nghĩa nhân vật
        đã được duyệt cuối. Art độc lập, thiết bị thật và nghe audio bởi người
        thật hiện đều <strong>NOT_RUN</strong>.
      </p>
      <p>
        Release-ready: <strong>{summary.releaseReady}/12</strong>. Trạng thái
        chỉ được nâng khi full DoD, rights và mọi nghiệm thu ngoài có bằng
        chứng.
      </p>
    </details>
  )
}
