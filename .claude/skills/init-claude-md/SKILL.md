프로젝트 템플릿을 선택하여 CLAUDE.md 파일을 생성합니다.

## 실행 절차

### 1단계: 출력 경로 확인

인수(args)가 있으면 해당 경로를 출력 디렉터리로 사용합니다.
인수가 없으면 현재 작업 디렉터리(`pwd`)를 출력 디렉터리로 사용합니다.

### 2단계: 템플릿 목록 제시

아래 템플릿 목록을 사용자에게 보여주고 선택을 요청합니다.

| 번호 | 템플릿 | 대상 프로젝트 |
|------|--------|--------------|
| 1 | CLAUDE-TEMPLATE-uniflow.md | uniflow (전자결재) |
| 2 | CLAUDE-TEMPLATE-uniworks-pce.md | unidocu6 (UniWorks PCE) |
| 3 | CLAUDE-TEMPLATE-uniworks-pce-core.md | unidocu6-core (UniWorks PCE Core) |
| 4 | CLAUDE-TEMPLATE-uniworks-pce-mobile.md | unidocu6-mobile (UniWorks PCE Mobile 프론트) |
| 5 | CLAUDE-TEMPLATE-uniworks-pce-mobile-server.md | unidocu6-mobile-server (UniWorks PCE Mobile 백엔드) |
| 6 | CLAUDE-TEMPLATE-uniworks-public.md | unidocu6-public-sap (UniWorks Public) |
| 7 | CLAUDE-TEMPLATE-uniworks-public-core.md | unidocu6-public-sap-core (UniWorks Public Core) |

### 3단계: 템플릿 파일 읽기

사용자가 선택한 번호에 해당하는 파일을 읽습니다.
파일 경로: `{Base directory}/../../template/{파일명}`

> Base directory는 스킬 실행 시 상단에 표시됩니다. (예: `D:\claude-code-template\.claude\skills\init-claude-md`)
> 템플릿 경로 = Base directory에서 두 단계 상위의 `template/` 폴더

### 4단계: CLAUDE.md 내용 추출

템플릿 파일에서 **첫 번째 `---` 구분선 이후부터 끝까지**의 내용을 추출합니다.
(파일 상단의 "사용 안내" 섹션은 제외)

### 5단계: 출력 경로 확인 및 파일 생성

출력 경로에 이미 `CLAUDE.md`가 존재하는 경우, 덮어쓸지 사용자에게 확인합니다.

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
