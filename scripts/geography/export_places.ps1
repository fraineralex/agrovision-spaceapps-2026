# AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md.
param([Parameter(Mandatory)][string]$Archive)
$ErrorActionPreference = 'Stop'
$zip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Archive).Path)
try {
    $reader = [IO.StreamReader]::new($zip.GetEntry('DO.txt').Open())
    try {
        $rows = while ($null -ne ($line = $reader.ReadLine())) {
            $f = $line.Split("`t")
            if ($f[8] -eq 'DO' -and ($f[6] -eq 'P' -or $f[7] -in 'ADM2','ADM3','ADM4','ADM5')) {
                ,@([int]$f[0], $f[1], [double]$f[5], [double]$f[4], $f[7], $f[11])
            }
        }
    } finally { $reader.Dispose() }
} finally { $zip.Dispose() }
$destination = Join-Path $PSScriptRoot '../../web/public/data/places-do.json'
ConvertTo-Json -InputObject @($rows) -Depth 3 -Compress | Set-Content -LiteralPath $destination -Encoding utf8NoBOM
