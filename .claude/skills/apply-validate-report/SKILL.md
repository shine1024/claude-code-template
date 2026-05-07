---
name: apply-validate-report
description: /validate-rules 가 생성한 검증 보고서의 체크된 항목만 .claude/rules/ 와 rules-index.json 에 반영한다. 삭제·병합·유지(자동) 처리하며 충돌은 사용자 수동 처리. "검증 결과 적용", "/apply-validate-report", "규칙 정리 적용" 등의 요청에 사용한다.
---

## 목적

`/validate-rules` 가 만든 보고서(`reports/validate-rules/{날짜}-validate-report.md`)에서
사용자가 체크한 항목만 실제로 반영한다.

| 보고서 섹션 | 처리 |
|---|---|
| `## 삭제 후보` | 체크된 항목 → 규칙 파일에서 섹션 제거 (파일 전체가 비면 삭제) + `rules-index.json` entry 제거 |
| `## 병합 후보` | 체크된 항목 → 두 규칙을 한 곳으로 병합 + 다른 한 쪽은 삭제 |
| `## 충돌 보고` | 자동 처리 안 함 — 사용자에게 안내만 |
| `## 유지` | 체크 무관 — 모두 `last_validated_at` 갱신 (보고서에 등장한 후보 전체 포함) |

> 보고서 본문을 LLM 이 다시 해석하지 않는다. `parse-validate-report.js` 가 체크박스를 파싱해 JSON 으로 출력한다.

---

## 1단계: 보고서 선택

인자로 날짜를 받거나(`/apply-validate-report 2026-05-07`), 인자가 없으면 가장 최근 보고서를 자동 선택한다.

```bash
node "{SKILL_DIR}/scripts/parse-validate-report.js" [YYYY-MM-DD]
```

> `SKILL_DIR` 은 스킬 실행 시 상단에 표시되는 Base directory 경로다.

보고서가 없으면 다음 메시지로 종료한다.

```
검증 보고서가 없습니다. /validate-rules 를 먼저 실행하세요.
```

스크립트 출력 JSON 의 `reportPath` 를 사용자에게 알린다.

---

## 2단계: 처리 대상 미리보기

`deletes`, `merges`, `keeps` 를 사용자에게 표 형식으로 보여준다.

```
## 적용 대상 (보고서: reports/validate-rules/{날짜}-validate-report.md)

| 종류 | 대상 | 사유 |
|------|-----|-----|
| 삭제 | sql-style.md > PostgreSQL 섹션 | CLAUDE.md MariaDB 단일 |
| 병합 | coding-behavior + java-style → coding-behavior | 동일 내용 중복 (주석) |
| 유지 | realgrid, documentation (last_validated_at 갱신) | - |

## 자동 처리 안 함

- 충돌 보고: 보고서 "## 충돌 보고" 섹션을 직접 검토하세요.

진행하시겠습니까? (yes/no)
```

`yes` 가 아니면 종료. (`/apply-validate-report` 는 자동 커밋·푸시도 안 함.)

---

## 3단계: 삭제 처리

각 `delete` 항목에 대해:

1. 보고서 항목 본문의 "적용 위치" 를 참고해 어느 섹션을 제거할지 결정한다.
   - `(전체 삭제)` → 파일 전체 삭제
   - `(특정 헤딩명)` → `Edit` 로 해당 헤딩 + 본문 블록 제거
2. 섹션 제거 후 파일이 비어 있거나 헤딩만 남았으면 파일 자체를 삭제한다.
3. 어떤 파일·섹션을 제거했는지 한 줄로 기록한다 (4단계 보고용).

`rules-index.json` 의 entry 제거는 5단계에서 일괄 처리한다.

---

## 4단계: 병합 처리

각 `merge` 항목 (`{ids:[idA, idB], reason, raw}`) 에 대해:

1. 보고서 항목 본문의 "병합 방향" 을 따른다.
   - 명시 형식 예: `<idA> 본문에 <idB> 핵심 추가, <idB> 제거`
   - 명시가 없으면 사용자에게 어느 쪽을 남길지 확인한다.
2. 남길 쪽 파일에 다른 쪽 핵심 내용을 통합한다 (`Edit` 로 추가).
3. 제거할 쪽 파일은 3단계와 동일하게 처리 (파일 또는 섹션 제거).
4. `rules-index.json` 에서 제거할 쪽 entry 는 5단계에서 함께 제거된다.

---

## 5단계: `rules-index.json` 일괄 갱신

다음 JSON 을 stdin 으로 전달해 한 번에 갱신한다.

```bash
echo '{"touch":["<유지대상id1>", ...], "remove":["<삭제대상id1>", ...]}' \
  | node "{SKILL_DIR}/scripts/apply-index-changes.js"
```

**touch 대상**
- `## 유지` 섹션의 모든 ID
- `## 삭제 후보` / `## 병합 후보` 중 **체크되지 않은** 항목의 ID (사용자가 검토 후 유지 결정한 것으로 간주)
- 즉, 보고서에 등장한 모든 후보 + `## 유지` ID 에서 `remove 대상` 을 뺀 것

**remove 대상**
- `## 삭제 후보` 중 체크된 ID
- `## 병합 후보` 중 체크된 항목의 "제거되는 쪽" ID (병합 방향에서 결정)

> `touch` 와 `remove` 가 겹치면 `remove` 가 우선한다.

---

## 6단계: 충돌 보고 안내

보고서의 `## 충돌 보고` 섹션에 항목이 있으면 사용자에게 다음과 같이 안내한다.

```
충돌 항목 N건은 자동 처리하지 않습니다. 보고서 ## 충돌 보고 섹션을 직접 검토 후
어느 쪽 규칙을 채택할지 결정해 두 파일을 모두 수정해주세요.

보고서: reports/validate-rules/{날짜}-validate-report.md
```

---

## 7단계: CHANGES.md 갱신

`CHANGES.md` 상단에 오늘 날짜 그룹으로 항목을 추가한다.

- 카테고리: 규칙 삭제·병합은 `[수정]`
- 형식: `- [수정] .claude/rules/* — apply-validate-report 적용 (보고서: {YYYY-MM-DD})`
- 적용 항목별로 한 줄씩 들여쓰기 불릿으로 부연 설명

> 같은 날짜에 이미 항목이 있으면 그룹 헤딩에 `(N)` 을 붙여 새 그룹을 만들거나, 같은 흐름의 후속이면 기존 항목에 병합한다.

---

## 8단계: 결과 요약

```
적용 완료

- 삭제: A건 (파일/섹션)
  - sql-style.md > PostgreSQL 섹션 제거
- 병합: B건
  - java-style → coding-behavior (주석 규칙 통합)
- rules-index.json 갱신: touched K건 / removed M건
- 충돌 (수동 필요): C건

변경 확인: git diff
커밋은 사용자가 직접 진행해주세요. (자동 커밋 안 함)
```

---

## 주의 사항

- **자동 커밋·푸시 안 함** — `git diff` 안내만.
- **충돌 항목은 자동 병합 금지** — 잘못 합치면 더 큰 문제.
- 삭제로 파일이 통째 비면 파일 자체를 삭제하고 `rules-index.json` entry 도 함께 제거한다.
- 병합 방향이 보고서에 명시되지 않은 경우 임의로 정하지 않고 사용자에게 확인한다.
- `touch` 대상에 보고서에 등장한 모든 후보를 포함시키는 이유: 사용자가 검토하여 "체크하지 않음 = 유지 결정" 으로 간주하기 위함이다. 검토 사실 자체를 `last_validated_at` 갱신으로 기록한다.
