# Priority Roadmap (Wave 별 진입 순서)

**목적**: 백엔드 개발 리소스를 어느 순서로 투입할지, 언제 mock 을 제거할지를 한 장으로 정리.

---

## 전체 구조

```
[현재 — 프로토타입]
  ├─ FO mock route handler 가 모든 엔드포인트 시뮬레이션
  ├─ yj.jung 은 /auth/* 클라이언트 계약만 확정
  └─ 시연 가능 상태

          │
          ▼ (Wave 1 — 1~2주)
[본개발 초기]
  ├─ auth·concern·proposal·analysis·event real 전환
  └─ 모든 사용자 핵심 플로우가 real backend 로 동작

          │
          ▼ (Wave 2 — 1~2개월)
[첫 실유저 온보딩]
  ├─ user 프로필 편집, 사진 업로드
  ├─ 결제 PG 연동
  └─ 수익화 개시

          │
          ▼ (Wave 3 — Series A 이후)
[성장 단계]
  ├─ 소셜 로그인·검색·CMS
  ├─ ML 추천
  └─ 규모 확장
```

---

## 🔴 Wave 1 — 본개발 진입 즉시 (필수)

**목표**: FO 가 mock 없이 real backend 로 완전 동작.

| 도메인 | 엔드포인트 | 의존성 | 예상 공수 |
|---|---|---|---|
| [auth](auth/README.md) | A1~A5 (register/login/refresh/logout/me) | DB schema, JWT/token store | 3일 |
| [concern-analysis](concern-analysis/README.md) | C1 (AI 분석) | LLM provider 선정 + 통합 | 5일 |
| [concern](concern/README.md) | D1~D5, D9 (목록·상세·CRUD·submit·select-hospital) | auth | 3일 |
| [proposal](proposal/README.md) | E1, E3 (목록·읽음 처리) | concern | 2일 |
| [event](event/README.md) | I1 (이벤트 로깅) | 공통 | 1일 |

**Wave 1 완료 기준**:
- [ ] `apps/fo/.env` 에서 `API_MODE=real` 전환
- [ ] FO 8개 페이지 E2E smoke 통과 (앞서 시연 테스트한 경로)
- [ ] `apps/fo/src/app/api/v1/**/route.ts` 전체 삭제
- [ ] `apps/fo/src/app/auth/**/route.ts` 전체 삭제
- [ ] `apps/fo/src/app/api/concern-analysis/route.ts` 삭제 (서버 이관 시)
- [ ] `apps/fo/src/app/api/events/route.ts` 삭제
- [ ] invited user testing 20명 — submit 전환율 85%+ 검증

**회귀 테스트 체크리스트**:
- 로그인 → 로그아웃 → 재로그인
- guest → /consult → submit 직전 auth 유도
- concern 생성 → dashboard 에 노출
- PO 가 제안 발송 → FO /decision 에 노출
- 재선택 시도 → 409
- 깨진 JSON → 400 (500 아님)

---

## 🟡 Wave 2 — 실사용자 온보딩 전 (필수)

**목표**: 사진 업로드 + 결제 + 프로필 편집 + 사용자 신고. 수익화 개시.

| 도메인 | 엔드포인트 | 의존성 | 예상 공수 |
|---|---|---|---|
| [concern](concern/README.md) | D7, D8 (사진 업로드·삭제), D6 (삭제) | S3·CDN | 2일 |
| [user](user/README.md) | B1~B5 (프로필·아바타·여권) | 사진 인프라 | 3일 |
| [member-profile](member-profile/README.md) | F1 (병원 프로필 상세) | — | 2일 |
| [order-payment](order-payment/README.md) | G1, G2, G3, G4, G5 (리포트 주문·결제·조회) | PG 계약 + 웹훅 | 7일 |
| [proposal](proposal/README.md) | E2, E4, E5 (상세·즐겨찾기·신고) | — | 2일 |
| [auth](auth/README.md) | phone OTP·password reset | SMS provider | 2일 |

**Wave 2 완료 기준**:
- [ ] 사진 업로드 → S3 + 서버 썸네일 생성
- [ ] 첫 리포트 실결제 성공 (토스페이먼츠)
- [ ] 환불 플로우 검증 (7일 조건부)
- [ ] 여권 인증 BO 승인 툴 동작
- [ ] `MOCK_PARTNER_PROFILES` import 전체 제거 (9곳)
- [ ] `apps/fo/src/app/api/payments/route.ts` 삭제
- [ ] Rate limit 모니터링 대시보드

**Legal 확인 필수**:
- 의료광고법 관련 리포트 내용 문구 검토
- 개인정보처리방침 업데이트
- 전자상거래법 의무 고지 (환불, 결제, 주문)

---

## 🔵 Wave 3 — Series A 이후 (성장)

**목표**: 검색·소셜로그인·CMS·ML 추천. 글로벌 확장 준비.

| 도메인 | 엔드포인트 | 의존성 | 예상 공수 |
|---|---|---|---|
| [auth](auth/README.md) | `/auth/wechat`, `/auth/google` | WeChat·Google API | 5일 |
| [search](search/README.md) | J1, J2 (검색·자동완성) | 검색 엔진 선정 | 5일 |
| [article](article/README.md) | H1, H2, H3 (CMS 연동) | CMS 구축 | 10일 |
| [member-profile](member-profile/README.md) | F2 (공개 디렉토리) | SEO 랜딩 | 3일 |
| [order-payment](order-payment/README.md) | G6, G7 (시술 예약·후기) | 병원 계약 플로우 | 7일 |
| [search](search/README.md) | J3 (ML 추천) | 데이터·모델링 | 10일 |

**Wave 3 완료 기준** (선택적, 사업 우선순위에 따라):
- 검색 DAU > 100
- 중국 사용자 WeChat 로그인 도입
- 시술 예약 첫 매출 발생
- 리뷰 UGC 축적

---

## mock 제거 전략 (단계적)

**원칙**: 한꺼번에 제거하지 않고 도메인별로 **파일 교체 → smoke → 삭제** 순서.

### 전환 스위치

```bash
# apps/fo/.env.local
API_MODE=mock                                    # 개발 초기
# ↓ Wave 1 진입 시
API_MODE=real
BACKEND_URL=https://api.hyliren.com
NEXT_PUBLIC_CUSTOMER_API_BASE_URL=https://api.hyliren.com
```

### 도메인별 전환 체크리스트 템플릿

```
[ ] Real backend deploy + smoke 1회 성공
[ ] FO `lib/api/{domain}/` 의 base URL 또는 path 만 변경 (code 는 그대로)
[ ] 페이지 smoke (FO 8개 + 해당 도메인 의존 페이지)
[ ] 회귀 테스트 (auth 필요 flow, IDOR, 404, 409)
[ ] `apps/fo/src/app/api/{domain}/**/*.ts` mock 파일 삭제
[ ] PR 머지
```

---

## 비용·리소스 추정 (CTO 개인 추정)

| Wave | 백엔드 엔지니어 | 인프라·서드파티 비용 (월) |
|---|---|---|
| Wave 1 | 1명 × 3주 | PG·SMS 없음. LLM: ~$200 (초기 사용량) |
| Wave 2 | 1명 × 6주 + Legal 1회 리뷰 | 토스페이먼츠 수수료 + S3/CDN: ~$100 + LLM: ~$500 |
| Wave 3 | 2명 × 6주 + ML 1명 × 4주 | Algolia/Meilisearch + WeChat: ~$300 + 기존 비용 |

**Series A 전까지 Wave 2 완료** 가 합리적 타임라인. Wave 3 는 자금 조달 후.

---

## 기술부채 모니터링

Wave 진행 중 다음을 추적:

| 부채 | 지표 | 행동 기준 |
|---|---|---|
| FO 컴포넌트 직접 fetch | grep `fetch('/api/` 건수 | Wave 1 종료 시 0건 |
| `MOCK_*` import | grep `MOCK_` 건수 | Wave 2 중반까지 0건 |
| `as any` 타입 캐스트 | grep `as any` | Wave 1 종료 시 5건 이하 |
| TODO/FIXME | grep | Wave 별 진입 시 트리아지 |

---

## 리스크·완화

### R1. 결제 PG 연동 지연 → Wave 2 블로커
**완화**: Wave 1 완료 전에 PG 계약·테스트 계정 먼저 확보. 결제 연동은 별도 스프린트로 분리 가능.

### R2. LLM 비용 폭증 → 현금흐름 악화
**완화**: 분당 rate limit + 일일 상한. 비용 알림 Threshold 설정.

### R3. 본개발 진입 후 legacy 코드 공존 → 보안 홀
**완화**: Wave 1 완료 시 **즉시** mock 파일 삭제 PR. "다음에 지우자" 금지.

### R4. 중국 사용자 CDN 지연
**완화**: Wave 3 까지 한국 CDN 만. 중국 Alibaba Cloud OSS·CDN 은 사업 지표가 그쪽으로 기울었을 때만 투입.

---

## 다음 단계

- [ ] 이 문서를 yj.jung 과 공유
- [ ] Wave 1 킥오프 미팅 — 각 엔드포인트 소유권·기한 확정
- [ ] JIRA/Linear 에 Wave 별 에픽 생성
- [ ] 주간 싱크 미팅 (Wave 1 기간 중)
