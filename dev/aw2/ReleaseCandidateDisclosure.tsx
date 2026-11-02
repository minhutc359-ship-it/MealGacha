import { CURRENT_RC_PUBLIC_SUMMARY as summary } from "../../src/aw2/release/candidate"

export function ReleaseCandidateDisclosure() {
  return (
    <details className="aw2-release-candidate-disclosure">
      <summary>Release candidate web1.0</summary>
      <p>
        Technical gates: <strong>{summary.technicalPass}/12 PASS</strong>.
        External gates: <strong>{summary.externalPass}/7 PASS</strong>.
      </p>
      <p>
        Overall: <strong>BLOCKED_EXTERNAL</strong>. Character DoD/rights,
        art-audio review, content, human/device UAT, device performance và owner
        approval còn mở.
      </p>
      <p>
        Báo cáo này không deploy, promote hoặc release. Chỉ khi toàn bộ gate có
        evidence PASS thì `releaseAuthorized` mới được phép thành true.
      </p>
    </details>
  )
}
