@echo off
REM HomeGear 開発環境を一括起動 (ダブルクリック対応)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 起動に失敗しました。
    pause
    exit /b %ERRORLEVEL%
)
