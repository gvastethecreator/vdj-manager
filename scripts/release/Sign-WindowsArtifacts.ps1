[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string[]]$Path,
  [Parameter(Mandatory=$true)][string]$PfxPath,
  [Parameter(Mandatory=$true)][string]$PfxPassword,
  [Parameter(Mandatory=$true)][string]$TimestampUrl,
  [string]$Description='VDJ Manager',
  [string]$DescriptionUrl='https://github.com/gvastethecreator/vdj-manager'
)
$ErrorActionPreference='Stop'
if (!(Test-Path $PfxPath -PathType Leaf)) { throw "Certificate not found: $PfxPath" }
if ([string]::IsNullOrWhiteSpace($PfxPassword)) { throw 'PfxPassword must not be empty.' }
$tool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (!$tool) { throw 'signtool.exe was not found. Install the Windows SDK.' }
foreach ($item in $Path) {
  $file=(Resolve-Path $item -ErrorAction Stop).Path
  & $tool.Source sign /fd SHA256 /f $PfxPath /p $PfxPassword /tr $TimestampUrl /td SHA256 /d $Description /du $DescriptionUrl /a $file
  if ($LASTEXITCODE -ne 0) { throw "Signing failed: $file" }
  & $tool.Source verify /pa /all /tw $file
  if ($LASTEXITCODE -ne 0) { throw "Verification failed: $file" }
}
Write-Host "Signed and verified $($Path.Count) artifact(s)."