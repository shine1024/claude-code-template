# deploy-static 시나리오

## 검증 대상
- `.claude/hooks/deploy-static/track.js` (PostToolUse)
- `.claude/hooks/deploy-static/deploy.js` (Stop)

## 흐름
1. 자식 claude 가 sandbox 에서 4개 파일 수정
   - `static/js/app.js`, `static/css/style.css`, `templates/sample.hbs` (화이트리스트 안)
   - `build.gradle` (화이트리스트 밖)
2. PostToolUse 훅: 화이트리스트 안 3개만 `.claude/cache/modified_files.log` 에 누적
3. Stop 훅: 로그를 읽어 SRC_ROOT 상대경로 기준으로 DEPLOY_ROOT 에 복사 후 로그 삭제

## 검증 항목

| ID | 검증 |
|----|------|
| V1 | `DEPLOY_ROOT/static/js/app.js` 존재 |
| V2 | V1 파일에 `'[reservation] verified'` 포함 |
| V3 | `DEPLOY_ROOT/static/css/style.css` 존재 |
| V4 | V3 파일에 `color: #111;` 포함 |
| V5 | `DEPLOY_ROOT/templates/sample.hbs` 존재 |
| V6 | V5 파일에 `(verified)` 포함 |
| V7 | `DEPLOY_ROOT/build.gradle` **부재** (화이트리스트 필터 동작) |
| V8 | `sandbox/.claude/cache/modified_files.log` **부재** (Stop 훅 정리 동작) |

## 사전 조건 (sandbox 측)

다음 시드 파일이 sandbox 에 commit 되어 있어야 한다.

- `src/main/resources/static/js/app.js` — `'[reservation] app initialized'` 포함
- `src/main/resources/static/css/style.css` — `color: #222;` 포함
- `src/main/resources/templates/sample.hbs` — `<title>{{title}}</title>` 포함
- `build.gradle` — `group = 'com.unipost.uniflow'`
- `.claude/settings.local.json` — `SRC_ROOT`/`DEPLOY_ROOT` + deploy-static 훅 등록
