# uniflow — CONTEXT

## 1. 서비스 개요
- **서비스명**: uniflow
- **목적**: 패키지로 설계된 전자결재 서비스 기능을 제공
- **주요 기능**: 결재문서 작성, 조회, 결재처리
- **주요 사용자**: 웹브라우저 또는 모바일(웹)으로 접속하는 내부 사용자
- **시스템 구성**: 웹과 모바일은 별도 시스템으로 분리 / MariaDB 통신
- **모듈 구성**:
  - `uniflow-web`: 웹 구현 모듈 — `uniflow-server-common`, `uniflow-client-common` (.jar) 참조
  - `uniflow-mobile`: 모바일 구현 모듈 — `uniflow-server-common`, `uniflow-client-common` (.jar) 참조
  - `uniflow-server-common`: 백엔드 공통 라이브러리 (base class, 공통 유틸)
  - `uniflow-client-common`: 프론트엔드 공통 라이브러리 (공통 UI/UX 모듈)
- **분석 순서**: common 모듈 먼저 분석 후 web·mobile 모듈 분석. 구현 모듈 CLAUDE.md에는 common이 제공하는 내용을 반복 서술하지 않음

## 2. 도메인 지식

## 3. 코드 히스토리

## 4. 개발 작업 방식

## 5. 자주 하는 실수 / 주의사항

## 6. 고객사 / 운영 특이사항
