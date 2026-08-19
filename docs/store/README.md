# Microsoft Store readiness

`VDJ Manager` is a Windows Tauri v2 application. The Store target uses the Microsoft Store **EXE/MSI submission path** for the current native packaging model.

## Current status

**Not submission-ready.** This document is an executable release contract, not a claim that a signed Store installer already exists.

### Gates

- [ ] Reserve `VDJ Manager` in Partner Center as EXE/MSI.
- [ ] Confirm product identity, publisher and package metadata.
- [ ] Obtain a publicly trusted Windows code-signing identity.
- [ ] Configure RFC 3161 timestamping.
- [ ] Produce a signed installer and verify every shipped PE file.
- [ ] Publish each submitted installer at an immutable versioned HTTPS URL.
- [ ] Implement and qualify the signed Tauri updater; Store EXE/MSI submissions do not provide Store-managed updates.
- [ ] Validate clean install, upgrade, uninstall and file association behaviour on a clean Windows VM.
- [ ] Review privacy policy, listing copy, screenshots and age rating.
- [ ] Submit with a publication hold and retain certification evidence.

## Required package contract

The submitted URL must resolve directly to a versioned `.exe` or `.msi`. Never replace the bytes behind a submitted URL.

Recommended shape:

```text
https://downloads.example.com/vdj-manager/0.1.0/vdj-manager-0.1.0-windows-x64.exe
```

The release record must contain the URL, SHA-256, version, signer subject, timestamp authority and build commit.

## Security contract

The installer and all executable PE files shipped by it must be Authenticode signed by a certificate chaining to a CA trusted by Windows. Self-signed certificates are development-only and must never be submitted.

The Tauri updater must use its own signed update metadata and embedded public key. The update channel must reject invalid signatures, downgrades and unexpected product identifiers.

## Application-specific certification notes

VDJ Manager edits user-owned VirtualDJ libraries. Certification evidence must demonstrate that:

1. Opening a library is read-only.
2. A mutation always has an explicit user action.
3. Backups are created before destructive writes.
4. Atomic commit and journal recovery preserve the original library when a write fails.
5. The application never uploads music libraries or local files as part of normal operation.
6. The deterministic web demo does not access the user's filesystem.
7. Uninstall does not delete VirtualDJ libraries, backups or user documents.

## Release sequence

```text
verify
  -> build frontend
  -> cargo test/clippy
  -> build Store candidate
  -> Authenticode verification
  -> clean-VM lifecycle
  -> publish immutable URL
  -> compare hosted bytes to evidence
  -> Partner Center certification
```

See [`LISTING.md`](LISTING.md), [`CERTIFICATION-NOTES.md`](CERTIFICATION-NOTES.md), and [`RELEASE-EVIDENCE.md`](RELEASE-EVIDENCE.md).
