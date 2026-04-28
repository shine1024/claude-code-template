---
name: sync-template
description: claude-code-template 공통 설정을 최신화합니다. "싱크", "템플릿 업데이트", "sync-template" 등의 요청에 사용하세요.
---

## 목적

`TEMPLATE_REPO_URL`에 설정된 저장소에서 최신 `.claude/` 공통 설정을 받아 현재 프로젝트에 적용합니다.

---

## 1단계: TEMPLATE_REPO_URL 확인

`TEMPLATE_REPO_URL` 환경변수가 비어 있으면 아래 메시지를 출력하고 종료합니다.

```
TEMPLATE_REPO_URL이 설정되어 있지 않습니다.
.claude/settings.local.json 의 env 섹션에 TEMPLATE_REPO_URL을 입력한 뒤 다시 시도하세요.
```

---

## 2단계: 원격 저장소 clone

임시 디렉토리에 shallow clone합니다.

```powershell
$TempDir = Join-Path $env:TEMP "claude-sync-$(Get-Random)"
git clone --depth 1 -c core.autocrlf=true $env:TEMPLATE_REPO_URL $TempDir
```

clone 실패 시 아래 메시지를 출력하고 종료합니다.

```
저장소 clone에 실패했습니다. TEMPLATE_REPO_URL과 네트워크 연결을 확인하세요.
```

---

## 3단계: 파일 복사

아래 항목을 현재 프로젝트의 `.claude/` 로 복사합니다. 각 항목은 기존 내용을 덮어씁니다.

| 복사 대상 | 설명 |
|-----------|------|
| `.claude/guides/` | 기능 가이드 문서 |
| `.claude/hooks/` | 이벤트 훅 스크립트 |
| `.claude/lib/` | 스킬 공통 라이브러리 |
| `.claude/rules/` | 공통 규칙 파일 |
| `.claude/skills/` | 커스텀 스킬 |
| `.claude/settings.json` | 공통 설정 |

```powershell
$TargetClaude = ".claude"
foreach ($dir in @("guides", "hooks", "lib", "rules", "skills")) {
    $target = Join-Path $TargetClaude $dir
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item (Join-Path $TempDir ".claude\$dir") $TargetClaude -Recurse
}
Copy-Item (Join-Path $TempDir ".claude\settings.json") $TargetClaude -Force
```

---

## 4단계: SYNC_HASH 갱신

clone한 저장소의 HEAD commit hash를 `.claude/state/SYNC_HASH` 에 저장합니다.

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

동기화된 파일 목록을 요약하여 사용자에게 안내합니다.

```
동기화 완료! 다음 항목이 최신화되었습니다.
- guides/
- hooks/
- lib/
- rules/
- skills/
- settings.json

변경된 파일을 확인한 뒤 git commit 해주세요.
```
