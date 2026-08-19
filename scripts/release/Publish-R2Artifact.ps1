[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$File,
  [Parameter(Mandatory=$true)][string]$Version,
  [Parameter(Mandatory=$true)][string]$Bucket,
  [Parameter(Mandatory=$true)][string]$AccountId,
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [string]$Prefix='vdj-manager'
)
$ErrorActionPreference='Stop'
if (!(Get-Command aws.exe -ErrorAction SilentlyContinue)) { throw 'AWS CLI is required for Cloudflare R2 publishing.' }
$filePath=(Resolve-Path $File -ErrorAction Stop).Path
$name=Split-Path $filePath -Leaf
$key="$Prefix/$Version/$name"
$endpoint="https://$AccountId.r2.cloudflarestorage.com"
$existing=& aws s3api head-object --bucket $Bucket --key $key --endpoint-url $endpoint 2>$null
if ($LASTEXITCODE -eq 0) { throw "Refusing to overwrite immutable object: $key" }
$sha=(Get-FileHash $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
$type=if($name -match '\.msi$'){'application/x-msi'}elseif($name -match '\.zip$'){'application/zip'}else{'application/octet-stream'}
& aws s3api put-object --bucket $Bucket --key $key --body $filePath --endpoint-url $endpoint --region auto --if-none-match '*' --content-type $type --cache-control 'public,max-age=31536000,immutable' --metadata "sha256=$sha,version=$Version"
if($LASTEXITCODE -ne 0){throw "R2 upload failed: $key"}
[ordered]@{version=$Version;file=$name;sha256=$sha;key=$key;url="$($BaseUrl.TrimEnd('/'))/$key"}|ConvertTo-Json