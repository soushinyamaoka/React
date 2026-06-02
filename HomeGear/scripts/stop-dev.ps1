# HomeGear 開発環境を一括停止するスクリプト
# - HomeGear API / Mobile ウィンドウを終了
# - 4000 (API) / 8081 (Expo) ポートを掴んでいる残骸 node プロセスを kill
# - PostgreSQL コンテナを停止 (docker compose down)

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '==> HomeGear 開発環境を停止します' -ForegroundColor Cyan

# 指定 PID を「プロセスツリーごと」終了するヘルパ。
# Stop-Process -Force は単体しか kill しないため、Windows では taskkill /T /F でツリー一括終了が確実。
# stderr/stdout は cmd 経由で nul に捨てて PowerShell 例外化を避ける。
function Stop-TreeById {
    param([int]$ProcessId)
    if ($ProcessId -le 0) { return }
    cmd /c "taskkill /T /F /PID $ProcessId >nul 2>&1"
}

# 1. start-dev.ps1 が保存した PID ファイルを参照して各ウィンドウ (powershell.exe) を終了
Write-Host '--> HomeGear ウィンドウを終了中...'
$pidsFile = Join-Path $repoRoot '.homegear-dev-pids.json'
if (Test-Path $pidsFile) {
    try {
        $pids = Get-Content $pidsFile -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($entry in @(@{ label = 'API'; pid = $pids.api }, @{ label = 'Mobile'; pid = $pids.mobile })) {
            $targetPid = $entry.pid
            if ($targetPid) {
                $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "    停止: PID=$targetPid ($($entry.label)) ツリー終了"
                    Stop-TreeById -ProcessId $targetPid
                } else {
                    Write-Host "    既に終了: PID=$targetPid ($($entry.label))"
                }
            }
        }
    } catch {
        Write-Host "    PID ファイル読み込み失敗: $_" -ForegroundColor Yellow
    }
    Remove-Item -Path $pidsFile -ErrorAction SilentlyContinue
} else {
    # PID ファイルが無い場合の fallback: タイトル一致のものを kill
    Write-Host '    PID ファイルが見つかりません。タイトル一致を試みます。'
    $targets = Get-Process | Where-Object { $_.MainWindowTitle -like 'HomeGear *' }
    if ($targets) {
        foreach ($p in $targets) {
            Write-Host "    停止: PID=$($p.Id) Title=$($p.MainWindowTitle) ツリー終了"
            Stop-TreeById -ProcessId $p.Id
        }
    } else {
        Write-Host '    対象ウィンドウは見つかりませんでした。'
    }
}

# 2. ポートを掴んでいる残骸 node プロセスを念のため kill
function Stop-OnPort($port, $label) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) { return }
    foreach ($conn in $connections) {
        $pidValue = $conn.OwningProcess
        if ($pidValue -gt 0) {
            try {
                $proc = Get-Process -Id $pidValue -ErrorAction Stop
                Write-Host "    [$label : port $port] 残骸を停止: PID=$pidValue Name=$($proc.ProcessName) ツリー終了"
                Stop-TreeById -ProcessId $pidValue
            } catch {}
        }
    }
}
Stop-OnPort 4000 'API'
Stop-OnPort 8081 'Expo'

# 3. PostgreSQL コンテナ停止
Write-Host '--> PostgreSQL を停止中 (docker compose down)...'
Push-Location $repoRoot
try {
    docker compose down
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '==> 停止完了' -ForegroundColor Green
