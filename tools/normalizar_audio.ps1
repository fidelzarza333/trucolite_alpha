<#
.SYNOPSIS
  Normalización de audio para Trucolite Alpha v1.1
  Objetivo Música: -16 LUFS integrado, -1.5 dBTP máx (LRA 11)
  Objetivo SFX:    -14 LUFS integrado, -1.0 dBTP máx (LRA 11)
  SFX cortos (<1s): Pico a -3 dBFS
#>

param (
    [string]$FfmpegPath = "C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe",
    [string]$FfprobePath = "C:\Users\Usuario\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe",
    [string]$SourceDir = "assets\audio",
    [string]$StagingDir = "assets\audio_staging",
    [string]$ReportCsv = "reporte_normalizacion.csv"
)

$ErrorActionPreference = "Continue"

if (!(Test-Path $FfmpegPath)) {
    Write-Error "No se encontró ffmpeg en: $FfmpegPath"
    exit 1
}
if (!(Test-Path $FfprobePath)) {
    Write-Error "No se encontró ffprobe en: $FfprobePath"
    exit 1
}

# Crear carpetas de staging respetando subcarpetas
if (Test-Path $StagingDir) {
    Remove-Item $StagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
New-Item -ItemType Directory -Path "$StagingDir\SFX" -Force | Out-Null

$results = [System.Collections.Generic.List[PSObject]]::new()

function Get-AudioProperties($file) {
    $dur = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $file
    $sr = & $FfprobePath -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 $file
    $ch = & $FfprobePath -v error -select_streams a:0 -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 $file
    return @{
        Duration = [double]$dur
        SampleRate = [int]$sr
        Channels = [int]$ch
    }
}

function Measure-Loudnorm($file, $targetI, $targetTP) {
    $af = "loudnorm=I=${targetI}:TP=${targetTP}:LRA=11:print_format=json"
    $out = & $FfmpegPath -hide_banner -nostats -i $file -af $af -f null - 2>&1
    $rawStr = ($out | Out-String)
    if ($rawStr -match '(?s)(\{\s*"input_i".*?\})') {
        return ($matches[1] | ConvertFrom-Json)
    }
    Write-Warning "No se pudo extraer JSON de loudnorm para $file"
    return $null
}

function Measure-PeakVolume($file) {
    $out = & $FfmpegPath -hide_banner -nostats -i $file -af "volumedetect" -f null - 2>&1
    $rawStr = ($out | Out-String)
    if ($rawStr -match 'max_volume:\s*(-?[\d\.]+)\s*dB') {
        return [double]$matches[1]
    }
    return 0.0
}

# 1. PROCESAR MÚSICA (Archivos .mp3 en raíz de assets/audio)
$musicFiles = Get-ChildItem -Path $SourceDir -File -Filter "*.mp3"
Write-Host "=== Procesando Música (Objetivo: -16 LUFS, -1.5 dBTP) ===" -ForegroundColor Cyan

foreach ($file in $musicFiles) {
    Write-Host "Procesando Música: $($file.Name)..."
    $props = Get-AudioProperties $file.FullName
    $outPath = Join-Path $StagingDir $file.Name

    # Pasada 1: Medir
    $m = Measure-Loudnorm $file.FullName "-16" "-1.5"
    if ($null -eq $m) { continue }
    $lufsBefore = $m.input_i
    $tpBefore = $m.input_tp

    # Pasada 2: Aplicar en modo lineal
    $afLinear = "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$($m.input_i):measured_TP=$($m.input_tp):measured_LRA=$($m.input_lra):measured_thresh=$($m.input_thresh):offset=$($m.target_offset):linear=true"
    & $FfmpegPath -hide_banner -nostats -y -i $file.FullName -af $afLinear -ar $props.SampleRate -ac $props.Channels -codec:a libmp3lame -q:a 2 -map_metadata 0 $outPath 2>&1 | Out-Null

    # Verificación
    $ver = Measure-Loudnorm $outPath "-16" "-1.5"
    $lufsAfter = if ($ver) { $ver.input_i } else { "N/A" }
    $tpAfter = if ($ver) { $ver.input_tp } else { "N/A" }

    $results.Add([PSCustomObject]@{
        archivo = $file.Name
        categoria = "MÚSICA"
        lufs_antes = "$lufsBefore LUFS"
        lufs_despues = "$lufsAfter LUFS"
        peak_antes = "$tpBefore dBTP"
        peak_despues = "$tpAfter dBTP"
        observaciones = "Normalizado loudnorm 2-pass lineal (-16 LUFS / -1.5 dBTP)"
    })
}

# 2. PROCESAR SFX (Archivos en assets/audio/SFX)
$sfxFiles = Get-ChildItem -Path "$SourceDir\SFX" -File
Write-Host "`n=== Procesando SFX (Objetivo: -14 LUFS, -1.0 dBTP o Pico -3 dBFS si <1s) ===" -ForegroundColor Cyan

foreach ($file in $sfxFiles) {
    Write-Host "Procesando SFX: $($file.Name)..."
    $props = Get-AudioProperties $file.FullName
    $outPath = Join-Path "$StagingDir\SFX" $file.Name

    if ($props.Duration -lt 1.0) {
        # SFX Corto: normalización por pico a -3 dBFS
        $peakBefore = Measure-PeakVolume $file.FullName
        $gainDb = -3.0 - $peakBefore
        
        if ($file.Extension -eq ".wav") {
            & $FfmpegPath -hide_banner -nostats -y -i $file.FullName -af "volume=${gainDb}dB" -ar $props.SampleRate -ac $props.Channels -c:a pcm_s16le -map_metadata 0 $outPath 2>&1 | Out-Null
        } else {
            & $FfmpegPath -hide_banner -nostats -y -i $file.FullName -af "volume=${gainDb}dB" -ar $props.SampleRate -ac $props.Channels -codec:a libmp3lame -q:a 2 -map_metadata 0 $outPath 2>&1 | Out-Null
        }

        $peakAfter = Measure-PeakVolume $outPath

        $results.Add([PSCustomObject]@{
            archivo = "SFX/$($file.Name)"
            categoria = "SFX"
            lufs_antes = "N/A"
            lufs_despues = "N/A"
            peak_antes = "$peakBefore dBFS"
            peak_despues = "$peakAfter dBFS"
            observaciones = "SFX corto (<1s), normalizado por pico a -3 dBFS (ganancia: $($gainDb.ToString('F2')) dB)"
        })
    } else {
        # SFX Normal: loudnorm -14 LUFS / -1.0 dBTP
        $m = Measure-Loudnorm $file.FullName "-14" "-1.0"
        if ($null -eq $m) { continue }
        $lufsBefore = $m.input_i
        $tpBefore = $m.input_tp

        $afLinear = "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$($m.input_i):measured_TP=$($m.input_tp):measured_LRA=$($m.input_lra):measured_thresh=$($m.input_thresh):offset=$($m.target_offset):linear=true"
        
        if ($file.Extension -eq ".wav") {
            & $FfmpegPath -hide_banner -nostats -y -i $file.FullName -af $afLinear -ar $props.SampleRate -ac $props.Channels -c:a pcm_s16le -map_metadata 0 $outPath 2>&1 | Out-Null
        } else {
            & $FfmpegPath -hide_banner -nostats -y -i $file.FullName -af $afLinear -ar $props.SampleRate -ac $props.Channels -codec:a libmp3lame -q:a 2 -map_metadata 0 $outPath 2>&1 | Out-Null
        }

        $ver = Measure-Loudnorm $outPath "-14" "-1.0"
        $lufsAfter = if ($ver) { $ver.input_i } else { "N/A" }
        $tpAfter = if ($ver) { $ver.input_tp } else { "N/A" }

        $results.Add([PSCustomObject]@{
            archivo = "SFX/$($file.Name)"
            categoria = "SFX"
            lufs_antes = "$lufsBefore LUFS"
            lufs_despues = "$lufsAfter LUFS"
            peak_antes = "$tpBefore dBTP"
            peak_despues = "$tpAfter dBTP"
            observaciones = "Normalizado loudnorm 2-pass lineal (-14 LUFS / -1.0 dBTP)"
        })
    }
}

# Generar reporte CSV
$results | Export-Csv -Path $ReportCsv -NoTypeInformation -Encoding utf8
Write-Host "`nReporte generado con éxito en: $ReportCsv" -ForegroundColor Green
