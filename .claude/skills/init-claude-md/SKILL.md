프로젝트를 분석하여 CLAUDE.md 파일을 생성합니다.

## 실행 절차

### 1단계: 프로젝트 유형 선택

출력 경로는 현재 작업 디렉터리(`pwd`)를 사용합니다.

아래 형식으로 출력하고 번호 입력을 요청합니다.

```
프로젝트를 선택하세요 (번호 입력):

| 번호 | 대상 프로젝트 |
|------|--------------|
| 1 | unidocu6 (UniWorks PCE) |
| 2 | unidocu6-public-sap (UniWorks Public) |
| 3 | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| 4 | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| 5 | uniflow (전자결재) |
| 6 | 기타 (위 목록에 해당하지 않는 프로젝트) |
```

템플릿 파일명 매핑:
- 1 → CLAUDE-TEMPLATE-uniworks-pce.md
- 2 → CLAUDE-TEMPLATE-uniworks-public.md
- 3 → CLAUDE-TEMPLATE-uniworks-pce-mobile.md
- 4 → CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md
- 5 → CLAUDE-TEMPLATE-uniflow.md
- 6 → 없음

**라이브러리 의존 관계 처리:**

프로젝트에 따라 두 가지 패턴으로 처리합니다.

**패턴 A — 외부 저장소 의존 (UniWorks 구현 프로젝트):**
선택 4는 별도 저장소의 unidocu6 프로젝트를 .jar 라이브러리로 참조합니다. `additionalDirectories` + `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` 방식으로 연동합니다.
아래 메시지를 출력하고 참조 프로젝트 경로 입력을 요청합니다.

```
이 프로젝트는 unidocu6 프로젝트를 참조합니다.
unidocu6 프로젝트 경로를 입력하세요 (건너뛰려면 엔터):
예) C:\intellij-workspace\unidocu6
```

| 선택 번호 | 참조 프로젝트 |
|----------|-------------|
| 4 (unidocu6-mobile-server) | unidocu6 (unidocu6-core 모듈 포함) |

경로가 입력되면:
- **2단계**: 해당 프로젝트의 CONTEXT 파일도 함께 읽어 참조합니다.
- **3단계**: 참조 프로젝트 코드를 먼저 분석합니다 (3-0).
- **4단계**: **참조 프로젝트 CLAUDE.md를 먼저 생성**한 후, 구현 프로젝트 CLAUDE.md를 생성합니다.
- **7단계**: 완료 안내에 `settings.local.json` 설정 방법을 포함합니다.

**패턴 B — 내부 멀티 모듈 의존 (unidocu6·unidocu6-public-sap·uniflow 등):**
단일 저장소 내에서 core/common 모듈을 구현 모듈이 참조하는 구조입니다. 선택 1·2·5가 해당합니다. 모듈 분석 순서로만 처리합니다.
CONTEXT 파일의 `## 2. 분석 순서` 섹션을 읽어 그 순서대로 모듈을 분석·CLAUDE.md를 생성합니다. 섹션이 없으면 pom.xml `<modules>` 선언 순서를 따릅니다.

### 2단계: CONTEXT 파일 읽기

**8번(기타)이 아닌 경우:** `.claude/template/{파일명}`을 읽어 아래 내용을 추출합니다.

**`## 1. 서비스 개요`** 에서 아래 필드를 추출합니다.

| 필드 | 내용 | 활용 |
|------|------|------|
| 서비스명, 목적, 주요 기능, 사용자 등 | 서비스 기본 정보 | CLAUDE.md Section 1 |
| **참조 라이브러리** | 의존하는 .jar 라이브러리 및 제공 내용 | CLAUDE.md Section 1, 분석 맥락 |

**`## 2. 분석 순서`** 가 있으면 그 순서대로 모듈·프로젝트를 분석합니다. 없으면 pom.xml `<modules>` 선언 순서를 따릅니다.

참조 프로젝트 경로가 입력된 경우 (패턴 A — mobile-server) 해당 프로젝트의 CONTEXT 파일(`CLAUDE-TEMPLATE-{프로젝트}.md`)도 함께 읽어 참조합니다.

CONTEXT 파일의 각 섹션은 CLAUDE.md에 그대로 복사하지 않습니다. 3단계 코드 분석 결과와 종합하여 CLAUDE.md 고정 4섹션 구조에 녹여 작성합니다.

> `.claude/template/{파일명}`이 없으면 아래 메시지를 출력하고 중단합니다.
> ```
> ❌ .claude/template/ 폴더를 찾을 수 없습니다.
> init.bat을 실행하여 프로젝트를 초기화한 뒤 다시 시도하세요.
> ```

### 3단계: 프로젝트 분석

**분석 시작 전: 분석 순서 결정**

2단계에서 추출한 `## 2. 분석 순서` 값을 기준으로 이번 3단계 전체의 분석 순서를 확정합니다.

| 상황 | 적용 순서 |
|------|----------|
| CONTEXT `## 2. 분석 순서` 있음 | 해당 순서를 그대로 따름 |
| 없음 (멀티 모듈) | pom.xml `<modules>` 선언 순서 |
| 없음 (단일 모듈) | 순서 없음, 바로 분석 진행 |

확정된 순서대로 아래 3-0 ~ 3-5 분석을 반복 수행합니다.

#### 3-0. 참조 프로젝트 분석 (패턴 A — unidocu6-mobile-server 전용)

2단계에서 참조 프로젝트(unidocu6) 경로가 입력된 경우, 구현 프로젝트 분석 전에 참조 프로젝트를 먼저 분석합니다.
참조 프로젝트 CONTEXT 파일의 `## 2. 분석 순서`가 있으면 그 순서대로 내부 모듈을 분석합니다.

| 탐색 대상 | 추출 정보 | 활용 위치 |
|----------|----------|----------|
| 참조 프로젝트 루트 `pom.xml` | 모듈 구성, 주요 의존성 | Section 1 주요 외부 연동 보완 |
| `abstract` 클래스 전체 | base class 목록, 제공 메서드 시그니처 | Section 3 베이스 클래스, Section 4 필수 패턴 |
| `*Service`, `*Util` 공통 클래스 | 공통 유틸 목록 (NamedService, SapApiService, JwtUtil 등) | Section 4 필수/금지 패턴 |
| `src/main/java` 패키지 구조 | 참조 프로젝트가 제공하는 레이어·패키지 범위 | Section 3 레이어 구조 설명 보완 |

> 3-0 분석이 완료되면 4단계에서 참조 프로젝트 CLAUDE.md를 먼저 생성합니다. 멀티 모듈이면 5단계(모듈별 CLAUDE.md 생성)도 참조 프로젝트에 대해 먼저 수행합니다.

#### 3-1. 기술 스택 파악

다음 파일을 읽어 기술 스택을 파악합니다.

| 파일 | 추출 정보 |
|------|----------|
| `pom.xml` | 프로젝트명, 언어, 프레임워크 버전, 주요 의존성, 멀티 모듈 여부 |
| `package.json` | 프로젝트명, 주요 라이브러리, TypeScript 여부 |
| `application.properties` / `server/*.properties` | DB 벤더, 외부 연동 설정 |

**적용 rules 결정:**

| 기술 스택 | 적용 rules |
|----------|-----------|
| Java | `java-style.md` |
| JavaScript / TypeScript | `js-style.md` |
| DB 사용 (MyBatis 등) | `sql-style.md` |
| RealGrid2 의존성 존재 | `realgrid.md` |

#### 3-2. 프로젝트 구조 탐색

`src/main/java`, `src/main/resources`, `src/main/webapp` (Java) 또는 `src/` (React) 하위 주요 디렉터리를 탐색합니다.
pom.xml에 `<modules>`가 있으면 각 모듈 디렉터리도 탐색합니다.

**Java 소스가 없는 모듈 (client-common, clientcore 등):**
`src/main/java`가 없거나 비어 있으면 Java 분석을 건너뛰고, `src/main/resources/META-INF/resources/` 하위를 탐색합니다.

| 탐색 경로 | 추출 정보 | 활용 위치 |
|----------|----------|----------|
| `META-INF/resources/webjars/` | JS 라이브러리·컴포넌트 파일 구조 | Section 2 프로젝트 구조, Section 3 레이어 구조 |
| `META-INF/resources/images/` | 공통 이미지 리소스 존재 여부 | Section 2 프로젝트 구조 |
| `webjars/**/*.js` | 공통 JS 유틸·초기화 스크립트 (initScript.js 등) | Section 3 현재 표준 패턴, Section 4 필수 패턴 |
| `webjars/**/*.mustache` | Mustache 템플릿 컴포넌트 목록 | Section 3 레이어 구조, Section 4 필수 패턴 |

#### 3-3. 아키텍처 분석

| 탐색 대상 | 확인 방법 |
|----------|----------|
| 레이어 구조 | 패키지명(controller, service, mapper 등)과 어노테이션 |
| 베이스 클래스 | abstract class 및 extends 관계 |
| 트랜잭션 정책 | @Transactional 어노테이션 사용 여부·레이어 |
| 예외 처리 방식 | @ControllerAdvice 클래스 위치·응답 분기 로직 |

#### 3-4. 도메인 분석

코드에서 업무 도메인 정보를 추출합니다. CONTEXT Section 2(도메인 지식)에 내용이 있으면 함께 참조하여 보완합니다.

| 탐색 대상 | 추출 정보 | 활용 위치 |
|----------|----------|----------|
| Entity·VO·DTO 클래스명 | 핵심 도메인 객체 목록 | Section 3 레이어 구조 서술에 실제 용어 사용 |
| Service 메서드명 | 주요 비즈니스 기능 | Section 3 레이어 구조 설명 |
| Mapper XML 쿼리·테이블명 | 데이터 영역(어떤 업무 데이터를 다루는가) | Section 3 보조 |
| React 페이지·컴포넌트 디렉터리명 | 화면 단위 및 주요 기능 흐름 | Section 2 프로젝트 구조 보충 |

#### 3-5. 작업 지침 도출

코드에서 아래 패턴을 탐색하여 발견되면 대응하는 규칙을 생성합니다. CONTEXT Section 4·5에 내용이 있으면 함께 참조하여 보완합니다.

**필수 패턴:**

| 발견 패턴 | 생성 규칙 |
|----------|----------|
| `AbstractJAVAService` 존재 | 신규 비즈니스 로직은 `AbstractJAVAService`를 상속하여 `FUNCTION_MODE`로 구현하고, 기존 Service 패턴을 먼저 탐색한 후 동일 방식으로 작성한다 |
| `NamedService` 존재 | SAP RFC 호출은 `NamedService.call(namedServiceId, importParam)` 패턴을 사용하고, RFC 응답 `OS_RETURN.TYPE = "E"` 확인 후 `NSLogicalException`을 throw한다 |
| `SapApiService` 존재 | SAP REST API 호출은 `SapApiService.callApi()` 패턴을 사용하고, 엔드포인트·파라미터는 SAP 공식 문서 또는 기존 구현 기준으로 작성한다 |
| `JwtUtil` 존재 | JWT 토큰 처리는 `JwtUtil`을 사용한다 |
| `BaseRESTController` 또는 `AbstractRESTController` 존재 | REST API Controller는 {실제 클래스명}을 상속한다 |
| `server/*.properties` 존재 | 환경별 설정은 `server/*.properties`로 분리한다 |
| `db.vendor` 속성 존재 | 쿼리 작성 시 해당 환경의 `db.vendor` 값을 먼저 확인한다 |
| webjars 멀티 모듈 구조 (servercore·clientcore·webjars) | 탐색 순서: 구현 프로젝트 → servercore → clientcore → webjars |
| `useAxiosApi` 훅 존재 | API 호출은 반드시 `useAxiosApi` 훅을 통한다 |
| Redux store 존재 | 상태 변경은 Redux slice를 통한다 — 컴포넌트 로컬 상태는 화면 UI 전용 |
| `webpack.config.js` proxy 설정 존재 | 신규 API 연동 시 `webpack.config.js` 프록시에 해당 엔드포인트 등록 여부를 먼저 확인한다 |
| `src/types/` 디렉터리 존재 | TypeScript 타입은 `src/types/` 하위 파일에 정의한다 |
| `rfc_destination/` 디렉터리 존재 | RFC destination 설정은 `rfc_destination/*.properties` 참조 |
| postgresql·mariadb 양쪽 Mapper XML 디렉터리 존재 | Mapper XML 작성 시 postgresql·mariadb 양쪽 디렉터리 전체 파일을 대조하여 예외 케이스를 먼저 확인한다 |

**금지 사항:**

| 발견 패턴 | 생성 규칙 |
|----------|----------|
| Java 프로젝트이면서 `DatabaseConfig` / Mapper XML 없음 | 로컬 DB·MyBatis·@Transactional을 사용하지 않는다 — 데이터는 SAP RFC로만 처리 |
| `NamedService` 존재 + `JCoFunction` 직접 사용 없음 | SAP JCO 호출 시 `JCoFunction`을 직접 사용하지 않는다 |
| `rfc_destination/` 존재 | RFC 함수명·파라미터명을 임의로 변경하지 않는다 — SAP에서 정의된 이름 그대로 사용 |
| `server/*.properties` 존재 | 환경별 설정을 코드 내 하드코딩하지 않는다 |
| `useAxiosApi` 훅 존재 | axios를 직접 import하지 않는다 — `useAxiosApi` 훅만 사용 |
| TypeScript 프로젝트 | `any` 타입을 임의로 사용하지 않는다 |
| `.env.*` 파일 존재 | 코드 내 URL·키를 하드코딩하지 않는다 — `.env.*` 파일로 관리 |
| postgresql·mariadb 양쪽 Mapper XML 존재 | Mapper XML 신규 작성 시 postgresql과 mariadb 양쪽 모두 작성한다 |

### 4단계: CLAUDE.md 작성

**참조 프로젝트 경로가 입력된 경우 (패턴 A — mobile-server), 참조 프로젝트 CLAUDE.md를 먼저 생성합니다.** 참조 프로젝트가 멀티 모듈이면 모듈별 CLAUDE.md도 함께 생성합니다 (5단계 동일 적용). 이후 구현 프로젝트 CLAUDE.md를 생성합니다.

아래 고정 스키마로 내용을 작성합니다. 확인이 안 된 항목은 `{확인 필요}`로 표시합니다.

각 섹션 작성 원칙:
- **CONTEXT 파일 내용을 그대로 복사하지 않는다.** 코드 분석 결과와 CONTEXT 내용을 종합하여 실제 클래스명·패키지명·파일명 기준으로 구체적으로 서술한다.
- CONTEXT 섹션이 비어 있으면 코드 분석 결과만으로 작성한다. 코드에서도 확인이 안 된 항목은 `{확인 필요}`로 표시한다.
- **참조/common 모듈이 있는 프로젝트의 경우, 구현 프로젝트 CLAUDE.md에는 해당 모듈이 이미 제공하는 내용(base class, 공통 유틸, 공통 아키텍처 등)을 반복 서술하지 않는다.** 패턴 A(mobile-server)는 `additionalDirectories` + `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` 설정으로 참조 프로젝트 CLAUDE.md가 자동 로드되고, 패턴 B(unidocu6·unidocu6-public-sap 등)는 루트 CLAUDE.md에서 core 모듈이 정리되므로, 각 구현 모듈 CLAUDE.md는 해당 모듈 고유의 도메인 로직·설정·규칙에만 집중한다.

```markdown
# {서비스명} — CLAUDE.md

## 1. 프로젝트 개요

- **서비스명**: {pom.xml 또는 package.json에서 추출}
- **설명**: {CONTEXT Section 1 목적 기반으로 한 문장 작성. 8번이면 {확인 필요}}
- **기술 스택**:
  - Backend: {분석 결과 / 없으면 항목 생략}
  - Frontend: {분석 결과 / 없으면 항목 생략}
  - Database: {분석 결과 / 없으면 '없음 — {대체 통신 방식}'}
- **주요 외부 연동**: {발견된 연동 / 없으면 항목 생략}
- **적용 rules**: {결정된 rules 목록}
{CONTEXT Section 1의 주요 기능·사용자·시스템 구성·DB 구성 등을 추가 항목으로 서술}
{CONTEXT Section 6(고객사/운영 특이사항)에 내용이 있으면 **비고** 항목으로 추가}

---

## 2. 프로젝트 구조

{실제 탐색한 디렉터리 트리 — 코드 블록}

{멀티 모듈인 경우 모듈 의존 관계 다이어그램}

---

## 3. 아키텍처 패턴

### 레이어 구조
{4-3 분석 결과를 기반으로, 4-4 도메인 분석에서 추출한 실제 Entity·Service·Controller 클래스명과
CONTEXT Section 2(도메인 지식)의 업무 용어를 활용하여 각 레이어의 역할을 구체적으로 서술한다}

### 베이스 클래스
{발견된 경우만 — 없으면 이 항목 생략}

### 트랜잭션 정책
{분석 결과}

### 예외 처리 방식
{분석 결과}

### 현재 표준 패턴
{4-3 코드 분석 결과 + CONTEXT Section 3(코드 히스토리)를 종합하여 현재 프로젝트에서
실제로 사용되는 구현 패턴을 항목으로 서술한다. CONTEXT만 있고 코드 확인이 안 된 항목은 생략한다}

---

## 4. Claude 작업 지침

### 필수 패턴
{4-5 코드 패턴 도출 규칙 + CONTEXT Section 4(개발 작업 방식)를 종합하여
실제 코드에서 확인된 패턴·규칙을 구체적인 클래스명·파일명과 함께 항목으로 작성한다}

### 금지 사항
{4-5 코드 패턴 도출 규칙 + CONTEXT Section 5(자주 하는 실수/주의사항)를 종합하여
실제 코드 구조에서 유추되는 금지 패턴을 구체적으로 항목으로 작성한다}

---

{CLAUDE-TEMPLATE.md의 ## Claude 동작 규칙 (공통) 섹션 전체 병합}
```

### 5단계: 하위 모듈 CLAUDE.md 생성

pom.xml에 `<modules>`가 있으면 각 모듈을 순서대로 탐색하여 모듈별 CLAUDE.md를 생성합니다.

#### 5-1. 모듈별 분석

1. 모듈 `pom.xml` → 모듈명·의존성
2. `src/main/java` → 패키지 구조·핵심 클래스·공개 API
3. `src/main/resources` → 설정 파일·Mapper XML 경로

#### 5-2. 모듈 CLAUDE.md 작성

```markdown
# {모듈명} — CLAUDE.md

> 공통 사항은 루트 CLAUDE.md 참고

## 모듈 역할
{분석 결과 — 한 문장}

## 폴더 구조
{실제 탐색한 주요 디렉터리}

## 공개 API
{다른 모듈에서 참조하는 클래스·인터페이스 / 없으면 생략}

## 모듈 전용 컨벤션
{모듈 특화 규칙 / 없으면 생략}
```

> 루트 CLAUDE.md 내용을 반복하지 않습니다.

### 6단계: 파일 저장

각 경로에 `CLAUDE.md`가 이미 존재하면 아래 메시지를 출력하고 확인을 요청합니다.

```
{경로}/CLAUDE.md 파일이 이미 존재합니다. 덮어쓸까요? (예/아니오/전체예)
```

- **전체예**: 이후 모든 파일을 확인 없이 덮어씁니다.

### 7단계: 완료 안내

참조 프로젝트 경로가 입력된 경우 (패턴 A — mobile-server) 아래 형식으로 출력합니다. 그렇지 않으면 settings.local.json 안내 블록은 생략합니다.

```
CLAUDE.md 초안이 생성되었습니다:
{생성된 파일 경로 목록 — 참조 프로젝트 파일 먼저 나열}

⚠️  이 파일은 초안입니다. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정하세요.

📌 참조 프로젝트 연동 설정
  참조 프로젝트 CLAUDE.md를 자동 로드하려면 구현 프로젝트의 .claude/settings.local.json 에 아래를 추가하세요.

  {구현 프로젝트 경로}/.claude/settings.local.json
  ───────────────────────────────────────────────
  {
    "env": {
      "CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD": "1"
    },
    "permissions": {
      "additionalDirectories": [
        "{참조 프로젝트 경로 — 절대 경로 또는 상대 경로}"
      ]
    }
  }
  ───────────────────────────────────────────────
  설정 후 Claude Code를 재시작하면 참조 프로젝트 CLAUDE.md 및 .claude/rules/*.md 가 자동 로드됩니다.
```
