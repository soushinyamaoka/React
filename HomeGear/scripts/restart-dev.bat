@echo off
REM HomeGear 開発環境を再起動 (ダブルクリック対応)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart-dev.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 再起動に失敗しました。
    pause
    exit /b %ERRORLEVEL%
)
