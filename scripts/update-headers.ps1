# update-headers.ps1
# Replaces the old copyright block in all source files with the ELv2 header.
# Run this once before making the repository public.
#
# Usage: pwsh scripts/update-headers.ps1

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$extensions = @("*.ts", "*.tsx", "*.css", "*.mjs")
$exclude = @("**/node_modules/**", "**/.next/**", "**/prisma/generated/**")

# Both variants that exist in the codebase (single and double space before year)
$oldPatterns = @(
    " * @copyright  2026 ColdByDefault. All Rights Reserved.",
    " * @copyright 2026 ColdByDefault. All Rights Reserved."
)

$newLines = @(
    " * @copyright 2026 ColdByDefault",
    " * SPDX-License-Identifier: Elastic-2.0"
)

$files = Get-ChildItem -Path $root -Recurse -Include $extensions |
    Where-Object {
        $path = $_.FullName
        -not ($path -match "node_modules") -and
        -not ($path -match "\.next") -and
        -not ($path -match "prisma[\\/]generated")
    }

$updated = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $changed = $false

    foreach ($old in $oldPatterns) {
        if ($content.Contains($old)) {
            $content = $content.Replace($old, ($newLines -join "`n"))
            $changed = $true
            break
        }
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.FullName.Replace($root.Path, '.'))"
        $updated++
    }
}

Write-Host ""
Write-Host "Done. $updated file(s) updated."
