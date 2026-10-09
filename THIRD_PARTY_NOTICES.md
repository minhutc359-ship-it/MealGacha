# Third-party notices · Soul of Meal 3.3

The application is proprietary unless its actual rights holders grant a separate license. It is **not CC0, public domain or universally “copyright free.”** Library licenses do not license the project's art, story or branding.

- [Distributed license texts](public/legal/THIRD_PARTY_LICENSES.txt): full installed permissive license notices, GSAP's retained notice and license URL, both font OFL texts, and OpenStreetMap attribution. Also served at `/legal/THIRD_PARTY_LICENSES.txt`.
- [Versioned dependency inventory](rights/DEPENDENCIES.json): declared runtime dependency graph; some entries are removed by bundler tree shaking. Development tools are not part of the game payload.
- [Asset fingerprints and provenance](rights/ASSET_REGISTER.json): every shipped image/audio asset, SHA-256, size, origin category and available project evidence. This is an inventory, not a legal clearance certificate.
- [Commercial-release review](rights/COMMERCIAL_RELEASE.md): actions needed before publishing commercially or transferring ownership.

GSAP 3.15.0 uses the [Standard No Charge License](https://gsap.com/standard-license/), **not MIT**. It permits ordinary commercial website/app use; it restricts competing visual animation-building tools. Preserve its proprietary notices and examine the actual terms before redistribution or changes to the product.

Place data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Attribute the data source when displaying results. If distributing a derived database, review ODbL obligations; ODbL does not automatically make all application code open source. Photon/Overpass are external services, not bundled datasets or a promise of unrestricted free service.

Be Vietnam Pro and Exo 2 use SIL OFL 1.1. The exact upstream license notices and source blob IDs are retained in `rights/fonts/` and the dependency inventory. The web app currently loads Google Fonts remotely; an offline native build must bundle fonts and these notices.

The MIT notice for `@pixi/colord` is retained from its declared upstream `omgovich/colord` because the installed package omits a license file. The source license blob is recorded in the generated notices. Other license texts are copied from the actual installed packages.

Regenerate after dependency or asset changes with `pnpm release:records`; check freshness with `pnpm release:verify`. These tools are in `dev/` and are not required to build the product.
