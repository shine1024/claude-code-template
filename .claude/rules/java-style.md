# Java 코드 스타일

## 네이밍
- 클래스: PascalCase
- 메서드·변수: camelCase
- 상수: UPPER_SNAKE_CASE
- boolean 메서드: `is` / `has` / `can` 접두사

## 포맷
- 들여쓰기: 탭(Tab)
- 최대 줄 길이: 150자
- 인코딩: UTF-8

## 주석
- 기본적으로 주석 작성 안 함
- 사용자가 명시적으로 요청한 경우에만 작성
- Javadoc도 사용자 요청 시에만 작성

## 코드 작성
- 함수는 가능하면 50줄 이내, 한 가지 일만 한다
- 파일이 800줄을 넘기 전에 분리 검토
- 중첩 4단계를 넘기 전에 추출 (early return, 메서드 분리)
- 매직 넘버는 명명된 상수로 추출
- 외부 입력(파라미터, 요청, 파일)은 경계에서 검증 — 상세는 `security.md`

## 메서드 시그니처·호출 개행
- 매개변수는 최대 4개. 그 이상 필요하면 파라미터 객체·Builder 로 묶는다
- 다음 경우에만 메서드 호출·선언을 개행한다
  - 파라미터 4개 이상 → 한 줄에 하나씩 정렬
  - Builder·fluent chain → 각 `.method()` 를 새 줄에
  - 설정·DTO·생성자 등 본질적으로 다수 필드를 받는 선언 → 한 줄에 하나씩 정렬
- 개행 시 콤마는 줄 앞(leading)에 붙이고, 닫는 `)` 는 새 줄에 둔다 (SQL 스타일과 일관)
- 단순 호출·선언은 150자를 넘어도 한 줄로 유지하고, 너무 길면 인자(긴 리터럴·복합 표현식)를 상수·변수로 추출

```java
// 단순 호출 — 리터럴 길이 때문에 개행 X. 변수로 추출하고 호출은 한 줄
String redirectXPath = "//md:SingleSignOnService[@Binding='...HTTP-Redirect']/@Location";
String url = (String) xpath.evaluate(redirectXPath, doc, XPathConstants.STRING);
```

```java
// 4개 이상 파라미터 — leading comma, 닫는 ) 는 새 줄
public void excelDownload(
          HttpServletRequest request
        , HttpServletResponse response
        , @RequestParam("fileName") String fileName
        , @RequestParam(required = false) Integer blankRow
) {
    // ...
}
```

## 예외 처리
- 잡은 예외를 무시하지 않는다 (빈 catch 금지)
- 메시지는 어떤 작업이 어떤 입력으로 실패했는지 알 수 있게 작성
- 일반 `Exception`을 잡아 `RuntimeException`으로 감싸는 패턴 지양 → 의미 있는 도메인 예외 사용

## 기타
- `System.out.println` 사용 금지 → Logger 사용
