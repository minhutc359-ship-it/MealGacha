# AW2 character source dossier

Scope: the twelve canonical spirits and their ultimate-v1 illustration pack. This directory records provenance and the basis for using provider outputs. It does not grant an asset license to repository visitors or claim copyright registration, exclusivity, third-party clearance, human legal review or release authorization.

- `provider-use.json`: official provider URLs, reviewed date, specific findings and limits. It does not accept terms or enter an agreement on the user's behalf.
- `character-sources.json`: deterministic inventory of126runtime artwork/audio files and their source/prompt/provenance hashes. Declared external inputs are reported separately from legal clearance. Historical generation records are preserved; rejected tool inputs are not silently presented as locally preserved selected source pixels.
- Original images/prompts remain in `dev/aw2/assets/<unit>/`; original deterministic audio builders and their hashes are recorded. Existing player data and Rương rights records are untouched.

`pnpm release:aw2-rights --check` validates current files and report freshness. `--write` regenerates the report after reviewing an intentional change; it cannot clear rights. `--require-cleared` currently exits2. The production build uses the source/freshness check, while full commercial-release acceptance remains separate.

See [art and runtime guide](../../docs/aw2/ART_AND_RIGHTS.md), [project license](../../LICENSE), [third-party notices](../../THIRD_PARTY_NOTICES.md) and [character readiness](../../docs/aw2/CHARACTER_READINESS.md). No statement here licenses another person's copyright, likeness or trademark.
