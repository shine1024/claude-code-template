---
name: version-update
description: CHANGES.md 에 누락된 커밋을 정리하고 새 버전을 산출해 pom.xml + CHANGES.md 를 일괄 갱신한다. 패키지/고객사 두 모드를 자동 감지하고, 누락 범위는 CHANGES.md 마지막 섹션 이후 git log 로 자동 탐색한다. "버전 올려줘", "버전 업데이트", "릴리즈", "/version-update" 등의 요청에 사용한다. 파일 수정까지만 수행하며 커밋·푸시는 사용자가 별도로 진행한다.
---

# 버전 업데이트 자동화 스킬

CHANGES.md 는 변경 이력의 단일 진실 원본이고, **버전 정책의 단일 진실 원본은 [`.claude/rules/version-policy.md`](../../rules/version-policy.md) 다.** 이 스킬은 **CHANGES.md 마지막 섹션 이후 커밋을 누락분으로 보고**, 정책에 정의된 분류 매핑·patch 한도·모드 규칙에 따라 새 버전을 산출해 `pom.xml` + `CHANGES.md` 에 기입한다.

**3단계로 끝낸다: ① 분석 → ② 미리보기 → ③ 수정.** 매 단계마다 묻지 않고, 미리보기 한 번만 사용자 확인을 받는다.

스킬은 정책의 시점 규칙(정기/수시 업데이트)을 판단하지 않는다. 호출된 시점의 누락분만 정리한다.

---

## ① 분석 (한 번에 실행)

확인 없이 아래 정보를 **모두 수집한 뒤** ②로 넘어간다. 단계 사이에 사용자에게 묻지 않는다.

### 1-0. 정책 로드 (필수)

`.claude/rules/version-policy.md` 를 Read 로 한 번 읽고 아래 값을 추출하여 이후 단계의 판단 기준으로 사용한다.

- **분류 → bump 등급 매핑** (예: `[변경/개편]→major`, `[신규/구성]→minor`, `[수정/개선]→patch`)
- **patch 한도** (한도 초과 시 minor 자동 승격)
- **모드별 버전 형식** (패키지 `X.Y.Z` / 고객사 `{투입 패키지 버전}-{고객사명}-A.B.C`)
- **초기화 규칙** (상위 bump 시 하위 0)

정책 값이 변경되면 `version-policy.md` 만 수정하면 되고, 이 SKILL.md 는 손대지 않는다.

### 1-1. 정해진 bash 시퀀스 (병렬 실행)

```bash
# pom.xml 현재 버전
grep -m1 "<version>" pom.xml

# CHANGES.md 마지막 섹션 헤더
grep -m1 "^## v" CHANGES.md

# CHANGES.md 첫 일감 링크 (REDMINE_URL 추출용)
grep -m1 -oE "https?://[^/]+/[^/]+/issues/" CHANGES.md

# 하위 pom 위치 (병렬 치환용)
ls */pom.xml 2>/dev/null

# 오늘 날짜 (CHANGES.md 섹션 헤더용)
date +%Y-%m-%d
```

### 1-2. bump 커밋 SHA 탐색

```bash
# 우선순위: 화살표 패턴 → 버전 업데이트 메시지 → CHANGES.md 마지막 수정 커밋
git log --format="%H %s" | grep -E "→ v{LAST_CHANGES_VERSION}" | head -1
# 실패하면
git log -1 --format="%H" -- CHANGES.md
```

### 1-3. 누락 커밋 목록

```bash
git log {LAST_BUMP_SHA}..HEAD --format="%H|%s" --reverse
```

각 subject 를 두 정규식으로 파싱:
- `^#(\d+)\s+\[(\w+)\]\s+(.+)$` (일감번호 있음)
- `^\[(\w+)\]\s+(.+)$` (일감번호 없음)

둘 다 안 맞으면 **비표준** (제외 + 경고).

### 1-4. 처리 분기

| 상황 | 동작 |
|------|------|
| 누락 커밋 0건 | `[종료] CHANGES.md 가 최신 상태입니다.` 출력 후 종료 |
| 표준 커밋 0건 (비표준만 N건) | 미리보기에 명시 + patch 로 가정, 사용자 확인 받음 |
| CHANGES.md 마지막 > pom.xml | 비정상. 한 줄 경고 후 중단 |
| bump 커밋 탐색 실패 | CHANGES.md 마지막 수정 커밋을 자동 fallback (묻지 않는다) |
| 그 외 정상 | 그대로 ②로 진행 |

### 1-5. 새 버전 산출 (정책 적용)

`CURRENT_VERSION` = pom.xml 의 현재 버전 (CHANGES.md 와 일치하는 정상 케이스 기준).

1-0 에서 로드한 정책의 **초기화 규칙**(상위 bump 시 하위 0)을 적용한다.

**패키지 모드** (`X.Y.Z`):
- major → `(X+1).0.0` / minor → `X.(Y+1).0` / patch → `X.Y.(Z+1)`

**고객사 모드** (`{prefix}-{고객사명}-A.B.C`) — prefix·고객사명 고정, 뒤만 bump:
- major → `A+1.0.0` / minor → `A.B+1.0` / patch → `A.B.C+1`

누적 patch 가 정책의 **patch 한도**를 초과하면 자동 minor 승격, 미리보기에 사유 표기.

---

## ② 미리보기 (한 번만 출력)

```
## /version-update 미리보기

모드: {패키지 | 고객사 ({고객사명})}
현재 → 신규: v{OLD} → v{NEW}  ({bump 등급} — [분류A] N건, [분류B] M건)
기준: CHANGES.md v{LAST_CHANGES_VERSION} ({LAST_CHANGES_DATE}) → bump 커밋 {SHORT_SHA}

### 포함 커밋 ({N}건)
- {#이슈ID 있으면 표기} [{분류}] {요약}

### 제외 커밋 ({M}건, 있을 때만)
- {subject} — {제외 사유}

### 수정 대상
- pom.xml × {N}개
- CHANGES.md (목차 + v{NEW} 섹션)

### CHANGES.md 새 섹션
## v{NEW} ({YYYY-MM-DD})
- [**#{이슈ID}**]({REDMINE_URL}issues/{이슈ID}) [{분류}] {요약}    ← 일감번호 있음
- [{분류}] {요약}                                                ← 일감번호 없음

진행할까요?
```

### 미리보기 단계에서만 받는 수정 지시 (선택)

- `patch 로 고정` / `minor 로 고정` → bump 등급 변경
- `이 커밋은 빼` / `{SHA} 도 포함` → 목록 조정
- `분류 [개선] 으로` / `날짜 {YYYY-MM-DD}` → 항목 수정

위 지시가 오면 즉시 반영해 미리보기를 다시 출력한다. 그 외 질문은 하지 않는다.

---

## ③ 수정 (병렬 Edit)

사용자가 확인하면 아래를 **병렬로** 실행한다.

### 3-1. pom.xml 정밀 치환 (모듈 개수만큼)

각 pom.xml 에서 **현재 프로젝트 `<version>` 만** 치환한다. 다른 dependency 버전은 절대 건드리지 않는다.

| 모듈 유형 | 치환 위치 | 횟수 |
|----------|----------|------|
| 루트 (`<packaging>pom</packaging>`) | 자기 `<version>` | 1회 |
| 하위 jar (parent + 자신) | `<parent>` 블록 + 자기 `<version>` | 2회 |
| 하위 war (parent만) | `<parent>` 블록 | 1회 |

**치환 패턴** (주변 태그를 묶어 dependency 충돌 차단):
- 루트 자신: `<artifactId>{ARTIFACT}</artifactId>\n    <version>{OLD}</version>`
- 하위 parent: `<parent>\n        <groupId>...</groupId>\n        <artifactId>...</artifactId>\n        <version>{OLD}</version>\n    </parent>` 블록 통째로

### 3-2. CHANGES.md 두 곳 수정

**목차** — `## 목차` 의 첫 항목 위에 한 줄 삽입:
```
- [v{NEW} ({YYYY-MM-DD})](#v{NEW_no_dot}-{YYYY-MM-DD})
```
`NEW_no_dot` 은 점 제거 (예: `2.3.1` → `231`, `1.7.0-acme-1.1.0` → `170-acme-110`).

**새 섹션** — 가장 최근 버전 헤더 바로 위 (구분선 `---` 다음 위치)에 삽입:
```
## v{NEW} ({YYYY-MM-DD})

- [**#{이슈ID}**]({REDMINE_URL}issues/{이슈ID}) [{분류}] {요약}
- [{분류}] {요약}    ← 일감번호 없는 경우

---

```

### 3-3. 결과 한 줄 보고

```
[성공] v{OLD} → v{NEW} ({bump 등급}, 정책: .claude/rules/version-policy.md) — pom.xml × {N}, CHANGES.md 수정 완료.
다음: git diff 검토 후 커밋/푸시는 별도 진행.
```

실패 시 `[주의]` 로 시작하고 어디까지 성공했는지 한 줄로만 표기.

---

## 제한 사항

- **파일 수정까지만 수행.** 커밋·푸시·커밋메시지 작성은 사용자가 직접.
- 표준 분류 패턴 (`#NNNN [분류] 요약` 또는 `[분류] 요약`) 전제. `[분류]` 는 `version-policy.md` 의 매핑 표에 정의된 값. 비표준은 제외 + 경고.
- pom.xml 의 다른 dependency 버전은 절대 건드리지 않음 (주변 태그 묶어 정밀 치환).
- 고객사 모드의 prefix·고객사명은 절대 변경하지 않음.
- 누락 범위는 CHANGES.md 마지막 섹션 기준 자동 탐색. 탐색 실패 시 CHANGES.md 최종 수정 커밋으로 자동 fallback (사용자 입력 받지 않음).
- main 이 아닌 브랜치에서 실행 시 한 줄 경고만 출력하고 계속 진행.
- 버전 문자열이 두 모드 정규식에 모두 매칭 안 되면 한 줄 경고 후 중단.

---

## 핵심 원칙 (속도 최적화)

1. **묻기 전에 다 모은다** — ①에서 필요한 정보를 한 번에 수집. 단계 사이 질문 없음.
2. **확인은 미리보기 1회만** — yes/no 받는 시점은 ②뿐.
3. **분기 최소화** — 자동 탐색 실패는 자동 fallback. 비정상 케이스는 중단 또는 한 줄 경고.
4. **Edit 병렬** — pom.xml 들과 CHANGES.md 수정은 가능한 동시 실행.
5. **출력 간결** — 미리보기·결과 모두 핵심만. 사족 없음.
