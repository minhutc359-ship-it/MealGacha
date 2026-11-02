import { AW2_UAT_PUBLIC_SUMMARY as summary } from "../../src/aw2/review/uat"

export function UatDisclosure() {
  return (
    <details className="aw2-uat-disclosure">
      <summary>UAT desktop, mobile và screen reader</summary>
      <p>
        Matrix: {summary.lanes} lane · {summary.scenarios} scenario. PASS:{" "}
        <strong>{summary.pass}</strong> · FAIL: <strong>{summary.fail}</strong>{" "}
        · NOT_RUN: <strong>{summary.notRun}</strong>.
      </p>
      <p>
        Human acceptance: <strong>NOT_RUN</strong>. Unit test hoặc browser
        automation không được tính thay phiên độc lập trên thiết bị thật.
      </p>
      <p>
        Mỗi phiên phải gắn SHA-256 artifact, đủ outcome bắt buộc và blocker hữu
        hạn; không lưu raw save, URL/query, tester identity hay ghi chú tự do.
      </p>
    </details>
  )
}
