# unidocu6-public-sap — CONTEXT

## 1. 서비스 개요
- **서비스명**: unidocu6-public-sap (UniWorks Public)
- **목적**: unidocu6 솔루션 기반 경비처리 프로젝트 — SAP Public REST API 및 PostgreSQL 통신
- **DB 구성**: 기본 PostgreSQL / 시스템 properties 설정에 따라 MariaDB 전환 가능 (구축 고객사 환경에 따라 선택)
- **참조 라이브러리**: `unidocu6-public-sap-core` (.jar) — base class, SAP REST API 공통 구현, 공통 유틸 제공

## 2. 분석 순서
`unidocu6-public-sap-core` → `unidocu6-public-sap`
