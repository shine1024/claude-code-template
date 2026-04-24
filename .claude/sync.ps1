# sync.ps1
# claude-code-template 최신 내용을 현재 프로젝트 .claude/ 폴더에 동기화

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SettingsFile = Join-Path $PSScriptRoot "settings.local.json"

# ── 1. settings.local.json 로드
if (-not (Test-Path $SettingsFile)) {
    Write-Host "[오류] .claude/settings.local.json 파일이 없습니다. 아래 내용으로 생성해주세요."
    Write-Host ""
    Write-Host '{ "env": { "CLAUDE_CODE_TEMPLATE_PATH": "C:/your-path/claude-code-template" } }'
    exit 1
}

$Settings = Get-Content $SettingsFile -Raw | ConvertFrom-Json
$TemplatePath = $Settings.env.CLAUDE_CODE_TEMPLATE_PATH

if (-not $TemplatePath) {
    Write-Host "[오류] settings.local.json 에 CLAUDE_CODE_TEMPLATE_PATH 가 없습니다."
    exit 1
}

if (-not (Test-Path $TemplatePath -PathType Container)) {
    Write-Host "[오류] claude-code-template 경로를 찾을 수 없습니다: $TemplatePath"
    exit 1
}

Write-Host "[경로] $TemplatePath"

# ── 2. claude-code-template git pull
Write-Host ""
Write-Host "claude-code-template 최신화 중..."
Push-Location $TemplatePath
git pull
Pop-Location
Write-Host "최신화 완료"

# ── 3. 현재 프로젝트 .claude/ 로 복사
Write-Host ""
Write-Host ".claude 폴더 동기화 중..."

foreach ($dir in @("guides", "hooks", "rules", "skills")) {
    $target = Join-Path $PSScriptRoot $dir
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item (Join-Path $TemplatePath ".claude\$dir") $PSScriptRoot -Recurse
}

Copy-Item (Join-Path $TemplatePath ".claude\settings.json") $PSScriptRoot -Force
Copy-Item (Join-Path $TemplatePath ".claude\sync.bat")      $PSScriptRoot -Force
Copy-Item (Join-Path $TemplatePath ".claude\sync.ps1")      $PSScriptRoot -Force

Write-Host "동기화 완료"
Write-Host ""
Write-Host "Sync 완료! 변경된 파일을 확인 후 git commit 해주세요."
