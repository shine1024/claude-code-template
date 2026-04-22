프로젝트 템플릿을 선택하여 CLAUDE.md 파일을 생성합니다.

## 실행 절차

### 1단계: 출력 경로 확인

인수(args)가 있으면 해당 경로를 출력 디렉터리로 사용합니다.
인수가 없으면 아래 메시지를 출력하고 경로 입력을 요청합니다. 경로를 받기 전까지 다음 단계로 진행하지 않습니다.

```
CLAUDE.md를 생성할 프로젝트 경로를 입력하세요:
예) C:\intellij-workspace\uniflow
```

### 2단계: 템플릿 목록 제시

아래 형식으로 출력하고 번호 입력을 요청합니다.

```
출력 경로: {출력 디렉터리}

템플릿을 선택하세요 (번호 입력):

| 번호 | 대상 프로젝트 |
|------|--------------|
| 1 | uniflow (전자결재) |
| 2 | unidocu6 (UniWorks PCE) |
| 3 | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| 4 | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| 5 | unidocu6-public-sap (UniWorks Public) |
```

템플릿 파일명 매핑:
- 1 → CLAUDE-TEMPLATE-uniflow.md
- 2 → CLAUDE-TEMPLATE-uniworks-pce.md
- 3 → CLAUDE-TEMPLATE-uniworks-pce-mobile.md
- 4 → CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md
- 5 → CLAUDE-TEMPLATE-uniworks-public.md

### 3단계: core 구성 선택

**템플릿 2(UniWorks PCE) 또는 5(UniWorks Public)를 선택한 경우에만** 아래 메시지를 출력하고 선택을 요청합니다.

```
core 구성을 선택하세요:

| 번호 | 설명 |
|------|------|
| 1 | 별도 프로젝트 — core가 독립된 프로젝트로 분리되어 있음 (경로 입력) |
| 2 | 현재 프로젝트에 통합 — core 코드가 이 프로젝트 안에 포함되어 있음 |
| 3 | 없음 — core 참조 없는 단일 프로젝트 (Enter) |
```

**1 선택 시**: 아래 메시지를 출력하고 경로를 입력받습니다.

```
core 프로젝트 경로를 입력하세요:
예) C:\intellij-workspace\unidocu6-core
```

**2 선택 시**: 경로 입력 없이 5단계(통합 분석)로 진행합니다.

**3 선택 또는 Enter 시**: core 관련 단계를 모두 건너뛰고 6단계로 이동합니다.

**템플릿 1·3·4는 이 단계를 건너뜁니다.**

### 4단계: 템플릿 파일 읽기

아래 파일들을 읽습니다.

1. **공통 베이스**: `$CLAUDE_CODE_TEMPLATE_PATH/template/CLAUDE-TEMPLATE.md`
2. **프로젝트 템플릿**: 사용자가 선택한 번호에 해당하는 파일 `$CLAUDE_CODE_TEMPLATE_PATH/template/{파일명}`
3. **core 템플릿** (3단계에서 1 또는 2를 선택한 경우):
   - 템플릿 2 선택 → `$CLAUDE_CODE_TEMPLATE_PATH/template/CLAUDE-TEMPLATE-uniworks-pce-core.md`
   - 템플릿 5 선택 → `$CLAUDE_CODE_TEMPLATE_PATH/template/CLAUDE-TEMPLATE-uniworks-public-core.md`

> `CLAUDE_CODE_TEMPLATE_PATH` 환경변수가 없으면 아래 메시지를 출력하고 중단합니다.
> ```
> ❌ CLAUDE_CODE_TEMPLATE_PATH 환경변수가 설정되어 있지 않습니다.
> .claude/settings.local.json 의 env 항목에 추가해주세요.
> ```

### 5단계: core 분석 및 처리

**3단계에서 3(없음)을 선택한 경우 이 단계를 건너뜁니다.**

#### [3단계 1 선택] 별도 core 프로젝트 분석 및 CLAUDE.md 생성

**5-1. 프로젝트 구조 분석**

다음을 순서대로 탐색합니다.

1. `{core-경로}/pom.xml` 읽기 → `<modules>` 태그에서 모듈 목록 추출
2. 각 모듈의 `src/main/java` 하위 디렉터리를 탐색하여 패키지 구조 파악
3. 핵심 클래스 파일 읽기:
   - `AbstractJAVAService` 위치 및 `call()` 시그니처
   - `NamedService` (PCE) 또는 `SapApiService` (Public) 위치 및 공개 메서드
   - Mapper 인터페이스 경로 (Public 전용)
   - 주요 인터셉터·예외 클래스

**5-2. core CLAUDE.md 내용 작성**

4단계에서 읽은 core 템플릿의 **첫 번째 `---` 구분선 이후부터 끝까지** 내용을 추출한 뒤, 분석 결과를 아래 항목에 반영하여 CLAUDE.md 내용을 작성합니다.

반영 항목:
- **모듈명**: pom.xml에서 추출한 실제 모듈명으로 교체
- **패키지 경로**: 실제 소스에서 확인한 패키지 구조로 교체
- **공개 API**: 실제 클래스 위치와 메서드 시그니처 기반으로 작성
- **Mapper XML 경로** (Public 전용): 실제 경로 구조 반영

> 분석으로 확인이 어려운 항목은 템플릿 내용을 그대로 사용합니다.

**5-3. core CLAUDE.md 파일 저장**

core 프로젝트 경로에 이미 `CLAUDE.md`가 존재하는 경우 아래 메시지를 출력하고 확인을 요청합니다.

```
{core-경로}/CLAUDE.md 파일이 이미 존재합니다. 덮어쓸까요? (예/아니오)
```

확인되면 작성한 내용을 `{core-경로}/CLAUDE.md`로 저장합니다.

---

#### [3단계 2 선택] 현재 프로젝트에 통합된 core 분석

**5-4. 현재 프로젝트 내 core 코드 탐색**

출력 경로(1단계)를 기준으로 다음을 탐색합니다.

1. `pom.xml` 읽기 → 모듈 구조 파악 (단일 WAR인지 멀티 모듈인지 확인)
2. `src/main/java` 하위에서 core 역할 패키지 탐색:
   - `AbstractJAVAService` 위치 및 `call()` 시그니처
   - `NamedService` (PCE) 또는 `SapApiService` (Public) 위치 및 공개 메서드
   - Mapper 인터페이스 경로 (Public 전용)
   - 주요 인터셉터·예외 클래스
3. Mapper XML 경로 (Public 전용): postgresql·mariadb 디렉터리 구조 확인

분석 결과는 6단계에서 메인 CLAUDE.md에 병합합니다.

### 6단계: 메인 CLAUDE.md 내용 추출 및 병합

아래 두 부분을 추출합니다.

- **프로젝트 내용**: 프로젝트 템플릿의 **첫 번째 `---` 구분선 이후부터 끝까지** 추출 (파일 상단 "사용 안내" 섹션 제외)
- **공통 규칙**: `CLAUDE-TEMPLATE.md`에서 `## Claude 동작 규칙 (공통)` 섹션부터 끝까지 추출

**[3단계 1 선택] 별도 core 프로젝트** — 최상단에 @import 추가:

```
@{core-경로}/CLAUDE.md

[프로젝트 내용]

---

[공통 규칙 섹션]
```

**[3단계 2 선택] 현재 프로젝트에 통합** — core 내용을 메인 CLAUDE.md에 직접 병합:

core 템플릿의 **첫 번째 `---` 구분선 이후** 내용을 5-4 분석 결과로 보완한 뒤, 프로젝트 내용에 추가합니다.

```
[프로젝트 내용]

---

[core 분석 반영 내용 — 프로젝트 구조·공개 API·작업 지침에 통합]

---

[공통 규칙 섹션]
```

**[3단계 3 선택] core 없음** — 기존 방식:

```
[프로젝트 내용]

---

[공통 규칙 섹션]
```

### 7단계: 출력 경로 확인 및 파일 생성

출력 경로에 이미 `CLAUDE.md`가 존재하는 경우 아래 메시지를 출력하고 확인을 요청합니다.

```
{출력 경로}/CLAUDE.md 파일이 이미 존재합니다. 덮어쓸까요? (예/아니오)
```

확인되면 추출한 내용을 `{출력 디렉터리}/CLAUDE.md`로 저장합니다.

### 8단계: 완료 안내

**[3단계 1 선택] 별도 core 프로젝트:**

```
CLAUDE.md 초안이 생성되었습니다:
- core 프로젝트: {core-경로}/CLAUDE.md
- 메인 프로젝트: {출력 경로}/CLAUDE.md

⚠️  이 파일은 초안입니다. 프로젝트 실제 구조와 다른 내용이 있을 수 있습니다.
프로젝트 인원과 함께 사용하면서 Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정하세요.
```

**[3단계 2 선택] 현재 프로젝트에 통합 / [3단계 3 선택] core 없음:**

```
CLAUDE.md 초안이 생성되었습니다: {출력 경로}/CLAUDE.md

⚠️  이 파일은 초안입니다. 프로젝트 실제 구조와 다른 내용이 있을 수 있습니다.
프로젝트 인원과 함께 사용하면서 Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정하세요.
```
