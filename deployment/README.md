# Bullgram WebK — API layer 229

URL: https://webk.duckdns.org/
Source: https://webk.duckdns.org/source/bullgram-webk-source.tar.gz
Upstream: morethanwords/tweb, pinned commit8197da75 (Layer229), GPLv3.

Local checkout: /home/ubuntu/Documents/bullgram-webk
Production root: /opt/bullgram-webk/current -> releases/20261121-tgs-fix
Service: bullgram-webk-bridge; /opt/bullgram-webk/venv, websockets15.0.1.
Transport: browser WSS /apiws -> Caddy -> 127.0.0.1:9081 -> existing127.0.0.1:42000 MTProto.
Bridge accepts binary frames, fixed backend and exact Origin only. It does not decrypt MTProto, log its payloads or supply authentication. Client trusts only the existing production RSA public key. No production private key was copied into the client.

Existing opensource binary/database and services retained. Caddy previous config: /opt/bullgram-webk/backups/Caddyfile.before. Separate domain block added after validation; existing websites preserved.

Changes: custom endpoint, RSA public key, identity/branding, root PWA identity, no official HTTP transport fallback; guard for unknown nearest country (XX from loopback); upstream minifier workaround for story peer default argument. TypeScript excludes generated release/reports/deployment directories.

Build: npx pnpm@11.16.0 install --frozen-lockfile; npx pnpm@11.16.0 build. package_release.py retains public assets and overlays dist, includes complete corresponding GPL source. Packaging does not commit or push anything.

Validation: initial suite3081pass/46skip. Second full suite3079pass plus2manifest expectations for original Telegram /k/; adapted manifest suite3/3passes. Final typecheck passes,261production chunks pass miscompilation check. Fixed bridge resPQ roundtrip and foreignOrigin403 verified. HTTPS200, valid TLS certificate, bridge listener loopback9081, existing serverSHA d9636f97f06c24987b541dcb7e006cca5dfce474a2f73af97f7015e1eb608a88 unchanged. Browser received real auth.exportLoginToken on layer229 and showed QR. Final browser check covers QR/phone views and desktop/mobile rendering. No account sign-in, message sending, payments, or account creation performed; post-login feature compatibility requires user login.

Final browser run:0pageerrors; real QRtoken, phonecountryandnumberfieldsrender; desktop1366/mobile390screenshotsinsidereports. ExpectedblobURLabortsoccurwhenQRanimationsareunmounted. No failedHTTPassetrequests. Reviewedchangesfor duplicatedcode:existingdcConfigurator,RSAmanagerandcountryinputwereadapted;no duplicateMTProtoclientorUIintroduced.

2026-11-21: TGS MIME recognition fixed for arbitrary filenames; see reports/tgs-fix/IMPLEMENTATION.md. Existing TCP stream fix retained. Final full client suite3104pass46skip; actual public TGS rendered on live client.

Runtime compatibility: Caddy first serves current/, then runtime-assets/ for missing public bundles. retain_runtime_assets.py collects JS/CSS/WASM/maps from published releases, preserving old tabs' lazy imports. Do not delete these bundles during a normal update. Upload a new release archive to releases/<name>.tar.gz, install retain_runtime_assets.py + activate_release.py in /opt/bullgram-webk/, then run `python3 /opt/bullgram-webk/activate_release.py <name>`; it extracts the release, retains public bundles BEFORE switching current atomically and records the prior target. Caddy validation/reload is needed only for config changes. 2026-11-21: gift profile page size lowered99→24; regression covers pagination of471items without duplication/loss.

Latest release20261121-stickers-fix, version2.2(677). Future updates must increment VITE_VERSION_FULL/VITE_BUILD and public/version together. See reports/stickers-fix/IMPLEMENTATION.md for missing-document batching fix and verification limits.
