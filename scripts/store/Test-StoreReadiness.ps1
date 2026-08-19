param(
  [switch]$RequireSubmissionReady
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$required = @(
  'docs/store/README.md',
  'docs/store/LISTING.md',
  'docs/store/CERTIFICATION-NOTES.md',
  'PRIVACY.md',
  'src-tauri/tauri.microsoftstore.conf.json'
)
foreach ($path in $required) {
  if (-not (Test-Path (Join-Path $root $path))) { throw "Missing Store contract: $path" }
}
$pkg = Get-Content (Join-Path $root 'src-tauri/tauri.microsoftstore.conf.json') -Raw | ConvertFrom-Json
if ($pkg.bundle.targets -notcontains 'nsis') { throw 'Store target must include NSIS.' }
if ($pkg.bundle.windows.nsis.installMode -ne 'currentUser') { throw 'Store installer must be current-user.' }
if ($pkg.bundle.windows.nsis.webviewInstallMode.type -ne 'offlineInstaller') { throw 'Store installer must bundle WebView2 offline.' }
$readme = Get-Content (Join-Path $root 'docs/store/README.md') -Raw
if ($readme -notmatch 'versioned.*HTTPS|versioned HTTPS') { throw 'Store runbook must define immutable HTTPS hosting.' }
if ($RequireSubmissionReady) {
  throw 'Submission-ready gate is intentionally blocked until Partner Center identity, signing, hosting, updater, and clean-VM evidence are configured.'
}
Write-Output 'VDJ Manager Store readiness: structural contracts OK; external release gates remain open.'
