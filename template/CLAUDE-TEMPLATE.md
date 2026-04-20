# CLAUDE-TEMPLATE.md — 공통 작업 지침

모든 프로젝트 CLAUDE.md에 공통으로 포함되는 기준입니다.
프로젝트별 템플릿(`CLAUDE-TEMPLATE-[프로젝트명].md`)은 이 파일을 기반으로 프로젝트 특화 내용을 추가합니다.

---

## 공통 Claude 작업 지침

- 하나의 요청에 여러 기능이 포함된 경우, 기능 단위로 나눠 순차 진행한다
- 프로젝트에 존재하지 않는 클래스·함수를 임의로 생성하지 않는다
  → 불확실한 경우 기존 코드에서 실제 사용 중인 패턴을 먼저 탐색한다
- **신규 화면 개발 시**: 기존 유사 화면의 구조·패턴을 먼저 탐색하고 동일 방식으로 작성한다
- **응답 방식**: 한국어로 소통하며 짧고 간결하게 답한다 — 변경 내용 요약은 표 형식으로
- **에러 분석**: 스택트레이스 → 원인 클래스/메서드 특정 → 수정 방안 단계별 설명 후 적용
- **git push 금지**: 사용자가 명시적으로 요청하지 않으면 실행하지 않는다

---

## 공통 rules/ 파일

| 파일 | 용도 | 비고 |
|------|------|------|
| `java-style.md` | Java 코딩 컨벤션 | Java 프로젝트 필수 |
| `js-style.md` | JavaScript 코딩 컨벤션 | 프론트엔드 포함 프로젝트 필수 |
| `sql-style.md` | SQL 코딩 컨벤션 | DB 사용 프로젝트 필수 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## CLAUDE.md 작성 구조

모든 프로젝트 CLAUDE.md는 아래 순서로 작성합니다.

```
1. 프로젝트 개요       (서비스명, 목적, 기술 스택, 외부 연동)
2. 프로젝트 구조       (디렉터리 트리, 모듈 의존 관계)
3. 아키텍처 패턴       (레이어 구조, 베이스 클래스, 트랜잭션, 예외 처리)
4. rules/ 파일 구성    (사용 파일 목록)
5. Claude 작업 지침    (공통 지침 + 프로젝트 특화 지침)
```

> **전체 200줄 이내를 권장합니다.**

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
