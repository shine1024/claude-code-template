# CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md 사용 안내

> 이 파일은 unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) 프로젝트의 `CLAUDE.md`를 생성하기 위한 **완성된 기본 템플릿**입니다.
> 아래 절차에 따라 프로젝트 루트에 `CLAUDE.md`를 생성하세요.

## 사용 방법

1. `---` 구분선 아래 내용을 그대로 복사하여 프로젝트 루트에 `CLAUDE.md`를 생성합니다.
2. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정합니다.

## 작성 체크리스트

- [ ] 루트 CLAUDE.md가 200줄 이내인가?
- [ ] 프론트엔드(unidocu6-mobile)는 `CLAUDE-TEMPLATE-uniworks-pce-mobile.md`를 별도 참고했는가?

---

# unidocu6-mobile-server — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: unidocu6-mobile-server (UniWorks PCE Mobile 서버)
- **목적**: UniWorks PCE 모바일 앱 백엔드 — SAP RFC 연동, JWT 인증, 파일·OCR 처리
- **기술 스택**:
  - Backend: Java 11 (JDK) / Maven compiler source·target: 1.8, Spring MVC 4.3.4, Maven (WAR)
  - Template: Thymeleaf 3.0.10 (HTML 동적 생성), Mustache
  - Database: 없음 — 모든 데이터는 SAP RFC 경유
- **주요 외부 연동**:
  - SAP RFC: `NamedService`를 통한 JCO 호출
  - Push: Firebase GCM (Android), Apple Push Notification (iOS)
  - SMTP: 내부 메일 서버
- **참고**: 별도 core 프로젝트 없음 — 공통 로직(AbstractJAVAService, NamedService, 인터셉터 등)이 이 프로젝트 안에 포함

---

## 2. 프로젝트 구조

```
unidocu6-mobile-server/
├── src/main/java/com/unipost/unidocu/
│   ├── spring_config/       # Spring MVC 설정, WebSocket 설정
│   ├── controller/          # API Controller
│   │   ├── MobileController.java          # 모바일 핵심 API
│   │   ├── MobileFileUploadController.java
│   │   ├── MobileFileDownController.java
│   │   ├── MobileOcrController.java       # OCR
│   │   ├── NamedServiceController.java    # SAP NamedService 라우팅
│   │   └── ExceptionHandlingController.java
│   ├── service/             # 비즈니스 서비스
│   │   ├── AbstractJAVAService.java       # NamedService 구현체 베이스
│   │   ├── NamedService.java              # SAP RFC 호출 진입점
│   │   ├── MobileLoginService.java        # 로그인·세션·JWT 발급
│   │   ├── MobileFileService.java         # 파일 처리
│   │   ├── MobileMakeHtmlService.java     # HTML 동적 생성
│   │   └── SmsService.java               # SMS 발송
│   ├── ns/unidocuui/        # 공통 NamedService 구현체
│   ├── module/
│   │   ├── named_service/   # JCOManagerWrapper, CacheKeyManager
│   │   ├── property/        # ServerProperty, RfcDestinationProperty
│   │   ├── session/         # UniPostSession, UserInfoManager
│   │   └── mustache/        # UniDocuUITemplateRenderer
│   ├── interceptor/         # 세션, 보안, OAuth2 인터셉터 등
│   ├── filter/              # SpaRedirectFilter (SPA 라우팅)
│   └── util/                # JwtUtil, AES 암호화, OcrUtils, NasFileUtil 등
├── src/main/resources/
│   ├── server/              # 환경별 설정 (local_dev, docker 등)
│   ├── rfc_destination/     # SAP JCO 접속 설정 (destination별 .properties)
│   ├── smtp.properties      # SMTP 설정
│   └── templates/           # Thymeleaf 템플릿
├── src/main/webapp/
│   └── WEB-INF/             # web.xml (DispatcherServlet, SpaRedirectFilter)
└── pom.xml
```

---

## 3. 아키텍처 패턴

### 인증 흐름 (모바일 전용)

```
앱 → POST /mobile/login.do
  → MobileLoginService: HttpSession 생성 + JWT 토큰 발급 (JwtUtil)
  → 응답: JWT token

이후 API 요청: Authorization: Bearer {token} 헤더 포함
  → SessionControllerInterceptor: 세션 + JWT 검증

자동로그인: POST /mobile/authAutoLogin.do
  → JWT 토큰 유효성 검증 → 세션 재생성
```

### NamedService 패턴 (SAP RFC)

```
앱 → /unidocu/namedService/call?namedServiceId=Xxx
  → NamedServiceController
    → AbstractJAVAService 구현체의 call(NSParam) 실행
      → FUNCTION_MODE로 내부 분기
      → NamedService.call(namedServiceId, importParam) → JCO → SAP
```

- 모든 NamedService 구현체는 **`AbstractJAVAService`를 상속**하고 `call(NSParam)` 메서드를 구현한다
- `FUNCTION_MODE` 파라미터로 내부 동작을 분기한다
- 클래스명에서 `Service` 접미사를 제거한 값이 `namedServiceId`가 된다

### SAP RFC 호출 패턴

```
- NamedService.call(namedServiceId, importParam) → JCOManagerWrapper → JCO 직접 호출
- RFC destination 설정: rfc_destination/*.properties (jco.client.* 형식)
- RFC 함수명·파라미터명은 SAP에서 정의된 이름 그대로 사용 (임의 변경 금지)
- RFC 응답 OS_RETURN.TYPE = "E" 수신 시 NSLogicalException throw
```

### 주요 모바일 API 엔드포인트

```
POST /mobile/login.do               → 로그인 (세션 + JWT 발급)
POST /mobile/logout.do              → 로그아웃
POST /mobile/authAutoLogin.do       → 자동로그인 (JWT 검증)
GET  /mobile/getServerProperties.do → 서버 설정 조회
POST /mobile/getHtml.do             → HTML 동적 생성 (Thymeleaf)
POST /UniMobileFileUpload/**        → 파일 업로드
GET  /mobile/biz/file/**            → 파일 다운로드
POST /mobile/ocrScan/**             → OCR 처리
```

### 트랜잭션

```
- 로컬 DB 없음 → @Transactional 미사용
- 트랜잭션 경계는 SAP RFC 서버 측에서 관리
```

---

## 4. rules/ 파일 구성

| 파일 | 용도 | 필수 여부 |
|------|------|-----------|
| `java-style.md` | Java 코딩 컨벤션 | 필수 |
| `workflow.md` | 커밋 메시지 규칙, 브랜치 전략 | 선택 |

---

## 5. Claude 작업 지침

> 공통 지침(순차 진행, 기존 패턴 탐색, 신규 화면 접근법, 응답 방식, 에러 분석)은 `CLAUDE-TEMPLATE.md` 참고

- **신규 비즈니스 로직**은 `AbstractJAVAService`를 상속한 Service 클래스에 `FUNCTION_MODE` 분기로 구현한다
  → 기존 Service의 패턴을 먼저 탐색한 후 동일 방식으로 작성한다
- **로컬 DB·MyBatis·@Transactional을 사용하지 않는다** — 데이터는 SAP RFC로만 처리한다
- **SAP RFC 호출**은 `NamedService.call(namedServiceId, importParam)` 패턴을 사용한다
  → RFC 함수명·파라미터명은 SAP에서 정의된 이름을 임의로 변경하지 않는다
  → RFC 응답 `OS_RETURN.TYPE = "E"` 확인 후 `NSLogicalException`을 throw한다
- **JWT 토큰 처리**는 `JwtUtil`을 사용한다 — 직접 토큰 파싱 로직을 작성하지 않는다
- **환경별 설정**은 `server/*.properties`로 분리한다 — 코드 내 하드코딩 금지
- **백엔드 수정 요청의 대부분은 SAP RFC 파라미터 문제 또는 신규 연동 추가**가 원인이다
  → 업무 로직 오류로 보이는 경우에도 RFC 응답값·파라미터를 먼저 확인한다
