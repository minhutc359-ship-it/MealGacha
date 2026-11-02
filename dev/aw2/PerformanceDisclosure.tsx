import { AW2_PERFORMANCE_PUBLIC_SUMMARY as status } from "../../src/aw2/observability/performance"

export function PerformanceDisclosure() {
  return (
    <details className="aw2-performance-disclosure">
      <summary>Hiệu năng và chẩn đoán</summary>
      <p>
        Hard budget: artifact ≤ {status.productionLimitMb}MB · offline shell ≤{" "}
        {status.offlineShellLimitMb}MB · JavaScript gzip ≤{" "}
        {status.jsGzipLimitKb}
        KB.
      </p>
      <p>
        Cold load, FPS/GPU, bộ nhớ và long task trên thiết bị thật:{" "}
        <strong>NOT_RUN</strong> trong lát cắt tự động này.
      </p>
      <p>
        Chẩn đoán chỉ tạo scalar theo whitelist tại chỗ; không tự gửi mạng và
        không chứa raw save, URL/query, danh tính, stack hay ghi chú tự do.
      </p>
    </details>
  )
}
