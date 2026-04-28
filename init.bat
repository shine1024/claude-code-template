@echo off
chcp 65001 > nul
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_FILE=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $f = $env:SCRIPT_FILE; $s = (Get-Content $f -Raw) -replace '(?s)[\s\S]*?# ---PS_START---\r?\n', ''; $env:SCRIPT_DIR = $env:SCRIPT_DIR.TrimEnd('\'); Invoke-Expression $s }"
pause
exit /b

# ---PS_START---
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ScriptDir = $env:SCRIPT_DIR

# ── 1. 대상 경로 확인
Write-Host "초기화할 프로젝트 경로를 입력하세요:"
Write-Host "예) C:\intellij-workspace\uniflow"
$TargetPath = Read-Host ">"

if (-not (Test-Path $TargetPath -PathType Container)) {
    Write-Host "[오류] 경로를 찾을 수 없습니다: $TargetPath"
    exit 1
}

$TargetClaude = Join-Path $TargetPath ".claude"

# ── 2. 진행 확인
Write-Host ""
Write-Host "[경로] $TargetPath"
if (Test-Path $TargetClaude) {
    Write-Host "[경고] 기존 .claude 폴더가 존재합니다. 삭제 후 새로 생성됩니다."
}
Write-Host ""
$Confirm = Read-Host "진행하시겠습니까? (y/n)"

if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Host "취소되었습니다."
    exit 0
}

# ── 3. .claude 폴더 복사
Write-Host ""
Write-Host ".claude 폴더 복사 중..."

if (Test-Path $TargetClaude) {
    Remove-Item $TargetClaude -Recurse -Force
}
New-Item $TargetClaude -ItemType Directory | Out-Null

Copy-Item (Join-Path $ScriptDir ".claude\guides")        $TargetClaude -Recurse
Copy-Item (Join-Path $ScriptDir ".claude\hooks")         $TargetClaude -Recurse
Copy-Item (Join-Path $ScriptDir ".claude\rules")         $TargetClaude -Recurse
Copy-Item (Join-Path $ScriptDir ".claude\skills")        $TargetClaude -Recurse
Copy-Item (Join-Path $ScriptDir ".claude\settings.json") $TargetClaude

Write-Host "복사 완료"

# ── 4. SYNC_HASH 기록
$Hash = git -C $ScriptDir rev-parse HEAD 2>$null
if ($Hash) {
    Set-Content (Join-Path $TargetClaude "SYNC_HASH") $Hash.Trim()
}

# ── 5. settings.local.json 생성
Write-Host ""
Write-Host "settings.local.json 생성 중..."

$JsonContent = "{
  `"env`": {
    `"TEMPLATE_REPO_URL`": `"sync-template 스킬 — claude-code-template 저장소 URL (비워두면 업데이트 체크 비활성)`",
    `"SLACK_BOT_TOKEN`": `"Slack 알림 훅 — Bot Token (xoxb-...)`",
    `"SLACK_USER_EMAIL`": `"Slack 알림 훅 — 슬랙 개인 계정 메일주소`",
    `"SESSION_USER_NAME`": `"session-log·share-rules — 작성자 이름`",
    `"PROJECT_NAME`": `"session-log·share-rules·analyze-report — 프로젝트명 (시트의 project 컬럼 / 보고서 헤더에 기록)`",
    `"GOOGLE_SERVICE_ACCOUNT_KEY_PATH`": `"Google Sheets 연동 — 서비스 계정 JSON 키 경로`",
    `"GOOGLE_SHEETS_FEEDBACK_ID`": `"Google Sheets 연동 — 대상 Spreadsheet ID`",
    `"GOOGLE_SHEETS_SESSION_LOG_GID`": `"session-log·analyze-report — 회고 시트의 gid`",
    `"GOOGLE_SHEETS_PERSONAL_RULES_GID`": `"share-rules·analyze-report — 개인 규칙 시트의 gid`",
    `"REDMINE_URL`": `"redmine 스킬 — Redmine 서버 URL`",
    `"REDMINE_API_KEY`": `"redmine 스킬 — 개인 API 키`",
    `"REDMINE_DEFAULT_PROJECT`": `"redmine 스킬 — 기본 프로젝트 식별자`",
    `"REDMINE_DEFAULT_TRACKER_ID`": `"redmine 스킬 — 기본 트래커 ID`",
    `"REDMINE_DEFAULT_ASSIGNED_TO_ID`": `"redmine 스킬 — 기본 담당자 ID`",
    `"REDMINE_DEFAULT_VERSION_ID`": `"redmine 스킬 — 기본 버전 ID`",
    `"REDMINE_DEFAULT_PRIORITY_ID`": `"redmine 스킬 — 기본 우선순위 ID`"
  }
}"

$JsonPath = Join-Path $TargetClaude "settings.local.json"
[System.IO.File]::WriteAllText($JsonPath, $JsonContent, [System.Text.Encoding]::UTF8)

Write-Host "settings.local.json 생성 완료"

# ── 6. CLAUDE.local.md 생성
Write-Host ""
Write-Host "CLAUDE.local.md 생성 중..."

$LocalMdPath = Join-Path $TargetPath "CLAUDE.local.md"
if (Test-Path $LocalMdPath) {
    Write-Host "[건너뜀] CLAUDE.local.md 가 이미 존재합니다."
} else {
    $LocalMdContent = "# 개인 설정 (CLAUDE.local.md)`r`n`r`n## 규칙 작성 모드`r`n`r`n# 팀 기본값(CLAUDE.md)과 다르게 설정하려면 아래 주석 중 하나를 해제하세요.`r`n# RULE_MODE: direct   <- CLAUDE.md에 바로 반영`r`n# RULE_MODE: local    <- CLAUDE.local.md에 먼저 기록`r`n`r`n## 공유 가능`r`n`r`n## 비공유`r`n"
    [System.IO.File]::WriteAllText($LocalMdPath, $LocalMdContent, [System.Text.Encoding]::UTF8)
    Write-Host "CLAUDE.local.md 생성 완료"
}

Write-Host ""
Write-Host "초기화 완료!"
Write-Host ""
Write-Host "다음 단계:"
Write-Host "1. CLAUDE.md 를 생성하세요: /init-claude-md"
Write-Host "2. .gitignore 에 CLAUDE.local.md, .claude/settings.local.json, .claude/SYNC_HASH 를 추가하세요."
Write-Host "3. .claude/settings.local.json 의 TEMPLATE_REPO_URL 을 입력하면 자동 업데이트 알림이 활성화됩니다."
Write-Host "4. CLAUDE.local.md 의 규칙 작성 모드를 필요 시 조정하세요."
