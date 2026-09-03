[CmdletBinding()]
param(
  [string]$OutputPath,
  [string]$LiveUrl = "https://tama-hub.xvps.jp/tama-info/",
  [string]$Voice = "Microsoft Zira Desktop",
  [int]$Port = 8787,
  [switch]$ReuseCapture,
  [switch]$KeepWorkFiles
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$videoSource = Join-Path $repoRoot "submission\video-work"
$timelinePath = Join-Path $videoSource "narration.json"
$recorderPath = Join-Path $videoSource "record-demo.mjs"
$buildRoot = Join-Path $videoSource ".build"
if (-not $OutputPath) {
  $OutputPath = Join-Path $repoRoot "submission\challenge-demo-final.mp4"
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

function Resolve-Executable {
  param([string[]]$Names, [string[]]$Fallbacks = @())
  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
  }
  foreach ($candidate in $Fallbacks) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
  }
  return $null
}

function Format-SrtTime {
  param([double]$Seconds)
  $time = [TimeSpan]::FromSeconds($Seconds)
  return "{0:00}:{1:00}:{2:00},{3:000}" -f [Math]::Floor($time.TotalHours), $time.Minutes, $time.Seconds, $time.Milliseconds
}

function Format-SubtitleText {
  param([string]$Text, [int]$Width = 86)
  $lines = [System.Collections.Generic.List[string]]::new()
  $current = ""
  foreach ($word in ($Text -split "\s+")) {
    $candidate = if ($current) { "$current $word" } else { $word }
    if ($current -and $candidate.Length -gt $Width) {
      $lines.Add($current)
      $current = $word
    } else {
      $current = $candidate
    }
  }
  if ($current) { $lines.Add($current) }
  return $lines -join "`n"
}

function Invoke-Checked {
  param([string]$FilePath, [string[]]$Arguments)
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $FilePath"
  }
}

if (-not (Test-Path -LiteralPath $timelinePath -PathType Leaf)) { throw "Missing timeline: $timelinePath" }
if (-not (Test-Path -LiteralPath $recorderPath -PathType Leaf)) { throw "Missing recorder: $recorderPath" }

$bundledDependencies = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies"
$node = Resolve-Executable -Names @("node") -Fallbacks @(
  (Join-Path $bundledDependencies "node\bin\node.exe")
)
$php = Resolve-Executable -Names @("php")
$ffmpeg = Resolve-Executable -Names @("ffmpeg") -Fallbacks @(
  "C:\Program Files\YYDesktopCaption\ffmpeg.exe",
  "C:\Program Files\ffmpeg\bin\ffmpeg.exe"
)
$browser = Resolve-Executable -Names @("msedge") -Fallbacks @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if (-not $node) { throw "Node.js is required" }
if (-not $php) { throw "PHP is required to serve the same-origin demo" }
if (-not $ffmpeg) { throw "A full FFmpeg build with libx264, AAC, and libass is required" }
if (-not $browser) { throw "Microsoft Edge is required for automated capture" }

$runtimeNodeModules = Join-Path $bundledDependencies "node\node_modules"
$playwrightModule = Join-Path $runtimeNodeModules "playwright"
if (-not (Test-Path -LiteralPath $playwrightModule -PathType Container)) {
  throw "Bundled Playwright module was not found: $playwrightModule"
}
$env:PLAYWRIGHT_MODULE = $playwrightModule

$playwrightCli = Join-Path $playwrightModule "cli.js"
$playwrightFfmpeg = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA "ms-playwright") -Filter "ffmpeg-win64.exe" -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $playwrightFfmpeg) {
  Write-Host "Installing Playwright's capture-only FFmpeg component..."
  Invoke-Checked -FilePath $node -Arguments @($playwrightCli, "install", "ffmpeg")
}

New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $OutputPath) -Force | Out-Null

$timeline = Get-Content -LiteralPath $timelinePath -Raw -Encoding UTF8 | ConvertFrom-Json
$totalDuration = [double](($timeline | Measure-Object -Property duration -Sum).Sum)
if ($totalDuration -ge 180) { throw "Challenge demo must be under 180 seconds; configured duration is $totalDuration" }

$subtitleLines = [System.Collections.Generic.List[string]]::new()
$concatLines = [System.Collections.Generic.List[string]]::new()
$cursor = 0.0
$speaker = $null
$startedServer = $null

try {
  Add-Type -AssemblyName System.Speech
  $speaker = [System.Speech.Synthesis.SpeechSynthesizer]::new()
  $availableVoices = @($speaker.GetInstalledVoices() | Where-Object Enabled | ForEach-Object { $_.VoiceInfo })
  $selectedVoice = $availableVoices | Where-Object Name -eq $Voice | Select-Object -First 1
  if (-not $selectedVoice) {
    $selectedVoice = $availableVoices | Where-Object { $_.Culture.Name -like "en-*" } | Select-Object -First 1
  }
  if (-not $selectedVoice) { throw "No installed English Windows TTS voice was found" }
  $speaker.SelectVoice($selectedVoice.Name)
  $speaker.Rate = -1
  $speaker.Volume = 100

  for ($index = 0; $index -lt $timeline.Count; $index++) {
    $scene = $timeline[$index]
    $cuePath = Join-Path $buildRoot ("cue-{0:00}.wav" -f $index)
    $segmentPath = Join-Path $buildRoot ("segment-{0:00}.wav" -f $index)
    $speaker.SetOutputToWaveFile($cuePath)
    $speaker.Speak([string]$scene.narration)
    $speaker.SetOutputToNull()

    $durationText = ([double]$scene.duration).ToString("0.###", [Globalization.CultureInfo]::InvariantCulture)
    $audioFilter = "adelay=450|450,apad=pad_dur=$durationText,atrim=0:$durationText"
    Invoke-Checked -FilePath $ffmpeg -Arguments @(
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", $cuePath,
      "-af", $audioFilter,
      "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
      $segmentPath
    )

    $concatLines.Add("file '$($segmentPath.Replace("'", "''"))'")
    $subtitleLines.Add([string]($index + 1))
    $subtitleLines.Add("$(Format-SrtTime ($cursor + 0.35)) --> $(Format-SrtTime ($cursor + [double]$scene.duration - 0.35))")
    $subtitleLines.Add((Format-SubtitleText ([string]$scene.narration)))
    $subtitleLines.Add("")
    $cursor += [double]$scene.duration
  }

  $concatPath = Join-Path $buildRoot "audio-concat.txt"
  $captionsPath = Join-Path $buildRoot "captions-en.srt"
  [IO.File]::WriteAllLines($concatPath, $concatLines, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllLines($captionsPath, $subtitleLines, [Text.UTF8Encoding]::new($false))

  $narrationPath = Join-Path $buildRoot "narration.wav"
  Invoke-Checked -FilePath $ffmpeg -Arguments @(
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "concat", "-safe", "0", "-i", $concatPath,
    "-c:a", "pcm_s16le", $narrationPath
  )

  $serverUri = "http://127.0.0.1:$Port/"
  try {
    $serverResponse = Invoke-WebRequest -Uri $serverUri -Method Head -TimeoutSec 2 -UseBasicParsing
  } catch {
    $serverLog = Join-Path $buildRoot "php-server.log"
    $serverErrorLog = Join-Path $buildRoot "php-server-error.log"
    $startedServer = Start-Process -FilePath $php -ArgumentList @("-S", "127.0.0.1:$Port", "-t", $repoRoot) -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $serverLog -RedirectStandardError $serverErrorLog
    $deadline = [DateTime]::UtcNow.AddSeconds(15)
    do {
      Start-Sleep -Milliseconds 250
      try { $serverResponse = Invoke-WebRequest -Uri $serverUri -Method Head -TimeoutSec 2 -UseBasicParsing } catch { $serverResponse = $null }
    } until ($serverResponse -or [DateTime]::UtcNow -ge $deadline)
    if (-not $serverResponse) { throw "Local PHP server did not start on $serverUri" }
  }

  $runnerUrl = "http://127.0.0.1:$Port/submission/video-work/demo-runner.html?live=$([Uri]::EscapeDataString($LiveUrl))"
  $rawVideo = Join-Path $buildRoot "challenge-demo-raw.webm"
  $recordingMetadata = Join-Path $buildRoot "recording-meta.json"
  if (-not ($ReuseCapture -and (Test-Path -LiteralPath $rawVideo -PathType Leaf) -and (Test-Path -LiteralPath $recordingMetadata -PathType Leaf))) {
    Invoke-Checked -FilePath $node -Arguments @(
      $recorderPath,
      "--url", $runnerUrl,
      "--output", $rawVideo,
      "--browser", $browser,
      "--metadata", $recordingMetadata,
      "--timeout", "45000"
    )
  } else {
    Write-Host "Reusing the existing automated screen capture."
  }

  $metadata = Get-Content -LiteralPath $recordingMetadata -Raw -Encoding UTF8 | ConvertFrom-Json
  $trimStart = ([double]$metadata.trimStartSeconds).ToString("0.###", [Globalization.CultureInfo]::InvariantCulture)
  $duration = $totalDuration.ToString("0.###", [Globalization.CultureInfo]::InvariantCulture)
  $safeOutput = $OutputPath

  Push-Location $buildRoot
  try {
    $subtitleFilter = "trim=start=$trimStart`:duration=$duration,setpts=PTS-STARTPTS,subtitles='captions-en.srt':force_style='FontName=Arial,FontSize=12,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101010,BorderStyle=3,BackColour=&H99000000,Outline=1,Shadow=0,MarginV=28,Alignment=2'"
    Invoke-Checked -FilePath $ffmpeg -Arguments @(
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", "challenge-demo-raw.webm",
      "-i", "narration.wav",
      "-filter:v", $subtitleFilter,
      "-map", "0:v:0", "-map", "1:a:0",
      "-t", $duration,
      "-c:v", "libx264", "-preset", "slow", "-crf", "18",
      "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
      "-movflags", "+faststart",
      $safeOutput
    )
  } finally {
    Pop-Location
  }

  $previousErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $probeOutput = (& $ffmpeg -hide_banner -i $OutputPath 2>&1 | ForEach-Object { $_.ToString() }) -join "`n"
  } finally {
    $ErrorActionPreference = $previousErrorPreference
  }
  # `ffmpeg -i` exits with 1 when used only as a metadata probe. The output is
  # validated below, so do not leak that expected probe status to callers.
  $global:LASTEXITCODE = 0
  $durationMatch = [regex]::Match($probeOutput, "Duration:\s*(\d{2}:\d{2}:\d{2}\.\d+)")
  $videoCodecPresent = $probeOutput -match "Video:\s*h264"
  $audioCodecPresent = $probeOutput -match "Audio:\s*aac"
  if (-not $durationMatch.Success -or -not $videoCodecPresent -or -not $audioCodecPresent) {
    throw "Final MP4 verification failed"
  }

  [pscustomobject]@{
    Output = $OutputPath
    Duration = $durationMatch.Groups[1].Value
    UnderThreeMinutes = ($totalDuration -lt 180)
    Video = "H.264 1920x1080 30fps"
    Audio = "AAC 48kHz English TTS ($($selectedVoice.Name))"
    Subtitles = "Burned English captions, exact narration text"
    Scenes = $timeline.Count
    ToolCalls = @($metadata.events | Where-Object type -eq "tool").Count
    LiveUrl = $LiveUrl
  } | Format-List
} finally {
  if ($speaker) { $speaker.Dispose() }
  if ($startedServer -and -not $startedServer.HasExited) {
    Stop-Process -Id $startedServer.Id -ErrorAction SilentlyContinue
  }
  if (-not $KeepWorkFiles) {
    Get-ChildItem -LiteralPath $buildRoot -Filter "cue-*.wav" -File -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem -LiteralPath $buildRoot -Filter "segment-*.wav" -File -ErrorAction SilentlyContinue | Remove-Item -Force
  }
}
