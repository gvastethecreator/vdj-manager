# Windows artifact hosting

Use Cloudflare R2 behind a production custom domain as the canonical binary origin.

## Versioned layout

```text
https://downloads.example.com/vdj-manager/0.1.0/vdj-manager-0.1.0-windows-x64.exe
```

Never use a mutable `latest` URL as the Partner Center package URL.

Recommended object layout:

```text
vdj-manager/<version>/
  vdj-manager-<version>-windows-x64.exe
  SHA256SUMS.txt
  release-evidence.json
```

The upload must be conditional/no-overwrite. A release job must fail if the object key already exists.

## CI credentials

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL
```

The R2 credentials should have write access only to the release bucket. The public custom domain is read-only from the user's perspective.

## Verification

After upload, download the exact final HTTPS URL and compare its SHA-256 to the local release manifest before the URL is entered into Partner Center.

Use a Cloudflare R2 custom domain for production. The `r2.dev` public URL is intended for development/non-production use.
