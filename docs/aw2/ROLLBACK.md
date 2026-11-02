# Runbook stage, promote và rollback AW2

Tài liệu vận hành; không phải ủy quyền deploy. Chỉ owner/release operator đã xác nhận đúng Vercel team, project, commit và environment mới được thực hiện.

## Trước khi stage

1. Chạy `pnpm install --frozen-lockfile`, `pnpm test`, hai typecheck, `pnpm build`, `pnpm release:aw2-candidate` và các gate release/assets/budget.
2. Không tiếp tục nếu report khác technical `PASS`, overall khác `READY`, hoặc `releaseAuthorized=false`. Trạng thái hiện hành là `BLOCKED_EXTERNAL` nên dừng tại đây.
3. Ghi immutable commit SHA, candidate fingerprint, production deployment ID/URL hiện hành và deployment ID/URL known-good để rollback.
4. Cấu hình token trong protected environment secret `VERCEL_TOKEN`; không truyền `--token` trong command/log. Pin Vercel CLI version đã review.

## Khi toàn bộ gate đã PASS

1. Pull đúng production environment rồi build production theo quy trình được duyệt.
2. Stage một **production deployment không gắn domain**: `vercel deploy --prebuilt --prod --skip-domain`.
3. Không dùng preview deployment làm artifact cuối: promote preview có thể rebuild bằng production environment, khiến bản được test khác bản phát hành.
4. Trên chính staged production URL, kiểm root AW2, `/chest`, install/update/offline, save/reload/recovery, full journey, legal pages, logs và UAT đã ký.
5. Chỉ sau khi artifact ID/fingerprint khớp evidence mới chạy `vercel promote <staged-production-url-or-id>`.

## Rollback sự cố

1. Dừng promote/push mới; ghi incident time, deployment ID, commit, browser và triệu chứng. Không yêu cầu người chơi reset dữ liệu.
2. Rollback thẳng tới deployment known-good đã ghi: `vercel rollback <known-good-deployment-url-or-id>`. Không rebuild một commit cũ rồi gọi đó là cùng artifact.
3. Vercel rollback sẽ tắt auto-assignment; production push mới không tự live cho tới khi một deployment được `vercel promote` lại. Ghi trạng thái này trong incident.
4. Xác minh root mở AW2, `/chest` mở đúng Rương original, service worker nhận shell hợp lệ và save schema hiện có vẫn đọc được.
5. Không xóa `localStorage`/IndexedDB, không mass-delete cache và không hạ schema save. Dùng recovery/quarantine hiện có; giữ raw data nguyên vẹn khi điều tra.
6. Sau khi fix có đủ gate/evidence, stage production mới, test đúng URL rồi promote; không bật lại auto-assignment bằng một bản chưa kiểm.

## Bằng chứng đóng incident

- known-good và failed deployment ID/URL;
- commit/fingerprint, candidate report và thời điểm promote/rollback;
- kết quả root, chest, save/reload, offline/update và error-log scan;
- blocker/root cause, fix, UAT hồi quy và owner approval.

Không lưu token, `.env`, browser auth state, raw save người chơi hoặc secret-bearing trace trong artifact/evidence.
