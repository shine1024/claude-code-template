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
