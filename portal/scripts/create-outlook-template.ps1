# =============================================================================
# Wallaroo FC — Outlook Template (.oft) generator
# =============================================================================
# Drives Outlook via COM to turn reference/outlook-letterhead.html into a
# proper binary .oft file. Run on a Windows machine with Outlook installed.
#
#   Right-click → "Run with PowerShell"
#   …or from PowerShell:
#       cd path\to\wallaroofc
#       powershell -ExecutionPolicy Bypass -File scripts\create-outlook-template.ps1
#
# Output:  reference\WFC-Letterhead.oft
#
# Doing it this way (rather than synthesising the compound-file binary
# ourselves) means Outlook produces the .oft, so every MAPI property is set
# correctly and the resulting template is indistinguishable from one you
# create via File → Save As → Outlook Template.
# =============================================================================

$ErrorActionPreference = "Stop"

# Paths are resolved relative to the repo root, regardless of where the
# script is invoked from.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Resolve-Path (Join-Path $scriptDir "..")
$htmlPath  = Join-Path $repoRoot "reference\outlook-letterhead.html"
$oftPath   = Join-Path $repoRoot "reference\WFC-Letterhead.oft"

if (-not (Test-Path $htmlPath)) {
    throw "HTML source not found at $htmlPath. Run 'pnpm render:outlook' first."
}

Write-Host "Reading HTML from $htmlPath"
$html = Get-Content -Path $htmlPath -Raw -Encoding UTF8

Write-Host "Launching Outlook COM…"
$outlook = New-Object -ComObject Outlook.Application

try {
    # 0 = olMailItem
    $mail = $outlook.CreateItem(0)
    $mail.Subject  = "Wallaroo FC correspondence"
    $mail.HTMLBody = $html

    # 2 = olTemplate (.oft)
    if (Test-Path $oftPath) { Remove-Item $oftPath -Force }
    $mail.SaveAs($oftPath, 2)

    Write-Host "✔ Created template at $oftPath"
}
finally {
    # 1 = olDiscard — don't leave a draft in Outlook.
    if ($null -ne $mail) { $mail.Close(1) | Out-Null }
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($outlook) | Out-Null
}
