import Link from 'next/link';
import { Button, Badge, Card } from '@hyliren/ui';
import type { ConcernFormData } from './page';

interface Props {
  form: ConcernFormData;
}

export function StepComplete({ form }: Props) {
  return (
    <div className="flex flex-col items-center text-center pt-12 px-4 pb-8">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">고민이 등록되었습니다!</h1>
      <p className="text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed">
        검증된 병원들이 제안서를 준비하고 있어요.<br />
        보통 24시간 이내에 첫 제안서가 도착합니다.
      </p>

      <div className="w-full max-w-sm mt-6">
        <Card padding="md">
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-[var(--color-text)] min-w-12">부위</span>
              <Badge variant="info">{form.bodyArea}</Badge>
              {form.bodyAreaDetail && <span className="text-[var(--color-text-secondary)]">{form.bodyAreaDetail}</span>}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-[var(--color-text)] min-w-12">예산</span>
              <span>{form.budgetMin}만 ~ {form.budgetMax}만원</span>
            </div>
            {form.visitDateFrom && (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-[var(--color-text)] min-w-12">방문</span>
                <span>{form.visitDateFrom} ~ {form.visitDateTo}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-[var(--color-text)] min-w-12">사진</span>
              <span>{form.photos.length}장</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="w-full max-w-sm mt-6">
        <Link href="/"><Button variant="secondary" fullWidth>홈으로</Button></Link>
      </div>
    </div>
  );
}
