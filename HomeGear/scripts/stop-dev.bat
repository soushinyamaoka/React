@echo off
REM HomeGear 開発環境を一括停止 (ダブルクリック対応)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 停止処理でエラーが発生しました。
    pause
    exit /b %ERRORLEVEL%
)
