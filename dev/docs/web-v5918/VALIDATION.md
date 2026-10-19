# Web 5.9.18 validation

Validated the finished introductory book and the final reader implementation before pushing.

| Check | Result |
| --- | --- |
| Unit suite | 768 tests passed across 74 files |
| TypeScript | Production and development typechecks passed |
| Release guards | Four Node tests passed |
| Manga data | Existing 17 books/182 story pages remain current; all 4 new books/12 full images match their scripts and recorded hashes |
| Existing reader regression | 26 Chromium checks passed; no console errors or missing requests |
| New reader | All 12 pages loaded at 320×568, 390×844, 844×390 and 1440×900; full-image aspect ratio, controls, paging, scrolling, zoom, transcript and focus verified |
| Recovery | Chapter-request and image-request retry paths passed |
| Production integration | TCG, Adventure, Auto Chess and Chest entry points passed; saved data remained unchanged |
| Asset/release records | Records current; asset validator checked 137 references with no missing files |

Reader and production reports are in `evidence/verification-reader.json` and `evidence/verification-production.json`. The new reader reports contain no console errors or unexpected missing resources. Screenshot evidence covers all four viewport sizes. Images and lettering were visually reviewed, including the corrected final-page dialogue and difficulty label.

## Delivery and size

- Twelve intact WebP pages: **7,336,670 bytes**, with unchanged source dimensions and no frame crops or text overlays.
- Final static build: **164,117,230 bytes** across 812 files; increase over the recorded 5.9.17 build: **7,348,850 bytes**.
- Sum of JavaScript gzip: **673,509 / 675,000 bytes**; CSS gzip: **104,714 bytes**. Budgets were not raised.
- Fresh deliveries including service-worker installation: TCG **3,210,515 bytes**, Adventure **4,385,956 bytes**, Auto Chess **3,578,508 bytes**. Offline reload passed in each mode.
- No introductory artwork is requested before opening the book. Measurement details are in `initial-load.json` and `../release/build-size.json`.

The regular rights check retains the repository's thirteen existing evidence-pending rows; the twelve new pages are registered with their generation prompts and source/output hashes. This update does not claim commercial clearance for those older assets.

Automated browser coverage uses Chromium viewport emulation. Physical-device review and PR merge are left to the project owner.
