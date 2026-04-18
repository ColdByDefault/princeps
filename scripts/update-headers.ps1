# update-headers.ps1
# Normalises all copyright headers in source files to the canonical form.
# Uses regex to match any variant of the author block — safe to run multiple times.
#
# Usage: pwsh scripts/update-headers.ps1

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$extensions = @("*.ts", "*.tsx", "*.css", "*.mjs")

# Canonical target header
$canonical = "/**`n * @author ColdByDefault`n * @copyright 2026 ColdByDefault`n * @license See License`n * @version beta`n * @since beta`n * @module`n * @description`n */"

# Matches any /** ... */ block that contains @author ColdByDefault
$pattern = '(?s)/\*\*[\s\S]*?@author\s+ColdByDefault[\s\S]*?\*/'

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

    # Skip files that already have the exact canonical block
    if ($content.Contains($canonical)) { continue }

    if ($content -match $pattern) {
        $newContent = [regex]::Replace($content, $pattern, $canonical)
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.FullName.Replace($root.Path, '.'))"
        $updated++
    }
}

Write-Host ""
Write-Host "Done. $updated file(s) updated."
