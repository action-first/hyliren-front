## 개요
<!-- 이 PR이 무엇을 하는지 한두 줄로. "왜"에 집중 -->

## 작업 범위
- [ ] 대상 앱: `fo` / `po` / `bo`
- [ ] 연결 대상 API: `customer` / `partner` / `admin` / 해당 없음
- [ ] 관련 기능 모듈: <!-- 예: 인증 / 고민 등록 / 제안서 리스트 -->
- [ ] 관련 이슈: #

## 변경 사항
<!-- 수정한 파일을 경로 + 한 줄 요약으로 -->
- `path/to/file.ts` —
- `path/to/file.tsx` —

## Diff Matrix (FO ↔ API 계약이 바뀐 경우)
<!-- CLAUDE.md §3 Step 3 기준. 해당 없음이면 "N/A" -->

| 항목 | FO 기대 | API 현재 | 조치 |
|---|---|---|---|
|  |  |  |  |

## 요청/응답 샘플
<!-- API 연결 PR이면 정상/에러 각 1개 필수 -->
```json
// Request

```
```json
// Response (success)

```
```json
// Response (error)

```

## 검증 방법
<!-- 리뷰어가 로컬에서 재현할 수 있도록 -->
```bash
# 예시
pnpm --filter fo dev
# 또는
pnpm -C ../hyliren-api start:dev:customer
```

확인 시나리오:
- [ ]
- [ ]

## 스크린샷 / 동영상
<!-- UI 변경이 있으면 모바일(375px) 기준 캡처 첨부 -->

## 미구현 / 보류
<!-- 외부 의존, 범위 외, 사용자 확인 필요 항목. 없으면 "없음" -->
-

## 체크리스트
- [ ] `CLAUDE.md` §2 체크리스트의 관련 문서를 읽었다
- [ ] FO 타입은 `@hyliren/shared` 재사용 (임의 재정의 없음)
- [ ] 상태 전이는 `packages/shared/src/domain/transitions.ts` 경유
- [ ] 하드코딩 문자열 없음 (`@hyliren/i18n` 키 사용)
- [ ] 인라인 스타일 없음 (`@hyliren/ui` 토큰 사용)
- [ ] 모바일 375px 기준으로 레이아웃 확인 (FO)
- [ ] `console.log`, 디버깅용 코드 제거
- [ ] `.env`/시크릿 커밋 없음
- [ ] 린트/타입체크 통과
- [ ] `IMPLEMENTATION_LIMITATIONS.md` 영향 여부 확인 (필요 시 업데이트 별도 PR)

## 금지 사항 자가 확인 (CLAUDE.md §11)
- [ ] 양쪽 레포를 한 커밋에 섞지 않았다
- [ ] 매핑 미정의 필드를 임의 이름으로 내리지 않았다
- [ ] FO 타입을 API 현재 모양에 억지로 맞추지 않았다
- [ ] 외부 의존 부분에 더미 값을 하드코딩하지 않았다
