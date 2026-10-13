# Web 4.9 size check

Production output: 78,502,429 bytes / 457 files. JS gzip: 644,598 / 650,000 bytes. CSS gzip: 98,501 bytes. No development/source-map leaks.

Growth from Web 4.8: 61,431 bytes. No new runtime dependencies or media. Shared TCG/Auto chess assets are reused.

The 5,000,000-byte allowance started at Web 4.7 (74,274,916 bytes). Web 4.8 and 4.9 together add 4,227,513 bytes, leaving 772,487 bytes. `release:size` enforces the remaining allowance and the existing 650 KB JS ceiling.
