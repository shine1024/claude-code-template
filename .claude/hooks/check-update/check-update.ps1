[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# TEMPLATE_REPO_URL 미설정 시 기능 꺼짐
$repoUrl = $env:TEMPLATE_REPO_URL
if (-not $repoUrl) { exit 0 }

# 세션 1회 체크 (Claude Code 프로세스를 세션 키로 사용)
$cwdHash = [System.Math]::Abs((Get-Location).Path.GetHashCode()).ToString()
try {
    # powershell($PID) ← cmd.exe(bat) ← Claude Code
    $parent = Get-Process -Id (Get-Process -Id $PID -ErrorAction Stop).Parent.Id -ErrorAction Stop
    $gp     = Get-Process -Id $parent.Parent.Id -ErrorAction Stop
    $sessionKey = "$($gp.Id)_$($gp.StartTime.ToString('yyyyMMddHHmmss'))"
} catch {
    $sessionKey = Get-Date -Format "yyyyMMddHH"  # 추적 실패 시 1시간 단위 fallback
}
$lockFile = Join-Path $env:TEMP "claude-update-check-${cwdHash}-${sessionKey}"
if (Test-Path $lockFile) { exit 0 }

# 로컬 SYNC_HASH 읽기
$hashFile = ".claude/state/SYNC_HASH"
if (-not (Test-Path $hashFile)) { exit 0 }
$localHash = (Get-Content $hashFile -Raw).Trim()

# lock 파일 먼저 생성 (네트워크 실패 시 재시도 방지)
New-Item $lockFile -ItemType File -Force | Out-Null

# 원격 HEAD hash 조회
try {
    $remoteOutput = & git ls-remote $repoUrl HEAD 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $remoteOutput) { exit 0 }
    $remoteHash = ($remoteOutput -split '\s+')[0].Trim()
} catch {
    exit 0
}

if ($localHash -ne $remoteHash) {
    Write-Output "[claude-code-template 업데이트 알림] 공통 템플릿에 새 변경사항이 있습니다. '/sync-template' 스킬을 실행하면 최신 버전으로 동기화됩니다."
}

exit 0
