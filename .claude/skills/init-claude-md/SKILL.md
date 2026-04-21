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
| 3 | unidocu6-core (UniWorks PCE Core) |
| 4 | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| 5 | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| 6 | unidocu6-public-sap (UniWorks Public) |
| 7 | unidocu6-public-sap-core (UniWorks Public Core) |
```

템플릿 파일명 매핑:
- 1 → CLAUDE-TEMPLATE-uniflow.md
- 2 → CLAUDE-TEMPLATE-uniworks-pce.md
- 3 → CLAUDE-TEMPLATE-uniworks-pce-core.md
- 4 → CLAUDE-TEMPLATE-uniworks-pce-mobile.md
- 5 → CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md
- 6 → CLAUDE-TEMPLATE-uniworks-public.md
- 7 → CLAUDE-TEMPLATE-uniworks-public-core.md

### 3단계: 템플릿 파일 읽기

두 파일을 읽습니다.

1. **공통 베이스**: `{Base directory}/../../template/CLAUDE-TEMPLATE.md`
2. **프로젝트 템플릿**: 사용자가 선택한 번호에 해당하는 파일 `{Base directory}/../../template/{파일명}`

> Base directory는 스킬 실행 시 상단에 표시됩니다. (예: `D:\claude-code-template\.claude\skills\init-claude-md`)
> 템플릿 경로 = Base directory에서 두 단계 상위의 `template/` 폴더

### 4단계: CLAUDE.md 내용 추출 및 병합

아래 두 부분을 추출하여 병합합니다.

- **프로젝트 내용**: 프로젝트 템플릿의 **첫 번째 `---` 구분선 이후부터 끝까지** 추출 (파일 상단 "사용 안내" 섹션 제외)
- **공통 규칙**: `CLAUDE-TEMPLATE.md`에서 `## Claude 동작 규칙 (공통)` 섹션부터 끝까지 추출

병합 순서:
```
[프로젝트 내용]

---

[공통 규칙 섹션]
```

### 5단계: 출력 경로 확인 및 파일 생성

출력 경로에 이미 `CLAUDE.md`가 존재하는 경우 아래 메시지를 출력하고 확인을 요청합니다.

```
{출력 경로}/CLAUDE.md 파일이 이미 존재합니다. 덮어쓸까요? (예/아니오)
```

확인되면 추출한 내용을 `{출력 디렉터리}/CLAUDE.md`로 저장합니다.

### 6단계: 완료 안내

생성된 파일 경로와 함께 아래 안내를 출력합니다:

```
CLAUDE.md가 생성되었습니다: {출력 경로}/CLAUDE.md

다음 단계:
1. 생성된 CLAUDE.md를 프로젝트 구조에 맞게 수정하세요.
2. 각 모듈 디렉터리에도 모듈별 CLAUDE.md를 생성하세요. (템플릿 파일 하단 예시 참고)
3. Claude가 틀린 결과를 낼 때마다 관련 내용을 추가·수정하세요.
```
