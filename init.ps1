# init.ps1
# claude-code-template의 .claude/ 폴더를 신규 프로젝트에 초기화

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── 1. 대상 경로 확인
if ($args.Count -gt 0) {
    $TargetPath = $args[0]
} else {
    Write-Host "초기화할 프로젝트 경로를 입력하세요:"
    Write-Host "예) C:\intellij-workspace\uniflow"
    $TargetPath = Read-Host ">"
}

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

Copy-Item (Join-Path $PSScriptRoot ".claude\hooks")         $TargetClaude -Recurse
Copy-Item (Join-Path $PSScriptRoot ".claude\rules")         $TargetClaude -Recurse
Copy-Item (Join-Path $PSScriptRoot ".claude\skills")        $TargetClaude -Recurse
Copy-Item (Join-Path $PSScriptRoot ".claude\settings.json") $TargetClaude
Copy-Item (Join-Path $PSScriptRoot ".claude\sync.bat")      $TargetClaude
Copy-Item (Join-Path $PSScriptRoot ".claude\sync.ps1")      $TargetClaude

Write-Host "복사 완료"

# ── 4. 환경변수 입력
Write-Host ""
Write-Host "========================================================================"
Write-Host " settings.local.json 환경변수 설정"
Write-Host " (입력하지 않으면 해당 항목은 생략됩니다)"
Write-Host "========================================================================"

Write-Host ""
Write-Host "init-claude-md / analyze-feedback 스킬  =>  claude-code-template 프로젝트 경로"
Write-Host "예) C:\projects\claude-code-template"
$ValTemplatePath = Read-Host "CLAUDE_CODE_TEMPLATE_PATH"

Write-Host ""
Write-Host "Slack 알림 훅  =>  슬랙 개인 계정 메일주소"
$ValSlackEmail = Read-Host "SLACK_USER_EMAIL"

Write-Host ""
Write-Host "session-log 스킬  =>  회고 제출 시 기록될 이름"
$ValLogName = Read-Host "SESSION_LOG_NAME"

Write-Host ""
Write-Host "session-log 스킬  =>  Google Apps Script 배포 URL"
$ValLogUrl = Read-Host "SESSION_LOG_SCRIPT_URL"

Write-Host ""
Write-Host "analyze-feedback 스킬  =>  Google 서비스 계정 JSON 키 파일 경로"
Write-Host "예) C:\Users\{username}\.claude\google-sa-key.json"
$ValSaKey = Read-Host "GOOGLE_SERVICE_ACCOUNT_KEY_PATH"

Write-Host ""
Write-Host "analyze-feedback 스킬  =>  피드백 Google Spreadsheet ID"
$ValSheetsId = Read-Host "SHEETS_FEEDBACK_ID"

# ── 5. settings.local.json 생성
Write-Host ""
Write-Host "settings.local.json 생성 중..."

$EnvMap = [ordered]@{}
if ($ValTemplatePath) { $EnvMap["CLAUDE_CODE_TEMPLATE_PATH"]       = $ValTemplatePath }
if ($ValSlackEmail)   { $EnvMap["SLACK_USER_EMAIL"]                = $ValSlackEmail }
if ($ValLogName)      { $EnvMap["SESSION_LOG_NAME"]                = $ValLogName }
if ($ValLogUrl)       { $EnvMap["SESSION_LOG_SCRIPT_URL"]          = $ValLogUrl }
if ($ValSaKey)        { $EnvMap["GOOGLE_SERVICE_ACCOUNT_KEY_PATH"] = $ValSaKey }
if ($ValSheetsId)     { $EnvMap["SHEETS_FEEDBACK_ID"]             = $ValSheetsId }

$Json = @{ env = $EnvMap } | ConvertTo-Json -Depth 3
$JsonPath = Join-Path $TargetClaude "settings.local.json"
[System.IO.File]::WriteAllText($JsonPath, $Json, [System.Text.Encoding]::UTF8)

Write-Host "settings.local.json 생성 완료"
Write-Host ""
Write-Host "초기화 완료!"
Write-Host ""
Write-Host "다음 단계:"
Write-Host "1. CLAUDE.md 를 생성하세요: /init-claude-md"
Write-Host "2. CLAUDE.local.md 를 작성하고 .gitignore 에 추가하세요."
Write-Host "3. .gitignore 에 .claude/settings.local.json 을 추가하세요."
