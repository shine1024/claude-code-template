# CLAUDE-TEMPLATE-uniworks-public.md 사용 안내

> 이 파일은 unidocu6-public-sap 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] core 프로젝트(unidocu6-public-sap-core)는 `CLAUDE-TEMPLATE-uniworks-public-core.md`를 별도 참고했는가?

---

# unidocu6-public-sap — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: unidocu6-public-sap (UniWorks Public)
- **목적**: 경비처리 솔루션 — SAP RFC 및 SAP Public REST API 연동
- **기술 스택**:
  - Backend: Java 11 (JDK) / Maven compiler source·target: 1.8, Spring MVC 4.3.4, MyBatis
  - Frontend: Mustache 템플릿, webjars 기반 JS
  - Database: PostgreSQL 또는 MariaDB (`db.vendor` 설정으로 전환)
- **주요 외부 연동**:
  - SAP Public REST API: `SapApiService`를 통한 RestTemplate 호출 (Basic Auth)
- **라이브러리 의존성**: unidocu6-public-sap-core (servercore / clientcore / webjars) — parent POM 참조

---

## 2. 프로젝트 구조

```
unidocu6-public-sap/             ← 단일 WAR 프로젝트
├── src/main/java/
│   └── com/unipost/unidocu/
│       ├── controller/          # 이 프로젝트 전용 Controller 구현체
│       ├── ns/                  # NamedService 구현체 (SAP REST API / 외부 인터페이스)
│       │   ├── ewf/             # 전자결재
│       │   └── efi/             # 외부 인터페이스
│       ├── admin/service/       # 관리 기능 서비스
│       └── schedule/            # 스케줄러
├── src/main/webapp/
│   ├── webjars/                 # Mustache 템플릿 + 커스터마이징 JS (기능별 폴더)
│   └── WEB-INF/                 # Spring 설정
└── pom.xml                      # unidocu6-public-sap-core를 parent POM으로 참조
```

> core 프로젝트(unidocu6-public-sap-core)는 공통 Controller·Service·Mapper·인터셉터를 JAR로 제공합니다.
> 이 프로젝트(unidocu6-public-sap)에는 구축별 업무 로직(NamedService 구현체, 업무 Controller, 업무화면)을 작성합니다.
> core 수정이 필요한 경우 downstream(= core를 참조하는 구축 프로젝트 전체) 영향을 반드시 확인하세요.

---

## 3. 아키텍처 패턴

### NamedService 패턴 (핵심)

```
프론트(JS) → /unidocu/namedService/call?namedServiceId=Xxx
  → NamedServiceController (core)
    → AbstractJAVAService.call(namedServiceId, params)
      → XxxService.call(NSParam)  ← FUNCTION_MODE로 내부 분기
        → SAP REST API: SapApiService.callApi(url, method, headers, body)
        → DB: XxxMapper (MyBatis)
```

- 모든 NamedService 구현체는 **`AbstractJAVAService`를 상속**하고 `call(NSParam)` 메서드를 구현한다
- `FUNCTION_MODE` 파라미터로 내부 동작을 분기한다
- 클래스명에서 `Service` 접미사를 제거한 값이 `namedServiceId`가 된다 (예: `ApprovalService` → `Approval`)

### SAP 연동 방식

| 방식 | 클래스 | 인증 | 용도 |
|------|--------|------|------|
| REST API | `SapApiService` | Basic Auth (destination 설정) | SAP Public API 호출 |

- SAP REST API 설정: destination 파일의 `sap.api.domain`, `sap.api.id`, `sap.api.pw`

### DB (DB 벤더 전환)

```
- db.vendor = postgresql → mappers/uniworks/postgresql/**/*.xml 로드
- db.vendor = mariadb    → mappers/uniworks/mariadb/**/*.xml 로드
- 신규 Mapper XML 작성 시 postgresql / mariadb 양쪽 모두 작성해야 한다
```

### 공통 예외 처리

```
- ExceptionHandlingController (@ControllerAdvice, core): 전역 예외 처리
- NSLogicalException: 비즈니스 예외 → 메시지 그대로 클라이언트에 전달
- PublicSAPException: SAP REST API 오류 → SAP 응답 body 전달
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
| `sql-style.md` | SQL 코딩 컨벤션 (PostgreSQL / MariaDB) | 필수 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## 5. Claude 작업 지침

> 공통 지침(순차 진행, 기존 패턴 탐색, 신규 화면 접근법, 응답 방식, 에러 분석, git push 금지)은 `CLAUDE-TEMPLATE.md` 참고

- **신규 비즈니스 로직**은 `AbstractJAVAService`를 상속한 Service 클래스에 `FUNCTION_MODE` 분기로 구현한다
  → 기존 Service의 패턴을 먼저 탐색한 후 동일 방식으로 작성한다
- **SAP REST API 호출**은 `SapApiService.callApi()` 패턴을 사용한다
  → 엔드포인트·파라미터는 SAP 공식 문서 또는 기존 구현 기준으로 작성하고, 임의로 추정하지 않는다
- **DB Mapper XML 신규 작성 시** postgresql과 mariadb 양쪽 모두 작성한다
- **공통 기능 수정이 필요한 경우** core 프로젝트에 있는지 먼저 확인하고, core 수정 시 사용자에게 영향 범위를 먼저 고지한다
- **백엔드 수정 요청의 대부분은 SAP REST API 파라미터 문제 또는 신규 연동 추가**가 원인이다
  → 업무 로직 오류로 보이는 경우에도 SAP API 응답값·파라미터를 먼저 확인한다
- **DB 벤더 판단**: 쿼리 작성 시 해당 환경의 `server/*.properties`에서 주석 해제된 `db.vendor` 값을 기준으로 한다
