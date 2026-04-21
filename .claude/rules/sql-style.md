# SQL 코드 스타일

## 네이밍
- 키워드: 대문자 (SELECT, FROM, WHERE, JOIN 등)
- 테이블·컬럼명: 대문자 SNAKE_CASE
- boolean 컬럼: `IS_` / `HAS_` 접두사
- 날짜 컬럼: `_AT` (TIMESTAMP) / `_DATE` (DATE 타입) 접미사

## 포맷
- 들여쓰기: 탭(Tab)
- 각 절(SELECT, FROM, WHERE, JOIN 등)은 새 줄에 작성

## 예시
```sql
    SELECT 
           COLUMN1
         , COLUMN2
         , COLUMN3
         , COLUMN4
         , COLUMN5
      FROM 테이블명1 AS T1
      LEFT OUTER JOIN 테이블명2 AS T2
        ON T1.COLUMN1 = T2.COLUMN2
     WHERE COLUMN1 = '값'
     ORDER BY COLUMN1 DESC
```

```sql
    INSERT INTO 테이블명1 (
              , COLUMN1
              , COLUMN2
              , COLUMN3
              , COLUMN4
    ) VALUES (
                '값1'
              , '값2'
              , '값3'
              , '값4'
    )   
```

```sql
    UPDATE 테이블명1
       SET COLUMN1 = '값1'
         , COLUMN2 = '값2'
         , COLUMN3 = '값3'
     WHERE COLUMN4 = '값4'
```

```sql
    DELETE 테이블명1
     WHERE COLUMN1 = '값1'
```

---

## PostgreSQL 전용 규칙

MyBatis XML Mapper에서 PostgreSQL을 사용하는 경우 아래 규칙을 추가로 적용한다.

- **테이블명·컬럼명은 큰따옴표(`"`)로 감싼다**
  - PostgreSQL은 큰따옴표 없이 쓰면 소문자로 처리되어 식별자 불일치가 발생함
  - 테이블: `"TB_USER_MASTER"`, 컬럼: `"PERNR"`, `"SNAME"` 등 UPPER_SNAKE_CASE
- 테이블 alias는 짧은 대문자 사용: `UM`, `UA`, `T`, `R` 등
- PostgreSQL 내장 함수도 대문자: `TO_CHAR()`, `CURRENT_DATE`, `CURRENT_TIME` 등
- `IFNULL` 대신 `COALESCE` 사용, `CAST(... AS ...)` 대신 `::타입` 캐스팅 사용

### PostgreSQL → MariaDB 변환 시 주요 차이점

| 구분 | PostgreSQL | MariaDB |
|------|-----------|---------|
| 식별자 감싸기 | `"TB_NAME"` | `` `TB_NAME` `` |
| 날짜 포맷 | `TO_CHAR(col, 'YYYY-MM-DD')` | `DATE_FORMAT(col, '%Y-%m-%d')` |
| 날짜 파싱 | `TO_DATE(col, 'YYYYMMDD')` | `STR_TO_DATE(col, '%Y%m%d')` |
| 현재 날짜/시간 | `CURRENT_DATE`, `CURRENT_TIME` | `CURDATE()`, `CURTIME()` |
| 문자열 합치기 | `a \|\| b` | `CONCAT(a, b)` |
| 타입 캐스팅 | `::VARCHAR` | `CAST(... AS CHAR)` |
| NULL 처리 | `COALESCE` | `IFNULL` |
