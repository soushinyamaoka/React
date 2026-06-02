# HomeGear 開発環境を再起動するスクリプト

$ErrorActionPreference = 'Continue'

Write-Host '==> 再起動 (停止 -> 起動)' -ForegroundColor Cyan

& "$PSScriptRoot\stop-dev.ps1"

Write-Host ''
Start-Sleep -Seconds 2

& "$PSScriptRoot\start-dev.ps1"
