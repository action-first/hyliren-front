# HYLIREN Harness v2.1

> 코드 전에 여기 먼저. 4개 문서로 전체 프로젝트 파악.

| # | 문서 | 내용 |
|---|------|------|
| 01 | [Product](./01-product.md) | BM, 흐름, 엔티티 5개, 상태 규칙, 콘텐츠 엔진 |
| 02 | [Architecture](./02-architecture.md) | 가드레일 13개, 스택, 화면 22개, 빌드 순서 |
| 03 | [Design Tokens](./03-design-tokens.md) | FO/PO·BO 토큰, 타이포, 컴포넌트 |
| 04 | [Schema](./04-schema.md) | DB 스키마, 상태 전이, 인덱스, 이벤트 |

## 원칙
1. Core entity 5개만 — 늘리려면 강한 이유
2. 상태가 흐름을 결정 — UI에서 if/else 금지
3. 임시 구조 금지 — mock도 최종 구조대로
4. 코드 전 문서 → 변경 시 문서 먼저
