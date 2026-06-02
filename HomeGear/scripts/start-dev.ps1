# HomeGear 開発環境を一括起動するスクリプト
# - PostgreSQL を Docker で detach 起動
# - API サーバを別ウィンドウで起動（タイトル: HomeGear API）
# - Expo を別ウィンドウで起動（タイトル: HomeGear Mobile）

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '==> HomeGear 開発環境を起動します' -ForegroundColor Cyan

# 1. Docker Desktop が起動しているか確認
# PowerShell 5.1 はネイティブコマンドの stderr を $ErrorActionPreference='Stop' 配下で
# 例外化してしまうため、cmd 経由で stdout/stderr を nul に捨てて終了コードだけ受け取る。
Write-Host '--> Docker の状態を確認中...'
cmd /c 'docker info >nul 2>&1'
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker Desktop が起動していません。先に Docker Desktop を起動してください。' -ForegroundColor Red
    exit 1
}

# 2. PostgreSQL を detach で起動
Write-Host '--> PostgreSQL を起動中 (docker compose up -d)...'
Push-Location $repoRoot
try {
    docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'PostgreSQL の起動に失敗しました。' -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# 3. API を別ウィンドウで起動
Write-Host '--> API サーバを別ウィンドウで起動中...'
$apiCommand = "`$Host.UI.RawUI.WindowTitle = 'HomeGear API'; Set-Location '$repoRoot'; npm run api:dev"
$apiProc = Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $apiCommand) -PassThru

# 4. Expo を別ウィンドウで起動
Write-Host '--> Expo を別ウィンドウで起動中...'
$mobileCommand = "`$Host.UI.RawUI.WindowTitle = 'HomeGear Mobile'; Set-Location '$repoRoot'; npm run mobile:start"
$mobileProc = Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $mobileCommand) -PassThru

# 5. 停止スクリプトのために PID を一時ファイルへ保存
$pidsFile = Join-Path $repoRoot '.homegear-dev-pids.json'
@{
    api    = $apiProc.Id
    mobile = $mobileProc.Id
} | ConvertTo-Json | Set-Content -Path $pidsFile -Encoding UTF8

Write-Host ''
Write-Host '==> 起動完了' -ForegroundColor Green
Write-Host '   - PostgreSQL : localhost:5432 (バックグラウンド)'
Write-Host '   - API        : 別ウィンドウ "HomeGear API"  (http://localhost:4000)'
Write-Host '   - Expo       : 別ウィンドウ "HomeGear Mobile"'
Write-Host ''
Write-Host '停止は scripts\stop-dev.bat または npm run stop で実行してください。'
