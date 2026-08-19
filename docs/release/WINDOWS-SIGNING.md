# Windows release signing

`VDJ Manager` uses the same production Authenticode contract for direct distribution and the Microsoft Store EXE/MSI channel.

## Publisher strategy

The release owner is an individual developer in Argentina. Microsoft currently limits Azure Artifact Signing Public Trust for individual developers to the US and Canada. Unless eligibility changes, use a publicly trusted OV code-signing certificate from a CA whose chain is trusted by Windows.

For Store EXE/MSI submissions, Microsoft requires the installer and all shipped PE files to be signed by a certificate chaining to a CA in the Microsoft Trusted Root Program.

## Contract

- SHA-256 (`/fd SHA256`)
- RFC 3161 timestamp (`/tr` + `/td SHA256`)
- trusted code-signing certificate
- stable publisher identity
- post-signing `signtool verify /pa /all /tw`
- SHA-256 release evidence

For an exportable PFX delivery, the CI secret contract is:

```text
WINDOWS_SIGNING_PFX_BASE64
WINDOWS_SIGNING_PFX_PASSWORD
WINDOWS_SIGNING_TIMESTAMP_URL
WINDOWS_SIGNING_SUBJECT
```

If the CA uses non-exportable/cloud/HSM signing, use its supported GitHub Actions integration rather than exporting the key.

## VDJ-specific requirement

The signed candidate must include every PE shipped by the Tauri bundle. The release gate must not stop at the outer NSIS installer. The application executable and native helper DLL/EXE payloads must also verify successfully.

## Channel separation

```text
GitHub/direct release -> signed artifact -> immutable download
Store EXE/MSI        -> signed artifact -> versioned Partner Center URL
```

A Store-submitted URL must never be repointed to different bytes.
