$ErrorActionPreference = 'Stop'
$root = 'c:\Users\INAC\Downloads\Proposta-definitivo\temp-vue-project\src'
$exts = @('.vue', '.js', '.html')
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object { $exts -contains $_.Extension }

# Regex patterns for replacement (FA5 -> FA6)
$patterns = @(
  # Prefix migrations
  @{ Pattern = 'class=("|\'')\s*fas\b'; Replace = 'class=$1fa-solid' },
  @{ Pattern = 'class=("|\'')\s*fa-regular\b'; Replace = 'class=$1fa-solid' },

  # Icon name migrations
  @{ Pattern = '\bfa-home\b'; Replace = 'fa-house' },
  @{ Pattern = '\bfa-cog\b'; Replace = 'fa-gear' },
  @{ Pattern = '\bfa-file-alt\b'; Replace = 'fa-file-lines' },
  @{ Pattern = '\bfa-file-text\b'; Replace = 'fa-file-lines' },
  @{ Pattern = '\bfa-tools\b'; Replace = 'fa-screwdriver-wrench' },
  @{ Pattern = '\bfa-shield-alt\b'; Replace = 'fa-shield-halved' },
  @{ Pattern = '\bfa-edit\b'; Replace = 'fa-pen-to-square' },
  @{ Pattern = '\bfa-times-circle\b'; Replace = 'fa-circle-xmark' },
  @{ Pattern = '\bfa-check-circle\b'; Replace = 'fa-circle-check' },
  @{ Pattern = '\bfa-plus-circle\b'; Replace = 'fa-circle-plus' },
  @{ Pattern = '\bfa-search\b'; Replace = 'fa-magnifying-glass' },
  @{ Pattern = '\bfa-cogs\b'; Replace = 'fa-gears' },
  @{ Pattern = '\bfa-map-marker-alt\b'; Replace = 'fa-location-dot' },
  @{ Pattern = '\bfa-info-circle\b'; Replace = 'fa-circle-info' },
  @{ Pattern = '\bfa-undo\b'; Replace = 'fa-rotate-left' },
  @{ Pattern = '\bfa-save\b'; Replace = 'fa-floppy-disk' },
  @{ Pattern = '\bfa-pen-to-square\s*-\s*to-square\b'; Replace = 'fa-pen-to-square' }
)

$updated = 0
foreach ($f in $files) {
  $content = Get-Content -Path $f.FullName -Raw -Encoding UTF8
  $new = $content
  foreach ($p in $patterns) {
    $new = [Regex]::Replace($new, $p.Pattern, $p.Replace)
  }
  if ($new -ne $content) {
    Set-Content -Path $f.FullName -Value $new -Encoding UTF8
    Write-Host "Updated: $($f.FullName)" -ForegroundColor Green
    $updated++
  }
}
Write-Host "Total files updated: $updated" -ForegroundColor Cyan