---
name: sync-template
description: claude-code-template 공통 설정을 최신화한다. "싱크", "템플릿 업데이트", "sync-template" 등의 요청에 사용한다.
---

## 목적

`TEMPLATE_REPO_URL`에 설정된 저장소에서 최신 `.claude/` 공통 설정을 받아 현재 프로젝트에 적용한다.
원격 HEAD 가 로컬 `SYNC_HASH` 와 동일하면 동기화를 건너뛰고, 변경이 있으면 적용 후 `CHANGES.md` 의 신규 항목을 Slack DM 으로 안내한다.

---

## 1단계: TEMPLATE_REPO_URL 확인

`TEMPLATE_REPO_URL` 환경변수가 비어 있으면 아래 메시지를 출력하고 종료한다.

```
TEMPLATE_REPO_URL이 설정되어 있지 않습니다.
.claude/settings.local.json 의 env 섹션에 TEMPLATE_REPO_URL을 입력한 뒤 다시 시도하세요.
```

---

## 2단계: 원격 HEAD 해시 비교 (변경 없으면 종료)

원격 HEAD 해시만 먼저 조회해 로컬 `.claude/state/SYNC_HASH` 와 비교한다. 같으면 clone·복사를 모두 건너뛰고 종료한다.

```powershell
$RemoteHash = (git ls-remote $env:TEMPLATE_REPO_URL HEAD).Split()[0].Trim()
if (-not $RemoteHash) {
    Write-Host "원격 HEAD 해시 조회에 실패했습니다. TEMPLATE_REPO_URL과 네트워크 연결을 확인하세요."
    exit 1
}

$HashFile = ".claude/state/SYNC_HASH"
$LocalHash = if (Test-Path $HashFile) { (Get-Content $HashFile -Raw).Trim() } else { "" }

if ($LocalHash -eq $RemoteHash) {
    Write-Host "이미 최신 상태입니다. (HEAD: $($RemoteHash.Substring(0,7)))"
    exit 0
}
```

---

## 3단계: 원격 저장소 clone

임시 디렉토리에 full clone 한다. (`--depth 1` 을 쓰지 않는 이유: 4단계에서 `oldHash..HEAD` log 조회가 필요하기 때문. 템플릿 저장소는 작아 비용 무시 가능)

```powershell
$TempDir = Join-Path $env:TEMP "claude-sync-$(Get-Random)"
git -c core.autocrlf=false -c core.eol=lf clone $env:TEMPLATE_REPO_URL $TempDir
```

**`core.autocrlf=false` 로 clone 한다.** 전역 `core.autocrlf=true` 환경에서는 clone 시 working tree 파일이 CRLF 로 체크아웃되어, 5단계 내용 비교에서 LF 인 프로젝트 파일과 전부 불일치 → 모든 파일이 복사되고 프로젝트에 CRLF 가 주입된다. LF 로 체크아웃해야 동일 파일이 일치로 판정되어 실제 변경만 복사된다.

clone 실패 시 아래 메시지를 출력하고 종료한다.

```
저장소 clone에 실패했습니다. TEMPLATE_REPO_URL과 네트워크 연결을 확인하세요.
```

---

## 4단계: CHANGES.md 변경분 추출

`oldHash..HEAD` 구간에서 `CHANGES.md` 에 **추가된 라인**(`+` 시작, `+++` 헤더 제외)만 추출한다. 로컬 hash 가 없으면(초기 동기화) 목록을 비우고 "초기 동기화" 로 표시한다.

```powershell
# CHANGES.md 는 UTF-8 인데 [Console]::OutputEncoding 이 cp949 면 git diff 출력의 한글이
# 캡처 시점에 '?' 로 깨진다. UTF-8 로 지정해 native 명령 출력을 올바로 디코드한다.
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

$Changes = @()
if ($LocalHash) {
    $DiffOut = git -C $TempDir diff "$LocalHash..HEAD" -- CHANGES.md
    if ($DiffOut) {
        $Changes = @($DiffOut -split "`n" |
            Where-Object { $_ -match '^\+' -and $_ -notmatch '^\+\+\+' } |
            ForEach-Object { $_.Substring(1).TrimEnd("`r") })
    }
}

# 단일 항목도 배열로 직렬화되도록 강제
$ChangesJson = if ($Changes.Count -eq 0) { "[]" } else { (ConvertTo-Json @($Changes) -Compress) }
```

CHANGES.md 가 수정되지 않은 동기화 구간(예: 사소한 오타 수정만 있는 커밋)일 수도 있다. 그 경우 `$Changes` 는 빈 배열로 남고, 동기화는 정상적으로 계속 진행된다.

---

## 5단계: 파일 복사

아래 항목을 현재 프로젝트의 `.claude/` 로 복사한다. 각 항목은 기존 내용을 덮어쓴다.

| 복사 대상 | 설명 |
|-----------|------|
| `.claude/` 하위 폴더 전체 (`state/` 제외) | hooks·rules·skills·guides 등 |
| `.claude/settings.json` | 팀 공통 설정 |

```powershell
$TargetClaude = ".claude"
$exclude = @("state")

# 개행 정규화 후 SHA256 (텍스트 트리 기준 — 개행 차이를 무시한 내용 비교)
function Get-NormHash($path) {
    $text = [System.IO.File]::ReadAllText($path) -replace "`r`n", "`n" -replace "`r", "`n"
    $sha  = [System.Security.Cryptography.SHA256]::Create()
    return [BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text)))
}

# 내용이 다른 파일만 덮어쓰고, 템플릿에 없는 파일은 제거한다
function Sync-Tree($srcRoot, $dstRoot) {
    $srcRoot = (Resolve-Path $srcRoot).Path
    if (-not (Test-Path $dstRoot)) { New-Item -ItemType Directory -Force -Path $dstRoot | Out-Null }
    $dstRoot = (Resolve-Path $dstRoot).Path

    # 1) 신규·변경 파일만 복사 (개행 정규화 비교)
    Get-ChildItem $srcRoot -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($srcRoot.Length).TrimStart('\')
        $dst = Join-Path $dstRoot $rel
        $copy = $true
        if (Test-Path $dst -PathType Leaf) {
            if ((Get-NormHash $_.FullName) -eq (Get-NormHash $dst)) { $copy = $false }
        }
        if ($copy) {
            $dstDir = Split-Path $dst -Parent
            if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
            Copy-Item $_.FullName $dst -Force
        }
    }

    # 2) 템플릿에 없는 파일 제거 후 빈 디렉토리 정리
    Get-ChildItem $dstRoot -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($dstRoot.Length).TrimStart('\')
        if (-not (Test-Path (Join-Path $srcRoot $rel) -PathType Leaf)) { Remove-Item $_.FullName -Force }
    }
    Get-ChildItem $dstRoot -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
        if (-not (Get-ChildItem $_.FullName -Force)) { Remove-Item $_.FullName -Force }
    }
}

Get-ChildItem (Join-Path $TempDir ".claude") -Directory |
    Where-Object { $exclude -notcontains $_.Name } |
    ForEach-Object { Sync-Tree $_.FullName (Join-Path $TargetClaude $_.Name) }

# settings.json — 내용이 다를 때만 덮어쓴다
$srcSettings = Join-Path $TempDir ".claude\settings.json"
$dstSettings = Join-Path $TargetClaude "settings.json"
if (-not (Test-Path $dstSettings) -or (Get-NormHash $srcSettings) -ne (Get-NormHash $dstSettings)) {
    Copy-Item $srcSettings $dstSettings -Force
}
```

**폴더를 통째로 삭제·재복사하지 않는다.** 내용이 다른 파일만 덮어쓰고 동일한 파일은 건드리지 않는다(mtime 보존 → stat-dirty phantom 방지). 템플릿에서 삭제된 파일은 대상에서도 제거하여 미러 상태를 유지한다.

내용 비교는 **개행을 정규화(CRLF·CR → LF)한 뒤 해시**한다. `core.autocrlf=true` 환경에서 clone(또는 프로젝트 작업트리)의 개행이 서로 달라도, 내용이 같으면 동일로 판정되어 불필요한 복사·CRLF 주입을 막는다. 단순 바이트 해시는 개행 차이만으로 전부 불일치가 되어 phantom 을 유발하므로 사용하지 않는다.

---

## 6단계: SYNC_HASH 갱신

clone 한 저장소의 HEAD commit hash 를 `.claude/state/SYNC_HASH` 에 저장한다.

```powershell
New-Item -ItemType Directory -Force -Path ".claude/state" | Out-Null
Set-Content ".claude/state/SYNC_HASH" $RemoteHash
```

---

## 7단계: 임시 디렉토리 정리

```powershell
Remove-Item $TempDir -Recurse -Force
```

---

## 8단계: 완료 보고

동기화된 항목과 `CHANGES.md` 신규 항목 요약을 사용자에게 안내한다.

```
동기화 완료! (이전: <oldShort> → 신규: <newShort>)
- .claude/ 하위 폴더 전체 (state/ 제외)
- settings.json

CHANGES.md 신규 항목:
<추출된 추가 라인>

변경된 파일을 확인한 뒤 git commit 해주세요.
```

로컬 hash 가 없었던 경우(초기 동기화)에는 "CHANGES.md 신규 항목" 블록 대신 `(초기 동기화 — 이전 SYNC_HASH 없음)` 로 표시한다. CHANGES.md 가 수정되지 않은 구간이라면 `(CHANGES.md 변경 없음)` 로 표시한다.

---

## 9단계: Slack DM 알림 (옵션)

`SLACK_BOT_TOKEN`·`SLACK_USER_EMAIL` 이 설정되어 있고 `SLACK_NOTIFY_ENABLED` 가 `false` 가 아니면 본인에게 DM 으로 CHANGES.md 신규 항목을 전송한다.

`PROJECT_NAME` / `oldHash` / `newHash` / `changes` 를 JSON 으로 만들어 stdin 으로 전달한다.

```powershell
$payload = @{
    projectName = if ($env:PROJECT_NAME) { $env:PROJECT_NAME } else { (Split-Path -Leaf (Get-Location)) }
    oldHash     = $LocalHash
    newHash     = $RemoteHash
    changes     = (ConvertFrom-Json $ChangesJson)
} | ConvertTo-Json -Compress -Depth 5

# native 명령 파이프 기본 인코딩($OutputEncoding)이 us-ascii 라 한글이 '?' 로 치환된다.
# UTF-8 로 지정해야 notify.js(stdin utf8)에 한글이 온전히 전달된다.
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
$payload | node ".claude/skills/sync-template/scripts/notify.js"
```

스크립트는 환경변수가 없거나 전송이 실패해도 동기화 결과에 영향을 주지 않는다 (best-effort).

---

## 동작 요약

| 단계 | 변경 없을 때 | 변경 있을 때 |
|------|--------------|--------------|
| ls-remote 비교 | 동일 → 즉시 종료 | 다름 → 다음 단계 |
| clone | (실행 안 함) | full clone |
| CHANGES.md diff | — | `oldHash..HEAD` 의 `+` 라인 추출 |
| 복사 | — | `.claude/` 전체 (state 제외) + settings.json |
| SYNC_HASH | (그대로) | 신규 hash 로 갱신 |
| Slack DM | — | CHANGES.md 신규 항목 첨부 DM (옵션) |
