# claude-code-template 통합 테스트

claude-code-template 의 변경사항을 별도 sandbox 프로젝트(`D:/claude-code-sandbox`)에서
자식 claude 세션으로 사전 검증한다.

이 디렉토리는 `.claude/` 외부에 있어 `/sync-template` 으로 다른 프로젝트에 전파되지 않는다.
오직 claude-code-template 자체의 회귀 검증용이다.

---

## 사전 조건

1. `D:/claude-code-sandbox` 에 git 리포 + 시드 파일이 준비되어 있고 working tree 가 clean 상태
2. 그 안에 `init.bat` 으로 `.claude/` 환경이 부트스트랩되어 있음
3. `.claude/settings.local.json` 에 `SRC_ROOT` · `DEPLOY_ROOT` + 필요한 훅이 등록되어 있음
4. `claude` CLI 가 PATH 에 있음
5. `D:/claude-code-sandbox-deploy` 디렉토리 존재 (자동 생성하지만 권한상 미리 만들어두면 안전)

> sandbox 의 working tree 가 dirty 하면 러너는 거부한다 (사용자 작업 파괴 방지). 사전에 commit 또는 stash 필요.

---

## 실행

```bash
node tests/run.js <scenario>
```

예: `node tests/run.js deploy-static`

---

## 환경변수 (선택)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `SANDBOX_PATH` | `D:/claude-code-sandbox` | sandbox 루트 |
| `DEPLOY_ROOT` | `D:/claude-code-sandbox-deploy` | deploy-static 의 배포 대상 |

---

## sandbox 상태 보호 정책 (git 격리)

매 시나리오 실행은 다음 흐름을 따른다.

```
setup
  ├── working tree clean 검사 → dirty 면 거부
  ├── BASELINE = git rev-parse HEAD (현재 sandbox HEAD 기록)
  ├── git reset --hard BASELINE + git clean -fd (혹시 모를 잔여 정리)
  └── DEPLOY_ROOT 비우기

run
  └── 자식 claude -p --dangerously-skip-permissions 호출 (cwd: sandbox)

verify
  └── 시나리오의 verify.js 실행 → PASS/FAIL 보고

teardown
  └── git reset --hard BASELINE + git clean -fd (자식이 만든 commit·파일 모두 폐기)
```

자식 claude 가 시나리오 중 어떤 commit·파일 변경을 해도 teardown 단계에서 baseline 으로 깨끗하게 원복된다.

> origin push 사고: sandbox origin 은 사용 안 하는 더미 리포라는 전제. 사고 commit 이 origin 에 가도 GitLab UI 에서 정리. 1단계 러너는 push 차단 격리(remote 임시 분리)를 포함하지 않음.

---

## 시나리오 추가 방법

`tests/scenarios/<name>/` 디렉토리에 다음 3개 파일을 둔다.

| 파일 | 역할 |
|------|------|
| `prompt.md` | 자식 claude 에 전달할 지시 (단순 텍스트) |
| `verify.js` | `module.exports = function(ctx) { ... return Check[]; }` 형태의 검증 함수. `Check = { name, pass, message }` |
| `README.md` | 사람이 읽는 시나리오 설명 |

`ctx` 객체:
- `sandbox` — sandbox 루트 절대경로
- `deployRoot` — DEPLOY_ROOT 절대경로
- `srcRoot` — SRC_ROOT (`<sandbox>/src/main/resources` 기본)
- `baseline` — sandbox baseline commit SHA
- `childStdout` / `childStderr` — 자식 claude 의 출력 (필요 시 검증에 활용)

---

## 첫 실행 전 준비

sandbox 가 처음 셋업된 상태(시드 파일 untracked, .gitignore modified)라면 baseline 으로 쓸 깨끗한 commit 을 한 번 만들어둔다.

```bash
cd D:/claude-code-sandbox
git add .gitignore .claude src/main/resources
git commit -m "test baseline: claude-code-template 환경 + 정적 리소스 시드"
git push   # 선택
```

이후 sandbox 에 새 시나리오용 시드를 추가할 때마다 commit 으로 baseline 을 갱신한다.
