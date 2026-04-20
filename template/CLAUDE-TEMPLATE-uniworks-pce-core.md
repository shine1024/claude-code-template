# CLAUDE-TEMPLATE-uniworks-pce-core.md 사용 안내

> 이 파일은 unidocu6-core (uniworks-pce-core) 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. 각 모듈 디렉터리에도 하단 **모듈별 CLAUDE.md 예시**를 참고하여 `CLAUDE.md`를 생성합니다.
3. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] unidocu6-servercore, unidocu6-clientcore, unidocu6-webjars 각 모듈에 CLAUDE.md를 생성했는가?

> **public-sap-core와의 차이**: 이 프로젝트는 로컬 DB·MyBatis·SapApiService가 없습니다.
> 데이터는 전적으로 SAP RFC (JCO)를 통해 처리됩니다.

---

# unidocu6-core — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: unidocu6-core (UniWorks PCE Core)
- **목적**: unidocu6(pce)의 공통 라이브러리 — JAR 빌드 후 downstream 프로젝트에서 parent POM으로 참조
- **기술 스택**:
  - Backend: Java 11 (JDK) / Maven compiler source·target: 1.8, Spring MVC 4.3.4, Maven 멀티 모듈
  - Frontend: webjars (공통 JS/CSS)
  - Database: 없음 — 모든 데이터는 SAP RFC 경유
- **downstream 프로젝트**: unidocu6 (= 이 core를 parent POM으로 참조하는 구축 프로젝트)

> **주의**: 이 프로젝트의 변경은 downstream 전체에 영향을 줍니다.
> 공개 API(AbstractJAVAService, NamedService 등) 변경 시 반드시 downstream 호환성을 확인하세요.

---

## 2. 프로젝트 구조

```
unidocu6-core/                   ← Maven 멀티 모듈 (parent POM)
├── unidocu6-servercore/         ← 서버 공통 JAR (Controller, Service, 인터셉터, 예외 처리)
├── unidocu6-clientcore/         ← 클라이언트 공통 리소스 (JS, 설정)
└── unidocu6-webjars/            ← 공통 UI 라이브러리 JAR (webjars)
```

### 모듈 역할

| 모듈 | 빌드 산출물 | 주요 내용 |
|------|------------|-----------|
| `unidocu6-servercore` | .jar | Controller, AbstractJAVAService, NamedService, 인터셉터, 예외 처리 |
| `unidocu6-clientcore` | .jar | 공통 JS 설정, 리소스 |
| `unidocu6-webjars` | .jar | 공통 UI 라이브러리 (webjars 형태) |

> **로컬 DB 없음** — Mapper, DatabaseConfig, MyBatis XML이 존재하지 않습니다.

---

## 3. 아키텍처 패턴

### NamedService 패턴 (servercore 핵심)

```
프론트(JS) → /unidocu/namedService/call?namedServiceId=Xxx
  → NamedServiceController
    → NamedService.call(namedServiceId, params)
      → AbstractJAVAService 구현체의 call(NSParam) 실행
        → FUNCTION_MODE로 내부 분기
        → SAP RFC: NamedService.call(namedServiceId, importParam) → JCO
```

- **`AbstractJAVAService`**: 모든 NamedService 구현체의 베이스 클래스
  - `@PostConstruct`에서 클래스명(Service 제거)을 namedServiceId로 자동 등록
  - `call(NSParam)` 추상 메서드를 구현하여 FUNCTION_MODE 분기 처리
- **`NamedService`**: SAP JCO RFC 직접 호출 진입점

### 트랜잭션

```
- 로컬 DB 없음 → @Transactional 미사용
- 트랜잭션 경계는 SAP RFC 서버 측에서 관리
- RFC 응답 OS_RETURN.TYPE = "E" 수신 시 NSLogicalException throw
```

### 베이스 클래스 및 공개 API

| 클래스/인터페이스 | 위치 | downstream 사용 방식 |
|------------------|------|---------------------|
| `AbstractJAVAService` | servercore/service | 상속 후 `call()` 구현 |
| `NamedService` | servercore/service | `@Autowired` 주입 후 `call()` 호출 |

### 공통 예외 처리

```
- ExceptionHandlingController (@ControllerAdvice): 전역 예외 처리
- NSLogicalException: 비즈니스 예외 → 메시지 그대로 클라이언트에 전달
- SessionNotFoundException / RequireBustMismatchException 등: 세션·캐시 관련 예외
- 응답 분기: AJAX → jsonView, 일반 → /error/view forward
```

---

## 4. rules/ 파일 구성

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `java-style.md` | Java 코딩 컨벤션 | 필수 |
| `js-style.md` | JavaScript 코딩 컨벤션 (webjars) | 필수 |
| `workflow.md` | 커밋 메시지 규칙, JAR 배포 절차 | 권장 |

---

## 5. Claude 작업 지침

- 이 프로젝트의 변경은 downstream(unidocu6) 전체에 영향을 준다
  → `AbstractJAVAService`, `NamedService` 등 공개 API 수정 시 반드시 사용자에게 downstream 영향을 먼저 고지한다
- 메서드 시그니처·클래스명 변경은 downstream 컴파일 오류를 유발할 수 있으므로 신중하게 진행한다
- **로컬 DB·MyBatis·@Transactional을 추가하지 않는다** — 이 프로젝트는 RFC 전용 설계
- **새로운 공통 기능 추가 시** downstream에서 실제로 필요한지 확인 후 진행한다
- 프로젝트에 존재하지 않는 클래스·함수를 임의로 생성하지 않는다
  → 불확실한 경우 기존 코드에서 실제 사용 중인 패턴을 먼저 탐색한다
- **응답 방식**: 한국어로 소통하며 짧고 간결하게 답한다 — 변경 내용 요약은 표 형식으로
- **에러 분석**: 스택트레이스 → 원인 클래스/메서드 특정 → 수정 방안 단계별 설명 후 적용
- **git push 금지**: 사용자가 명시적으로 요청하지 않으면 실행하지 않는다

---

---

# 모듈별 CLAUDE.md 가이드

## 레벨별 작성 원칙

| 레벨 | 담을 내용 |
|------|-----------|
| 루트 CLAUDE.md | 프로젝트 개요, 모듈 구조, 아키텍처 패턴, downstream 영향 범위 |
| 모듈 CLAUDE.md | 모듈 역할, 폴더 구조, 공개 API, 모듈 전용 컨벤션 |
| rules/*.md | 언어별 공통 코드 스타일 (세션 시작 시 자동 참조) |

> 모듈 CLAUDE.md에서는 루트 내용을 반복하지 않습니다.

## unidocu6-servercore CLAUDE.md 예시

```markdown
# unidocu6-servercore — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

downstream(unidocu6)이 공통으로 사용하는 Controller, Service, 인터셉터, 예외 처리 담당
로컬 DB 없음 — 데이터는 전적으로 SAP RFC(JCO)를 통해 처리

## 폴더 구조

src/main/java/com/unipost/unidocu/
├── controller/          # NamedServiceController, ExceptionHandlingController 등
├── service/             # AbstractJAVAService, NamedService
├── ns/unidocuui/        # 공통 NamedService 구현체 (LoginService, MultiLanguageService 등)
├── interceptor/         # 세션 체크, 보안, OAuth2 인터셉터
└── module/              # JCOManagerWrapper, ServerProperty 등 핵심 모듈

src/main/resources/
└── mustache/            # 공통 Mustache 템플릿 (errorView, 메일 등)

## 공개 API (downstream 참조)

- AbstractJAVAService: 모든 NamedService 구현체의 베이스 (상속 필수)
- NamedService: SAP RFC 호출 (@Autowired 주입)

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/java-style.md` 참고
- 이 모듈에 DatabaseConfig, Mapper, MyBatis 관련 코드를 추가하지 않는다
- 이 모듈에 새 Controller를 추가할 때는 공통 기능인지 신중히 판단한다 (커스터마이징은 downstream에)
```

## unidocu6-clientcore CLAUDE.md 예시

```markdown
# unidocu6-clientcore — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

downstream(unidocu6)이 참조하는 공통 클라이언트 리소스 담당

## 폴더 구조

src/main/resources/
└── (공통 JS 설정, 리소스 파일)

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/js-style.md` 참고
- 이 모듈의 변경은 downstream 전체에 영향을 준다 → 수정 전 사용자에게 영향 범위 고지
```

## unidocu6-webjars CLAUDE.md 예시

```markdown
# unidocu6-webjars — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

downstream이 webjars 형태로 참조하는 공통 UI 라이브러리 담당

## 폴더 구조

src/main/resources/META-INF/resources/webjars/   # 공통 JS/CSS 라이브러리

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/js-style.md` 참고
- 이 모듈의 변경은 downstream 전체에 영향을 준다 → 수정 전 사용자에게 영향 범위 고지
- 공개 함수·전역 변수 수정 시 downstream의 기존 호출부를 반드시 확인한다
```
