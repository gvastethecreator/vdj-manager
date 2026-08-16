# Contributing

Thanks for helping improve VDJ Manager. Keep changes focused, preserve the write-safety contracts, and use English for product and documentation copy.

## Local setup

You need Windows, Bun 1.x, Rust with the MSVC toolchain, and the Tauri prerequisites.

```powershell
bun install
bun run tauri dev
```

Use the in-memory demo for frontend work:

```text
http://127.0.0.1:3000/?demo&page=dashboard&state=problem
```

The demo does not access VirtualDJ files.

## Before a pull request

```powershell
bun run verify
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Do not weaken backup, optimistic concurrency, atomic commit, no-clobber, journal, lease, or recovery behavior. Add the smallest relevant regression test when behavior changes.
