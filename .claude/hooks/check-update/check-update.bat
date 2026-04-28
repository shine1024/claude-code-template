@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-update.ps1"
exit /b 0
