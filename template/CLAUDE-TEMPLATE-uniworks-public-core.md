# unidocu6-public-sap-core — CONTEXT

## 1. 서비스 개요
- **서비스명**: unidocu6-public-sap-core (UniWorks Public Core)
- **목적**: unidocu6-core의 public-sap 버전 — unidocu6-public-sap에 사용되는 공통 코어 모듈
- **모듈 구성**:
  - `server`: 백엔드 공통 — SAP REST API 연동 구현부, base class, 공통 유틸
  - `client`: 프론트 공통 — UI/UX 공통 모듈
  - `webjars`: JS 라이브러리를 webjars 형태로 관리

## 2. 분석 순서
`webjars` → `client` → `server`
