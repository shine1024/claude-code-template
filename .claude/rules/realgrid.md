# RealGrid2 탐색 규칙

RealGrid2는 네이티브 엔진을 JS로 래핑한 구조입니다.
코드 탐색 중 `gridObj._rg.*` 형태의 호출이 보이면 내부 구현이 아닌 RealGrid2 공식 래퍼 API 기준으로 판단합니다.

## 탐색 기준

- `gridObj._rg.*` 호출 발견 시 → [RealGrid2 공식 문서](https://docs.realgrid.com/)에서 대응하는 공식 API를 먼저 확인한다
- 공식 래퍼 API가 있는 경우 그것을 사용한다 — 내부 `_rg.*` API를 직접 사용하지 않는다
- 공식 문서에 없는 경우에만 기존 코드의 `_rg.*` 패턴을 참조한다
