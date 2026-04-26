# Vercel 배포 가이드 (FO / PO / BO 분리 배포)

이 모노레포(`hyliren-front`)의 세 앱은 **Vercel에서 각각 독립 프로젝트**로 배포한다.
한 개의 Git 저장소 → 세 개의 Vercel 프로젝트 구성.

| 앱 | Workspace 패키지 | Vercel Root Directory | 권장 도메인 예시 |
|---|---|---|---|
| FO | `@hyliren/fo` | `apps/fo` | `m.hyliren.com` (모바일 퍼스트) |
| PO | `@hyliren/po` | `apps/po` | `partner.hyliren.com` |
| BO | `@hyliren/bo` | `apps/bo` | `admin.hyliren.com` |

---

## 1. 사전 준비

- Vercel 팀/계정에 GitHub 저장소 접근 권한 부여
- 운영 백엔드(`hyliren-api`)가 HTTPS로 접근 가능해야 함
  - FO → `https://api.hyliren.com/customer`
  - PO → `https://api.hyliren.com/partner`
  - BO → (현재 미사용)
- 백엔드 CORS 화이트리스트에 위 프론트 도메인 등록 필요 (별도 작업, hyliren-api)

---

## 2. Vercel 프로젝트 생성 (앱별 1회)

세 앱 모두 동일 절차 — **Root Directory만 다르다.**

### FO 예시

1. Vercel Dashboard → **Add New… → Project**
2. `hyliren-front` 저장소 선택 → **Import**
3. 설정 화면에서:
   - **Project Name**: `hyliren-fo`
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `apps/fo` ← **반드시 변경**
   - **Build & Output Settings**: `vercel.json` 의 값이 적용되므로 UI에서 비워둔다 (override 금지)
4. **Environment Variables** 섹션에 추가:
   - `NEXT_PUBLIC_CUSTOMER_API_BASE_URL` = `https://api.hyliren.com/customer` (Production)
   - 동일 키로 Preview/Development 별도 값 설정 가능 (예: 스테이징 백엔드)
5. **Deploy** 클릭

### PO

- Project Name: `hyliren-po`
- Root Directory: `apps/po`
- Env: `NEXT_PUBLIC_PARTNER_API_BASE_URL` = `https://api.hyliren.com/partner`

### BO

- Project Name: `hyliren-bo`
- Root Directory: `apps/bo`
- Env: 현재 없음 (mock 데이터 기반). admin API 연동 시 `NEXT_PUBLIC_ADMIN_API_BASE_URL` 추가.

---

## 3. 빌드 동작 (자동)

각 앱 디렉토리의 `vercel.json` 이 다음을 강제한다:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@hyliren/<app>...",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "ignoreCommand": "npx turbo-ignore @hyliren/<app>",
  "outputDirectory": ".next"
}
```

핵심:
- **`installCommand`**: 모노레포 루트에서 한 번만 install. workspace 패키지(`@hyliren/shared` 등) 포함.
- **`buildCommand`**: turbo 의 `--filter=@hyliren/<app>...` 로 해당 앱과 의존 패키지만 빌드. ag-grid 미사용 앱은 그쪽 패키지를 빌드하지 않음.
- **`ignoreCommand`**: `turbo-ignore` 가 워크스페이스 그래프를 분석해, 이번 커밋이 해당 앱(또는 의존 패키지)에 영향 없으면 빌드를 **스킵**한다. PO만 수정한 PR이 FO/BO 빌드를 트리거하지 않음 → 배포 비용/시간 절약.
- `outputFileTracingRoot` 가 `next.config.ts` 에 모노레포 루트로 설정되어 있어, Vercel 이 standalone 산출물 추적 시 workspace 파일을 정확히 포함한다.

---

## 4. 환경 변수 매트릭스

| 변수 | 노출 | FO | PO | BO |
|---|---|---|---|---|
| `NEXT_PUBLIC_CUSTOMER_API_BASE_URL` | 클라 | ✅ 필수 | — | — |
| `NEXT_PUBLIC_PARTNER_API_BASE_URL` | 클라 | — | ✅ 필수 | — |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | 클라 | — | — | (예약) |

- `NEXT_PUBLIC_` 접두 = 브라우저 번들에 그대로 임베드됨. **시크릿 절대 금지.**
- 서버 전용 시크릿이 생기면 접두 없이 추가하고, Server Component / Route Handler 에서만 참조한다.
- 같은 키를 Production / Preview / Development 별로 다른 값으로 설정 가능 (스테이징 분리).

---

## 5. 도메인 / 라우팅

- FO 는 모바일 전용 → `m.hyliren.com` 또는 `app.hyliren.com` 권장.
- PO 는 데스크톱 → `partner.hyliren.com`.
- BO 는 내부용 → `admin.hyliren.com`. 외부 노출 시 IP allowlist 또는 Vercel Password Protection 적용 권장.
- 단일 루트 도메인(`hyliren.com`) 에서 path 분기를 원할 경우 Routing Middleware 또는 Vercel Rewrites 가 필요하지만, **현재 권장하지 않음** — 세 앱이 각자 빌드되고 배포 단위가 다르므로 도메인 분리가 단순하다.

---

## 6. CI 동작 / 미리보기

- main 브랜치 푸시 → 세 프로젝트 모두 Production 배포 후보 평가 (`turbo-ignore` 가 영향 없는 앱은 스킵).
- 그 외 브랜치/PR → 각 앱별 Preview URL 생성. PR 코멘트에 자동 게시.
- 빌드 실패 시 해당 프로젝트만 실패 — 다른 앱 배포는 영향 없음.

---

## 7. 로컬 검증

운영 빌드와 동일한 명령으로 사전 확인:

```bash
# 루트에서
pnpm install --frozen-lockfile
pnpm turbo run build --filter=@hyliren/fo...
pnpm turbo run build --filter=@hyliren/po...
pnpm turbo run build --filter=@hyliren/bo...
```

빌드 산출물:
- `apps/<app>/.next` (Next.js 표준 출력)

---

## 8. 트러블슈팅

| 증상 | 원인 / 조치 |
|---|---|
| `Module not found: @hyliren/shared` | 앱의 `next.config.ts` 의 `transpilePackages` 누락 또는 `pnpm-workspace.yaml` 에 packages 미포함. 둘 다 점검. |
| Vercel 빌드 시 `pnpm: command not found` | Vercel 은 `packageManager` 필드(`pnpm@10.x`)를 보고 자동으로 pnpm 사용. 그래도 실패하면 Project Settings → General → Node Version 확인 후 재배포. |
| `turbo-ignore` 가 항상 빌드함 | Vercel 의 Git Integration 이 base commit 을 식별 못 하는 첫 배포는 항상 빌드. 두 번째 배포부터 정상 동작. |
| API 호출 시 CORS 오류 | 백엔드(`hyliren-api`) CORS allowlist 에 Vercel 도메인 추가. Preview URL 은 `*.vercel.app` 와일드카드 또는 정규식 매칭 필요. |
| `outputFileTracingRoot` 경고 | 모노레포 루트로 이미 설정됨. 변경 금지. |
| Preview 환경에서 잘못된 백엔드 호출 | Vercel 환경변수의 Preview 값이 Production 과 동일한지 확인. 필요시 스테이징 백엔드 URL 분리. |

---

## 9. 보안 체크리스트 (배포 전)

- [ ] `.env.local` 류 파일이 git 에 포함되지 않았는지 (`git ls-files | grep env`)
- [ ] `NEXT_PUBLIC_*` 변수에 시크릿 없음
- [ ] BO 도메인 접근 제한(인증/IP allowlist) 검토
- [ ] 백엔드 CORS allowlist 갱신
- [ ] AccessToken/RefreshToken 저장 위치 정책 확인 (현재 Phase 1: localStorage. `CLAUDE.md` §10.3 참조)
