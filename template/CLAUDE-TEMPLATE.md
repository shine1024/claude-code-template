# CLAUDE-TEMPLATE.md — 공통 작업 지침

모든 프로젝트 CLAUDE.md에 공통으로 포함되는 기준입니다.
프로젝트별 템플릿(`CLAUDE-TEMPLATE-[프로젝트명].md`)은 이 파일을 기반으로 프로젝트 특화 내용을 추가합니다.

---

## 공통 rules/ 파일

| 파일 | 용도 | 비고 |
|------|------|------|
| `java-style.md` | Java 코딩 컨벤션 | Java 프로젝트 필수 |
| `js-style.md` | JavaScript 코딩 컨벤션 | 프론트엔드 포함 프로젝트 필수 |
| `sql-style.md` | SQL 코딩 컨벤션 | DB 사용 프로젝트 필수 |
| `realgrid.md` | RealGrid2 API 탐색 규칙 | RealGrid2 사용 프로젝트 선택 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## CLAUDE.md 고정 스키마

모든 프로젝트 CLAUDE.md는 아래 4개 섹션으로 고정 출력됩니다.

```
# {서비스명} — CLAUDE.md

## 1. 프로젝트 개요
## 2. 프로젝트 구조
## 3. 아키텍처 패턴
## 4. Claude 작업 지침

---
[공통 규칙 자동 병합]
```

> **200줄 이내를 권장합니다.**

### 섹션별 출처

| 섹션 | 항목 | 출처 |
|------|------|------|
| 1. 프로젝트 개요 | 서비스명 | pom.xml / package.json |
| | 설명 | 템플릿 |
| | 기술 스택 | pom.xml / package.json 분석 |
| | 주요 외부 연동 | 의존성 + 설정 파일 분석 |
| | 적용 rules | 기술 스택에서 자동 결정 |
| 2. 프로젝트 구조 | 디렉터리 트리 | 직접 탐색 |
| | 모듈 의존 관계 | pom.xml `<modules>` (멀티 모듈만) |
| 3. 아키텍처 패턴 | 레이어 구조 | 패키지·클래스 탐색 |
| | 베이스 클래스 | 추상 클래스·상속 탐색 (발견 시) |
| | 트랜잭션 정책 | @Transactional 사용 패턴 |
| | 예외 처리 방식 | @ControllerAdvice 탐색 |
| 4. Claude 작업 지침 | 필수 패턴 | 코드 패턴 분석 |
| | 금지 사항 | 코드 패턴 분석 |

---

## 프로젝트별 템플릿 목록

| 파일 | 대상 프로젝트 |
|------|--------------|
| `CLAUDE-TEMPLATE-uniflow.md` | uniflow (전자결재) |
| `CLAUDE-TEMPLATE-uniworks-pce.md` | unidocu6 (UniWorks PCE) |
| `CLAUDE-TEMPLATE-uniworks-pce-core.md` | unidocu6-core (UniWorks PCE Core) |
| `CLAUDE-TEMPLATE-uniworks-pce-mobile.md` | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| `CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md` | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| `CLAUDE-TEMPLATE-uniworks-public.md` | unidocu6-public-sap (UniWorks Public) |
| `CLAUDE-TEMPLATE-uniworks-public-core.md` | unidocu6-public-sap-core (UniWorks Public Core) |

---

## Claude 동작 규칙 (공통)

> 이 섹션은 `init-claude-md` 스킬이 생성된 CLAUDE.md에 자동으로 포함합니다.

### 작업 방식
- 하나의 요청에 여러 기능이 포함된 경우, 기능 단위로 나눠 순차 진행한다
- 서로 다른 레이어·관심사에 걸친 변경은 수정 전 변경 계획을 먼저 보고하고 승인 후 진행한다

### 코드 탐색
- 프로젝트에 존재하지 않는 클래스·함수를 임의로 생성하지 않는다
  불확실한 경우 기존 코드에서 실제 사용 중인 패턴을 먼저 탐색한다
- 신규 화면 개발 시 기존 유사 화면의 구조·패턴을 먼저 탐색하고 동일 방식으로 작성한다
- 코드를 직접 읽기 전에는 동작 방식을 추측으로 설명하지 않는다
- 패턴 기반 일괄 변경 전, 영향받는 파일 목록을 먼저 확인한 후 적용한다

### 코드 수정 원칙
- 주석 처리된 코드는 명시적 요청 없이 활성화하지 않는다
- 파일을 이전 상태로 되돌리기 전 uncommitted 변경사항을 확인하고 사용자에게 먼저 안내한다

### 에러 분석
- 스택트레이스 → 원인 클래스/메서드 특정 → 수정 방안 단계별 설명 후 적용

### 응답 방식
- 한국어로 소통한다
- 설명은 3줄 이내로 요약한다 (에러 분석·기술 구조 설명 제외)
- 변경 내용 요약 형식: `파일명: 변경 내용 한 줄 요약`
