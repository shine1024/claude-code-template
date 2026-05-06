---
name: sync-template
description: claude-code-template 공통 설정을 최신화한다. "싱크", "템플릿 업데이트", "sync-template" 등의 요청에 사용한다.
---

## 목적

`TEMPLATE_REPO_URL`에 설정된 저장소에서 최신 `.claude/` 공통 설정을 받아 현재 프로젝트에 적용한다.

---

## 1단계: TEMPLATE_REPO_URL 확인

`TEMPLATE_REPO_URL` 환경변수가 비어 있으면 아래 메시지를 출력하고 종료한다.

```
TEMPLATE_REPO_URL이 설정되어 있지 않습니다.
.claude/settings.local.json 의 env 섹션에 TEMPLATE_REPO_URL을 입력한 뒤 다시 시도하세요.
```

---

## 2단계: 원격 저장소 clone

임시 디렉토리에 shallow clone한다.

```powershell
$TempDir = Join-Path $env:TEMP "claude-sync-$(Get-Random)"
git clone --depth 1 $env:TEMPLATE_REPO_URL $TempDir
```

clone 실패 시 아래 메시지를 출력하고 종료한다.

```
저장소 clone에 실패했습니다. TEMPLATE_REPO_URL과 네트워크 연결을 확인하세요.
```

---

## 3단계: 파일 복사

아래 항목을 현재 프로젝트의 `.claude/` 로 복사한다. 각 항목은 기존 내용을 덮어쓴다.

| 복사 대상 | 설명 |
|-----------|------|
`.claude/` 하위 폴더 전체 (`state/` 제외) 및 `settings.json`

```powershell
$TargetClaude = ".claude"
$exclude = @("state")
Get-ChildItem (Join-Path $TempDir ".claude") -Directory |
    Where-Object { $exclude -notcontains $_.Name } |
    ForEach-Object {
        $target = Join-Path $TargetClaude $_.Name
        if (Test-Path $target) { Remove-Item $target -Recurse -Force }
        Copy-Item $_.FullName $TargetClaude -Recurse
    }
Copy-Item (Join-Path $TempDir ".claude\settings.json") $TargetClaude -Force
```

---

## 4단계: SYNC_HASH 갱신

clone한 저장소의 HEAD commit hash를 `.claude/state/SYNC_HASH` 에 저장한다.

```powershell
$hash = git -C $TempDir rev-parse HEAD
Set-Content ".claude/state/SYNC_HASH" $hash.Trim()
```

---

## 5단계: 임시 디렉토리 정리

```powershell
Remove-Item $TempDir -Recurse -Force
```

---

## 6단계: 완료 보고

동기화된 파일 목록을 요약하여 사용자에게 안내한다.

```
동기화 완료! 다음 항목이 최신화되었습니다.
- .claude/ 하위 폴더 전체 (state/ 제외)
- settings.json

변경된 파일을 확인한 뒤 git commit 해주세요.
```
