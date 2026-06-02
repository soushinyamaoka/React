<#
.SYNOPSIS
  HomeAsset のローカル開発環境（PostgreSQL / API / Expo）を一括で起動・停止・再起動する。

.DESCRIPTION
  start   : PostgreSQL(Docker) を起動し、API と Expo を別ウィンドウで立ち上げる。
  stop    : API と Expo のウィンドウを終了し、PostgreSQL を停止する。
  restart : stop してから start する。
  status  : 各サービスの稼働状況を表示する。

.EXAMPLE
  npm run app:start
  npm run app:stop
  npm run app:restart
  npm run app:status
#>
param(
  [Parameter(Position = 0)]
  [ValidateSet('start', 'stop', 'restart', 'status')]
  [string]$Command = 'start'
)

$ErrorActionPreference = 'Stop'

# scripts/ の親 = プロジェクトルート
$Root = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $Root '.run'
$ApiPidFile = Join-Path $RunDir 'api.pid'
$ExpoPidFile = Join-Path $RunDir 'expo.pid'

function Ensure-RunDir {
  if (-not (Test-Path $RunDir)) {
    New-Item -ItemType Directory -Path $RunDir | Out-Null
  }
}

# 指定した npm script を新しい PowerShell ウィンドウで起動し、その PID を記録する
function Start-ServiceWindow {
  param(
    [string]$Title,
    [string]$NpmScript,
    [string]$PidFile
  )
  $inner = "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$Root'; npm run $NpmScript"
  $proc = Start-Process powershell -PassThru -ArgumentList @('-NoExit', '-Command', $inner)
  $proc.Id | Out-File -FilePath $PidFile -Encoding ascii
  Write-Host ("  {0} を起動しました (PID {1})" -f $Title, $proc.Id) -ForegroundColor Green
}

# PID ファイルに記録されたプロセスを子プロセスごと終了する
function Stop-ByPidFile {
  param(
    [string]$PidFile,
    [string]$Name
  )
  if (-not (Test-Path $PidFile)) {
    Write-Host ("  {0}: 起動記録がありません（スキップ）" -f $Name) -ForegroundColor DarkGray
    return
  }
  $procId = (Get-Content $PidFile | Select-Object -First 1).Trim()
  if ($procId) {
    # /T で子プロセスツリーごと、/F で強制終了。既に閉じている場合のエラーは無視。
    & taskkill /PID $procId /T /F 2>$null | Out-Null
    Write-Host ("  {0} を停止しました (PID {1})" -f $Name, $procId) -ForegroundColor Yellow
  }
  Remove-Item $PidFile -Force
}

# PID ファイルのプロセスが生きているか判定して表示
function Show-PidStatus {
  param(
    [string]$PidFile,
    [string]$Name
  )
  if (-not (Test-Path $PidFile)) {
    Write-Host ("  {0,-6}: 停止" -f $Name) -ForegroundColor DarkGray
    return
  }
  $procId = (Get-Content $PidFile | Select-Object -First 1).Trim()
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($proc) {
    Write-Host ("  {0,-6}: 稼働中 (PID {1})" -f $Name, $procId) -ForegroundColor Green
  }
  else {
    Write-Host ("  {0,-6}: 停止（プロセス無し・記録のみ残存）" -f $Name) -ForegroundColor DarkYellow
  }
}

function Do-Start {
  Ensure-RunDir
  Set-Location $Root

  Write-Host 'PostgreSQL (Docker) を起動中...' -ForegroundColor Cyan
  & docker compose up -d
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose の起動に失敗しました。Docker Desktop が起動しているか確認してください。'
  }

  Write-Host 'API / Expo を別ウィンドウで起動中...' -ForegroundColor Cyan
  Start-ServiceWindow -Title 'HomeAsset API'  -NpmScript 'api:dev'      -PidFile $ApiPidFile
  Start-ServiceWindow -Title 'HomeAsset Expo' -NpmScript 'mobile:start' -PidFile $ExpoPidFile

  Write-Host ''
  Write-Host '起動しました。' -ForegroundColor Green
  Write-Host '  - API ヘルスチェック: http://localhost:4001/health'
  Write-Host '  - Expo: 別ウィンドウの QR コードを Expo Go で読み取ってください'
}

function Do-Stop {
  Write-Host 'API / Expo を停止中...' -ForegroundColor Cyan
  Stop-ByPidFile -PidFile $ExpoPidFile -Name 'Expo'
  Stop-ByPidFile -PidFile $ApiPidFile  -Name 'API'

  Write-Host 'PostgreSQL (Docker) を停止中...' -ForegroundColor Cyan
  Set-Location $Root
  & docker compose down

  Write-Host ''
  Write-Host '停止しました。' -ForegroundColor Green
}

function Do-Status {
  Write-Host '=== HomeAsset サービス状況 ===' -ForegroundColor Cyan
  Show-PidStatus -PidFile $ApiPidFile  -Name 'API'
  Show-PidStatus -PidFile $ExpoPidFile -Name 'Expo'
  Write-Host '  PostgreSQL (Docker):'
  Set-Location $Root
  & docker compose ps
}

switch ($Command) {
  'start' { Do-Start }
  'stop' { Do-Stop }
  'restart' {
    Do-Stop
    Write-Host ''
    Do-Start
  }
  'status' { Do-Status }
}

