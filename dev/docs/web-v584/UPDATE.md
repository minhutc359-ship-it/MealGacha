# Auto chess stage and distribution safeguards · 16 October 2026

This update extends PR #51 on `feat/web-v582-spells-story-map`. On 16 October the owner explicitly authorized pushing all changes to the currently public repository and will change visibility separately. It does not merge to master or alter native projects.

## Research and decision

The current renderer already separates 20 Hz simulation from requestAnimationFrame presentation. Preserve that engine and its seeded balance rather than replacing gameplay with a different 3D demo. MDN recommends caching repeated Canvas work and using requestAnimationFrame; Riot's rendering articles describe common rendering interfaces and profiling as useful principles, not a license to reuse their implementation or art.

- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- https://www.riotgames.com/en/news/trip-down-lol-graphics-pipeline
- https://www.riotgames.com/en/legal (section 3: no unauthorized use of Riot IP in games/apps)
- https://www.wipo.int/en/web/copyright/activities/software (expression versus ideas)
- https://vite.dev/config/build-options (production source-map options)

The result is a 2.5D billboard stage. It is not real-time rigged 3D and has not been benchmarked against TFT. A full 3D conversion would require original meshes, rigs, animation clips, a GPU renderer and device profiling for every character; none is represented as completed here.

## Implemented

- One perspective projection drives 36 stone tiles, actor feet, effect anchors and clipped HTML pointer targets. Actors stay upright, get depth-scaled sizing and are sorted by floor depth. Keyboard and existing drag/drop/inspection handlers remain attached to the same cell IDs.
- Static stone floor and raised front rim are cached at canvas resolution. Existing regional artwork remains behind the stage. No external game assets or new image files are added, and no existing media is re-encoded.
- One tested pose selector covers all 44 units and 24 monsters/bosses, across base, seven-frame, 24-frame and HD atlases. Anticipation/contact/recovery use the real action.hit rather than a fixed percentage of action duration. Continuous body motion supplies stride, breathing and impact rhythm even to short atlases. Exactly one pose is drawn, avoiding ghost silhouettes.
- Existing source artwork retains its actual resolution. This update improves compositing and animation uniformly; it does not claim to have redrawn every character in HD. School VFX, skills, star upgrades and ward/departure effects remain shared across solo and PvP.
- Render adaptation now receives measured drawing cost as well as frame gap. Atlas leases unused for five seconds are released, allowing the existing decoded-byte LRU to evict sheets from earlier rounds. PvP interpolation time is no longer restarted by unrelated local UI renders and stops on pause/pending scene.
- Simulation, combat timings, damage, RNG, saves, roster IDs, economy and rewards are unchanged.

## Terms, privacy and rights

The single policy source and three generated standalone HTML pages are updated together to policy version 2026-10-16. Scope now names web 5.8 and Adventure. Terms explain the personal play license, restrictions on unauthorized source/media redistribution, mandatory legal exceptions and independent design. Rights explain that browser JavaScript is inspectable, AI output is not automatically exclusive, attribution does not supply a missing license, and public forks/cache may survive later access changes. Existing runtime third-party notices are retained.

The repository is currently PUBLIC. Source bundling checks and terms do not hide a public GitHub repository. Repository visibility was not changed by this update. The owner authorized this public-branch update; repository privacy will be handled separately by the owner. Moving it to private, restricting collaborators and reviewing prior public forks/copies require owner administration. Browser-required JS remains downloadable even with a private repository; sensitive logic/secrets must live on an authenticated server. No promise of absolute source secrecy is made.

The asset register still reports 13 owner-verification-required entries. A new `release:rights` command lists the exact paths; `release:commercial` refuses while unresolved entries exist. Do not change their review labels without reviewing evidence or replacing the assets. Recorded provenance for the other entries is also not a legal certificate. Publisher identity, a private contact channel, commercial service terms and trademark clearance remain owner matters already recorded in rights/COMMERCIAL_RELEASE.md.

`releaseGuard.mjs` runs after every production build, including Vercel builds where dev/ is excluded. It rejects authored source/config directories, environment files, source maps (including embedded references), archives, recognized credential patterns and symlinks in dist. This is a bounded accidental-disclosure check, not a complete secret scanner. The web ZIP packager invokes it too. The source ZIP route remains an explicit development action and its output stays under ignored dev/artifacts/.

## Verification

- 56 test files / 644 tests passed. Whole-catalog tests exercise action boundaries, all frame indices, death, reduced motion and presentation immutability for every unit/monster; projection tests check all 36 pointer polygons and shared edges.
- Production and dev typechecks, catalog validation (123 dishes / 9 events), asset validation (142 static references), release record verification and service-worker syntax passed.
- Node release-guard test rejects representative source/map/archive/env/credential/symlink injections and accepts a clean build.
- Build: 259,775,197 bytes / 672 files; JS gzip 670,762 bytes, CSS gzip 103,343 bytes; zero release leaks. Existing limits remain 260 MB and 675 KB JS gzip.
- Native Canvas raster inspection verified the actual stage helper with project atlas poses and the regional background. This is static visual inspection, not browser interaction QA or frame-rate measurement.
- Browser interaction QA could not run in this environment: the managed preview requires the unavailable control-browser capability. No new browser/device/60 FPS measurements are claimed. Existing PR #51 browser results describe the previous revision only.

## Source-link removal before publication

The owner requested that policies expose no project repository link. In-app policies, standalone HTML, app license and recovery support navigation now use local legal information. No private support address was supplied, so the UI states that a private channel is not yet published; it does not invent an email, collect reports or claim that they are being received. Third-party upstream license/attribution URLs remain intact. The production guard now rejects the project repository identifier in textual output, and regression tests preserve upstream URLs while rejecting this project URL.
