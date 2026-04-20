# CLAUDE-TEMPLATE-uniflow.md 사용 안내

> 이 파일은 uniflow 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. 각 모듈 디렉터리에도 하단 **모듈별 CLAUDE.md 예시**를 참고하여 `CLAUDE.md`를 생성합니다.
3. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] uniflow-web, uniflow-mobile, uniflow-server-common, uniflow-client-common 각 모듈에 CLAUDE.md를 생성했는가?

---

# uniflow — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: uniflow
- **목적**: 전자결재 솔루션
- **기술 스택**:
  - Backend: Java 1.8, Spring MVC 4.2.9, Spring Security 4.2.20, MyBatis 3.4.6
  - Frontend: Handlebars(HBS) 주력, JSP 일부 혼용
  - Database: MariaDB
- **주요 외부 연동**: SAP JCO (uni-rfc 래퍼), Firebase FCM, AWS S3

---

## 2. 프로젝트 구조

```
uniflow/                         ← Maven 멀티 모듈 (parent POM)
├── uniflow-web/                 ← 웹 Controller + HBS/JSP 프론트
├── uniflow-mobile/              ← 모바일 전용 Controller + 프론트
├── uniflow-server-common/       ← 공통 비즈니스 로직 (Service, Mapper, Model)
└── uniflow-client-common/       ← 공통 JS 라이브러리 (webjars)
```

### 모듈 의존 관계

```
uniflow-web    ──→ uniflow-server-common
uniflow-mobile ──→ uniflow-server-common
uniflow-web / uniflow-mobile ──→ uniflow-client-common (webjars 참조)
```

### 프론트엔드 파일 위치

| 파일 유형 | 경로 |
|-----------|------|
| HBS 템플릿 (웹) | `uniflow-web/src/main/webapp/webjars/` |
| HBS 템플릿 (모바일) | `uniflow-mobile/src/main/webapp/m/webjars/` |
| JSP (레이아웃·공통) | `uniflow-web/src/main/webapp/WEB-INF/views/` |
| MyBatis XML | `uniflow-server-common/src/main/resources/unicloud/webapp/*/mapper/` |

---

## 3. 아키텍처 패턴

### 레이어 구조

```
Controller (uniflow-web 또는 uniflow-mobile 모듈)
  → Service (uniflow-server-common 모듈, @Service)
    → Mapper (uniflow-server-common 모듈, @Repository 인터페이스)
      → MyBatis XML (uniflow-server-common/src/main/resources)
```

> Controller는 web/mobile 모듈에, Service·Mapper는 server-common 모듈에 분리됩니다.
> Controller에서 비즈니스 로직 작성 금지 — Service에 위임합니다.

### 베이스 클래스

| 클래스 | 위치 | 용도 |
|--------|------|------|
| `BaseRESTController` | `uniflow-web/.../unicloud/base/web/controller` | REST API 공통 응답 (`restSuccess` / `restFail`) |

- REST API Controller는 `BaseRESTController`를 상속합니다.
- 일반 화면(View) Controller는 베이스 클래스 없이 `@Controller`만 사용합니다.

### 트랜잭션

```
- @Transactional은 Service 레이어 메서드에만 선언
- 쓰기 작업: @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
- 읽기 작업: @Transactional(propagation = Propagation.SUPPORTS, rollbackFor = Exception.class)
- Mapper 레이어에서는 @Transactional 선언 금지
```

### 공통 예외 처리

```
- ExceptionHandlingControllerAdvice (@ControllerAdvice): 전역 예외 처리
- UnicloudException: 비즈니스 예외 → 메시지 그대로 클라이언트에 전달
- 일반 예외: 보안상 스택트레이스 미노출 → 범용 메시지 반환
- 응답 분기:
  - AJAX 요청 (x-requested-with 헤더) / .hbs / .json URL → JSON 응답
  - 일반 요청 → /errorView 페이지
- 모바일: MobileExceptionHandlingControllerAdvice 별도 적용
```

---

## 4. rules/ 파일 구성

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `java-style.md` | Java 코딩 컨벤션 | 필수 |
| `js-style.md` | JavaScript / HBS 코딩 컨벤션 | 필수 |
| `sql-style.md` | SQL 코딩 컨벤션 (Oracle) | 필수 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## 5. Claude 작업 지침

> 공통 지침(순차 진행, 기존 패턴 탐색, 신규 화면 접근법, 응답 방식, 에러 분석, git push 금지)은 `CLAUDE-TEMPLATE.md` 참고

- **레이어 위치 규칙**: Controller는 web/mobile 모듈에, Service·Mapper는 server-common 모듈에 생성한다
- **신규 화면 개발 시**:
  - HBS 파일은 `webjars/` 하위에 생성하고, 기존 유사 화면의 구조·JS 패턴을 먼저 탐색한다
  - JSP와 HBS를 혼용하지 않는다 — 신규 화면은 HBS 기준으로 작성한다
- **MyBatis Mapper 수정 시** XML 네임스페이스와 Mapper 인터페이스명 일치 여부를 반드시 확인한다
- **SAP JCO 호출 시** `uni-rfc` 래퍼 클래스의 기존 패턴을 먼저 탐색하고, `JCoFunction`을 직접 사용하지 않는다
- **DDL/DML 변경 이력**: `change-history/YYYYMMDD_설명.md`에 변경 내용을 기록한다
- **설정 파일**: `application.properties`에 직접 값을 넣지 않는다 — pom.xml 프로파일로 관리

---

---

# 모듈별 CLAUDE.md 가이드

## 레벨별 작성 원칙

| 레벨 | 담을 내용 |
|------|-----------|
| 루트 CLAUDE.md | 프로젝트 개요, 모듈 구조, 아키텍처 패턴, 작업 지침 |
| 모듈 CLAUDE.md | 모듈 역할, 폴더 구조, 모듈 전용 컨벤션 |
| rules/*.md | 언어별 공통 코드 스타일 (세션 시작 시 자동 참조) |

> 모듈 CLAUDE.md에서는 루트 내용을 반복하지 않습니다.

## uniflow-web CLAUDE.md 예시

```markdown
# uniflow-web — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

웹 브라우저용 Controller 및 HBS/JSP 화면 담당

## 폴더 구조

src/main/java/unicloud/
├── base/web/controller/         # 공통 BaseRESTController, 첨부 등
├── base/web/exception/          # ExceptionHandlingControllerAdvice
└── webapp/                      # 기능별 Controller (approval, admin, portal 등)

src/main/webapp/
├── webjars/                     # HBS 템플릿 (신규 화면은 여기에 생성)
└── WEB-INF/views/               # JSP (레이아웃·공통 페이지)

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/java-style.md` / `js-style.md` 참고
- REST API Controller는 BaseRESTController 상속 후 restSuccess / restFail 사용
- 일반 화면 Controller는 @Controller만 사용 (베이스 클래스 없음)
```

## uniflow-mobile CLAUDE.md 예시

```markdown
# uniflow-mobile — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

모바일(앱 WebView) 전용 Controller 및 HBS 화면 담당

## 폴더 구조

src/main/java/unicloud/
├── base/web/controller/         # 공통 모바일 Controller
├── base/web/exception/          # MobileExceptionHandlingControllerAdvice
└── webapp/                      # 기능별 모바일 Controller

src/main/webapp/m/webjars/       # 모바일 HBS 템플릿

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/java-style.md` / `js-style.md` 참고
- 웹과 모바일은 화면·Controller가 별도로 존재한다 — 웹 파일을 모바일에 공유하지 않는다
- 예외 처리는 MobileExceptionHandlingControllerAdvice가 담당한다
```

## uniflow-server-common CLAUDE.md 예시

```markdown
# uniflow-server-common — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

web / mobile 모듈이 공통으로 사용하는 Service, Mapper, Model 담당

## 폴더 구조

src/main/java/unicloud/webapp/
├── */mapper/                    # @Repository Mapper 인터페이스
├── */model/                     # DTO / VO
└── */*Service.java              # @Service 클래스

src/main/resources/unicloud/webapp/*/mapper/  # MyBatis XML

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/java-style.md` / `sql-style.md` 참고
- 이 모듈에 Controller를 생성하지 않는다
- Mapper 인터페이스와 XML 파일은 같은 패키지 경로에 맞춰 위치한다
```

## uniflow-client-common CLAUDE.md 예시

```markdown
# uniflow-client-common — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할

web / mobile 모듈이 webjars 형태로 참조하는 공통 JS 라이브러리 담당

## 폴더 구조

src/main/resources/META-INF/resources/webjars/
├── customLib/                   # HBS 헬퍼, 커스텀 유틸
├── lib/                         # 외부 라이브러리
└── module/                      # 공통 UI 모듈

## 모듈 전용 컨벤션

> 공통 규칙: `.claude/rules/js-style.md` 참고
- 이 모듈의 변경은 web / mobile 전체에 영향을 준다
  → 공개 함수·전역 변수 수정 시 사용자에게 영향 범위를 먼저 고지한다
```
