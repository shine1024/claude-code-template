# CLAUDE-TEMPLATE-uniworks-pce.md 사용 안내

> 이 파일은 unidocu6 (uniworks-pce) 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] core 프로젝트(unidocu6-core)는 `CLAUDE-TEMPLATE-uniworks-pce-core.md`를 별도 참고했는가?

---

# unidocu6 — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: unidocu6 (UniWorks PCE)
- **목적**: 경비처리 솔루션 — SAP RFC 직접 연동
- **기술 스택**:
  - Backend: Java 11 (JDK) / Maven compiler source·target: 1.8, Spring MVC 4.3.4, Maven (WAR)
  - Frontend: Mustache 템플릿, webjars 기반 JS (RequireJS)
  - Database: 로컬 DB 없음 — 모든 데이터는 SAP RFC 경유
- **주요 외부 연동**:
  - SAP RFC: `NamedService`를 통한 JCO 호출
  - ExGate: HTTP REST 외부 인터페이스 (`ns/efi/`)
- **라이브러리 의존성**: unidocu6-core (servercore / clientcore / webjars) — parent POM 참조

---

## 2. 프로젝트 구조

```
unidocu6/                        ← 단일 WAR 프로젝트
├── src/main/java/
│   └── com/unipost/unidocu/
│       ├── controller/          # 이 프로젝트 전용 Controller 구현체
│       ├── ns/                  # NamedService 구현체 (SAP RFC / 외부 인터페이스)
│       │   ├── ewf/             # 전자결재 워크플로우
│       │   └── efi/             # 외부 인터페이스 (ExGate 등)
│       ├── admin/service/       # 관리 기능 서비스
│       └── schedule/            # 스케줄러
├── src/main/resources/
│   ├── server/                  # 환경별 설정 (local_dev, dev, demo 등)
│   ├── rfc_destination/         # SAP JCO 접속 설정 (destination별 .properties)
│   └── mustache/                # Mustache 템플릿 (현재 메일 양식 포함)
├── src/main/webapp/
│   ├── webjars/                 # 업무화면 개발 영역 — 기능별 Mustache 템플릿 + JS
│   └── WEB-INF/                 # Spring 설정
└── pom.xml                      # unidocu6-core를 parent POM으로 참조
```

> core 프로젝트(unidocu6-core)는 공통 Controller·Service·인터셉터를 JAR로 제공합니다.
> 이 프로젝트(unidocu6)에는 구축별 업무 로직(NamedService 구현체, 업무 Controller, 업무화면)을 작성합니다.
> core 수정이 필요한 경우 downstream(= core를 참조하는 구축 프로젝트 전체) 영향을 반드시 확인하세요.

---

## 3. 아키텍처 패턴

### NamedService 패턴 (핵심)

```
프론트(JS) → /unidocu/namedService/call?namedServiceId=Xxx
  → NamedServiceController (core)
    → AbstractJAVAService.call(namedServiceId, params)
      → XxxService.call(NSParam)  ← FUNCTION_MODE로 내부 분기
        → SAP RFC: NamedService.call(namedServiceId, importParam) → JCO
        → 외부 HTTP: ExGate 호출 (ns/efi/)
```

- 모든 NamedService 구현체는 **`AbstractJAVAService`를 상속**하고 `call(NSParam)` 메서드를 구현한다
- `FUNCTION_MODE` 파라미터로 내부 동작을 분기한다
- 클래스명에서 `Service` 접미사를 제거한 값이 `namedServiceId`가 된다 (예: `ApprovalService` → `Approval`)

### 트랜잭션

```
- 로컬 DB 없음 → @Transactional 미사용
- 트랜잭션 경계는 SAP RFC 서버 측에서 관리
- RFC 응답 OS_RETURN.TYPE = "E" 수신 시 NSLogicalException throw
```

### SAP RFC 호출 패턴

```
- NamedService.call(namedServiceId, importParam) → JCO 직접 호출
- RFC destination 설정: rfc_destination/*.properties (jco.client.* 형식)
- 다중 destination 지원: jco.destination.DESTINATION_ALIASES로 alias 목록 관리
- RFC 함수명·파라미터명은 SAP에서 정의된 이름 그대로 사용 (임의 변경 금지)
```

### 공통 예외 처리

```
- ExceptionHandlingController (@ControllerAdvice, core): 전역 예외 처리
- NSLogicalException: 비즈니스 예외 → 메시지 그대로 클라이언트에 전달
- 응답 분기:
  - AJAX 요청 → jsonView (JSON 응답)
  - /unidocu/namedService/callJSONInterface → jsonView
  - 일반 요청 → /error/view forward
```

---

## 4. rules/ 파일 구성

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `java-style.md` | Java 코딩 컨벤션 | 필수 |
| `js-style.md` | JavaScript / Mustache 코딩 컨벤션 | 필수 |
| `sql-style.md` | SQL 코딩 컨벤션 | 미사용 — 로컬 DB 없음 (SAP RFC 전용) |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## 5. Claude 작업 지침

- 하나의 요청에 여러 기능이 포함된 경우, 기능 단위로 나눠 순차 진행한다
- **신규 비즈니스 로직**은 `AbstractJAVAService`를 상속한 Service 클래스에 `FUNCTION_MODE` 분기로 구현한다
  → 기존 Service의 패턴을 먼저 탐색한 후 동일 방식으로 작성한다
- **로컬 DB·MyBatis·@Transactional을 사용하지 않는다** — 데이터는 SAP RFC로만 처리한다
- **SAP RFC 호출**은 `NamedService.call(namedServiceId, importParam)` 패턴을 사용한다
  → RFC 함수명·파라미터명은 SAP에서 정의된 이름을 임의로 변경하지 않는다
  → RFC 응답 `OS_RETURN.TYPE = "E"` 확인 후 `NSLogicalException`을 throw한다
- **환경별 설정**은 `server/*.properties`로 분리한다 — 코드 내 하드코딩 금지
- **공통 기능 수정이 필요한 경우** core 프로젝트에 있는지 먼저 확인하고, core 수정 시 사용자에게 영향 범위를 먼저 고지한다
- **백엔드 수정 요청의 대부분은 SAP RFC 파라미터 문제 또는 신규 연동 추가**가 원인이다
  → 업무 로직 오류로 보이는 경우에도 RFC 응답값·파라미터를 먼저 확인한다
- 프로젝트에 존재하지 않는 클래스·함수를 임의로 생성하지 않는다
  → 불확실한 경우 기존 코드에서 실제 사용 중인 패턴을 먼저 탐색한다
