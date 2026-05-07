---
name: validate-rules
description: .claude/rules/*.md 에 누적된 규칙의 유효성을 재점검한다. 시간 임계값(추가 후 60일·검증 후 180일)을 넘긴 후보를 추출해 LLM 으로 판정하고 reports/validate-rules/ 에 보고서를 생성한다. "규칙 검증해줘", "/validate-rules", "오래된 규칙 정리", "규칙 점검" 등의 요청에 사용한다. 후속 적용은 /apply-validate-report.
---

## 목적

`/analyze-report` → `/apply-report` 로 누적된 규칙은 시간이 지나면 사문화·중복·모순 상태가 된다.
이 스킬은 후보 규칙을 뽑아 보고서를 만들 뿐, 실제 변경은 `/apply-validate-report` 에서 수행한다.

> 보고서 저장 외의 변경은 일체 하지 않는다.

---

## 유효성 판단 기준

후보 규칙은 아래 3가지를 모두 충족하면 "유효", 하나라도 깨지면 "무효".

### 1. 전제가 아직 성립하는가
규칙이 가정하는 환경(언어·프레임워크·DB·기능)이 현재 코드베이스에 존재하는가.
- 확인: 규칙 본문에서 가정 추출 → CLAUDE.md, 의존성 파일(pom.xml, package.json 등)과 대조
- 깨지는 예: "PostgreSQL 식별자는 큰따옴표" / CLAUDE.md "MariaDB 단일"

### 2. 규칙이 닿는 코드가 있는가
규칙이 적용될 대상 코드가 실제로 존재하는가.
- 확인: 규칙 키워드로 코드 검색 / 최근 커밋 메시지 확인
- 깨지는 예: "Velocity 템플릿 작성 시 X" / Velocity 파일 0개

### 3. 다른 규칙·CLAUDE.md 와 모순 없는가
같은 사안에 대해 서로 다른 지침이 공존하지 않는가.
- 확인: 모든 규칙 본문 + CLAUDE.md 를 같이 입력해 충돌 검출
- 깨지는 예: A "탭 들여쓰기" / B "스페이스 들여쓰기"

## 판정 결과

| 결과 | 조건 | apply-validate-report 에서 처리 |
|---|---|---|
| 유지 | 1·2·3 모두 충족 | `last_validated_at` 갱신 |
| 삭제 | 1 또는 2 깨짐 | 규칙 파일에서 해당 섹션 제거 또는 파일 삭제 |
| 병합 | 3 깨짐 (중복) | 두 규칙을 하나로 병합 |
| 충돌 보고 | 3 깨짐 (모순) | 자동 처리 안 함 — 사용자 결정 |

LLM 판정은 보수적으로 — 애매하면 "유지" 또는 "충돌 보고" 로 분류한다.

---

## 1단계: 환경 확인

`.claude/state/rules-index.json` 이 존재하는지 확인한다. 없으면 시드 안내 후 종료.

```
rules-index.json 이 없습니다. 먼저 시드 스크립트로 초기화하세요:
  node "{SKILL_DIR}/scripts/seed-index.js"
```

> 인덱스는 `.claude/state/` 에 저장되어 `/sync-template` 시 보존된다.

> `SKILL_DIR` 은 스킬 실행 시 상단에 표시되는 Base directory 경로다.

---

## 2단계: 후보 추출

```bash
node "{SKILL_DIR}/scripts/list-candidates.js" [--force]
```

**일반 모드 (기본)**
- `added_at` 후 60일 경과 + 미검증 (`added_at == last_validated_at`)
- 또는 `last_validated_at` 후 180일 경과
- `last_validated_at` 오름차순으로 최대 10건

**--force 모드**
- 모든 entry, 상한 무시 (사용자가 "--force" 또는 "강제 검증" 요청 시)

스크립트 출력 JSON 의 `candidates` 가 비어있으면 다음 메시지로 종료한다.

```
검증 후보가 없습니다. 모든 규칙이 임계값 안에 있습니다.
강제 검증이 필요하면 /validate-rules --force 로 다시 실행하세요.
```

`skippedRules` 가 있으면 사용자에게 알린다 — `rules-index.json` 에 등록됐지만 실제 파일이 없는 entry. `apply-validate-report` 가 정리하므로 그대로 두어도 무방하다.

---

## 3단계: 재료 수집

LLM 판정에 필요한 컨텍스트를 모은다.

| 재료 | 용도 |
|---|---|
| 후보 규칙 본문 (`Read` 로 각 candidate.file) | 판정 대상 |
| 모든 `.claude/rules/*.md` 본문 | 모순·중복 검출 (후보 외 규칙도 함께 봐야 충돌 감지 가능) |
| 루트 `CLAUDE.md` (있으면 `CLAUDE.local.md` 도) | 기준 1 — 환경 가정 확인 |
| 의존성 파일 (`pom.xml`, `package.json` 등) | 기준 1 — 사용 중인 라이브러리·DB |
| 최근 30일 커밋 메시지 (`git log --since="30 days ago" --format="%s"`) | 기준 2 — 활동 패턴, 키워드 등장 빈도 |

---

## 4단계: LLM 검토

각 후보를 3기준으로 판정한다. 출력 형식 강제:

```
[규칙] <id>
판정: 유지 | 삭제 | 병합 | 충돌 보고
근거:
  - 기준 1: <충족|깨짐> + 증거
  - 기준 2: <충족|깨짐> + 증거
  - 기준 3: <충족|깨짐> + 증거
```

- "삭제" 판정 시 어느 섹션을 제거할지(파일 통째 / 특정 헤딩 아래)도 명시한다.
- "병합" 판정 시 어느 규칙으로 모을지(병합 방향)를 명시한다.
- 증거는 가능하면 파일·라인·커밋 메시지 등 검증 가능한 형태로.

---

## 5단계: 보고서 저장

`reports/validate-rules/{YYYY-MM-DD}-validate-report.md` 에 저장한다.
디렉토리가 없으면 만든다. 같은 날 두 번째 실행이면 파일명에 `-2`, `-3` 접미사를 붙인다.

### 보고서 포맷 (체크박스 파싱과 호환되어야 함)

```markdown
# 규칙 유효성 검증 보고서

- 검증일: YYYY-MM-DD
- 후보 규칙 수: N건
- 모드: 일반 | --force

## 삭제 후보

- [ ] <id> — <짧은 사유>
  - 기준 X 깨짐: <증거>
  - 적용 위치: <file> (전체 삭제 / 특정 헤딩명)

## 병합 후보

- [ ] <idA> + <idB> — <짧은 사유>
  - 기준 3 깨짐: 동일 내용 중복
  - 병합 방향: <idA> 본문에 <idB> 핵심 추가, <idB> 제거

## 충돌 보고

자동 처리 안 함. 사용자 결정 필요.

- <idA> "X" vs <idB> "Y"
  - 어느 쪽을 채택할지 사용자가 직접 결정 후 두 파일을 모두 수정한다.

## 유지 (자동 처리, 선택 불필요)

`apply-validate-report` 실행 시 last_validated_at 만 오늘로 갱신된다.

- <id1>
- <id2>
```

> **포맷 규칙**
> - `## 삭제 후보` / `## 병합 후보` 의 첫 라인은 반드시 `- [ ]` 로 시작한다 (스크립트 파싱 호환성).
> - `삭제 후보` 항목 형식: `- [ ] <id> — <사유>`
> - `병합 후보` 항목 형식: `- [ ] <idA> + <idB> — <사유>`
> - `## 유지` 섹션은 `- <id>` 한 줄씩.
> - `## 충돌 보고` 는 자유 서술 — 스크립트 파싱 대상이 아니다.

---

## 6단계: 결과 요약

```
검증 완료

- 후보 규칙: N건
- 삭제 후보: A건
- 병합 후보: B건
- 충돌 보고: C건
- 유지: D건

보고서: reports/validate-rules/{YYYY-MM-DD}-validate-report.md

검토 후 /apply-validate-report 로 체크된 항목을 반영하세요.
```

---

## 시드 (최초 1회)

`rules-index.json` 이 없는 프로젝트에서는 다음 스크립트로 1회 시드한다.

```bash
node "{SKILL_DIR}/scripts/seed-index.js"
```

- `.claude/rules/*.md` 의 git log 첫 커밋 날짜를 `added_at` 으로 사용
- 이미 존재하면 종료 (`--force` 로 덮어쓰기)

---

## 주의 사항

- 보고서 저장 외 어떤 파일도 수정하지 않는다 (실제 변경은 `/apply-validate-report`).
- LLM 판정 시 "삭제"·"병합"·"충돌" 을 너무 적극적으로 내리지 않는다 — 애매하면 "유지".
- `--force` 모드는 최초 1회 또는 디버깅용. 일반 운영은 임계값 기반.
