# Wrap bare <img src="/items/N.jpg"> in <picture> with WebP source on promo landing pages.
# Idempotent, reversible (backs up originals). UTF-8 no-BOM preserved.
param([switch]$Apply)

$root  = "C:\Users\DELL\ymarket\website"
$items = Join-Path $root "items"
$files = @("butcher-catalog","butcher-ecommerce","butcher-shops","cleaning-companies") |
         ForEach-Object { Join-Path $root "promo\$_.html" }

$enc = New-Object System.Text.UTF8Encoding($false)   # UTF-8 without BOM
$stamp = "webp_backup"
$total = 0; $skipped = 0; $sample = $null

foreach ($f in $files) {
  $html = [IO.File]::ReadAllText($f, $enc)
  $rx = [regex]'<img\b(?<attrs>[^>]*?)\bsrc="/items/(?<id>\d+)\.(?<ext>jpe?g)"(?<rest>[^>]*?)/?>'
  $cnt = 0
  $new = $rx.Replace($html, {
    param($m)
    $id = $m.Groups['id'].Value
    $webp = Join-Path $items "$id.webp"
    if (-not (Test-Path $webp)) { $script:skipped++; return $m.Value }   # no webp -> leave as-is
    $img = $m.Value
    if ($img -match 'loading=') { $img = $img -replace 'loading="[^"]*"','loading="lazy"' }
    else { $img = $img -replace '<img\b','<img loading="lazy"' }
    $script:cnt++
    if (-not $script:sample) { $script:sample = "BEFORE: $($m.Value)`nAFTER : <picture><source srcset=`"/items/$id.webp`" type=`"image/webp`">$img</picture>" }
    "<picture><source srcset=`"/items/$id.webp`" type=`"image/webp`">$img</picture>"
  })
  $name = Split-Path $f -Leaf
  "{0,-24} matches wrapped: {1}" -f $name, $cnt
  $total += $cnt
  if ($Apply -and $cnt -gt 0) {
    [IO.File]::WriteAllText("$f.$stamp", $html, $enc)   # backup original
    [IO.File]::WriteAllText($f, $new, $enc)
  }
}
""
if ($sample) { $sample }
""
"TOTAL wrapped: $total   skipped (no webp): $skipped   mode: $(if($Apply){'APPLIED + backups written'}else{'DRY-RUN'})"
