@echo off
chcp 65001 > nul
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_FILE=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $f = $env:SCRIPT_FILE; $s = (Get-Content $f -Raw -Encoding UTF8) -replace '(?s)[\s\S]*?# ---PS_START---\r?\n', ''; $env:SCRIPT_DIR = $env:SCRIPT_DIR.TrimEnd('\'); Invoke-Expression $s }"
pause
exit /b

# ---PS_START---
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ScriptDir = $env:SCRIPT_DIR

$RepoUrl = "http://unidocu/gitlab/claude-code/claude-code-template.git"
$TempDir = Join-Path $env:TEMP "claude-code-template-$(Get-Random)"

# 1. 임시 경로에 clone
Write-Host "claude-code-template 최신화 중..."
git clone --depth 1 -c core.autocrlf=true $RepoUrl $TempDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "[오류] clone 실패"
    exit 1
}
Write-Host "최신화 완료"

# 2. 현재 프로젝트 .claude/ 로 복사
Write-Host ""
Write-Host ".claude 폴더 동기화 중..."

foreach ($dir in @("guides", "hooks", "rules", "skills")) {
    $target = Join-Path $ScriptDir $dir
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item (Join-Path $TempDir ".claude\$dir") $ScriptDir -Recurse
}

Copy-Item (Join-Path $TempDir ".claude\settings.json") $ScriptDir -Force
Copy-Item (Join-Path $TempDir ".claude\sync.bat")      $ScriptDir -Force

# 3. 임시 폴더 정리
Remove-Item $TempDir -Recurse -Force

Write-Host "동기화 완료"
Write-Host ""
Write-Host "Sync 완료! 변경된 파일을 확인 후 git commit 해주세요."
Write-Host ""
Read-Host "엔터를 눌러 종료"
