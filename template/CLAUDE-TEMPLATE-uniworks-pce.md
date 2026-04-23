# unidocu6 — CONTEXT

## 1. 서비스 개요
- **서비스명**: unidocu6 (UniWorks PCE)
- **목적**: 패키지로 설계된 경비처리(이어카운팅) 서비스 기능을 제공
- **주요 기능**: 법인카드, 세금계산서 내역조회, 전표작성, 증빙작성, 증빙조회, 결재처리
- **주요 사용자**: 웹브라우저로 접속하는 내부 사용자
- **통신**: SAP JCO(RFC) 공통 구현부를 통해 SAP 서버와 통신
- **참조 라이브러리**: `unidocu6-core` (.jar) — base class, SAP RFC 공통 구현, 공통 유틸 제공
- **분석 순서**: `unidocu6-core` → `unidocu6`
