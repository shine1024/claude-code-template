# JavaScript 코드 스타일

## 네이밍
- 변수·함수: camelCase
- 클래스: PascalCase
- 상수: UPPER_SNAKE_CASE
- boolean 변수·함수: `is` / `has` / `can` 접두사

## 포맷
- 들여쓰기: 탭(Tab)
- 최대 줄 길이: 150자
- 세미콜론: 항상 명시
- 문자열: 작은따옴표 우선

## 주석
- 기본적으로 주석 작성 안 함
- 사용자가 명시적으로 요청한 경우에만 작성
- JSDoc도 사용자 요청 시에만 작성

## 코드 작성
- 함수는 가능하면 50줄 이내, 한 가지 일만 한다
- 파일이 800줄을 넘기 전에 분리 검토
- 중첩 4단계를 넘기 전에 추출 (early return, 헬퍼 분리)
- 매직 넘버는 명명된 상수로 추출
- 외부 입력(API 응답, 사용자 입력, 파일)은 경계에서 검증 — 상세는 `security.md`

## 함수 시그니처·호출 개행
- 매개변수는 최대 4개. 그 이상 필요하면 옵션 객체(`{ ... }`)로 묶는다
- 다음 경우에만 함수 호출·선언을 개행한다
  - 파라미터 4개 이상 → 한 줄에 하나씩 정렬
  - fluent/Promise chain → 각 `.method()` 를 새 줄에
  - 설정 객체·DTO·생성자 등 본질적으로 다수 필드를 받는 선언 → 한 줄에 하나씩 정렬
- 개행 시 콤마는 줄 앞(leading)에 붙이고, 닫는 `)`·`}` 는 새 줄에 둔다 (SQL 스타일과 일관)
- 단순 호출·선언은 150자를 넘어도 한 줄로 유지하고, 너무 길면 인자(긴 리터럴·복합 표현식)를 상수·변수로 추출

```js
// 피함 — 단순 호출인데 URL 길이 때문에 개행
const res = await fetch('https://api.example.com/v1/users/orders/details/very/long/path',
    { method: 'POST', body: payload });

// 권장 — 긴 URL 은 변수로 추출, 호출은 한 줄
const orderDetailUrl = 'https://api.example.com/v1/users/orders/details/very/long/path';
const res = await fetch(orderDetailUrl, { method: 'POST', body: payload });
```

## 예외 처리
- `catch` 블록을 비워두지 않는다
- 비동기 흐름에서 reject·throw 가 누락되지 않게 한다 (특히 `async` 안에서 `await` 누락)
- 사용자에게 보여줄 메시지와 로그 메시지는 분리한다

## 기타
- 최신 문법 사용
- 단, 기존 파일을 수정하는 경우 호환·일관성을 고려하여 ES5 문법 사용
