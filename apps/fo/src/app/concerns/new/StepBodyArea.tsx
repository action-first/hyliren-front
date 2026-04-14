'use client';

import { BODY_AREAS } from '@hyliren/shared';
import type { BodyArea } from '@hyliren/shared';
import { Eye, CircleDot, Sparkles, Droplets, Dumbbell, MessageCircle } from 'lucide-react';
import type { ConcernFormData } from './page';

interface Props {
  form: ConcernFormData;
  update: (partial: Partial<ConcernFormData>) => void;
}

const AREA_ICONS: Record<BodyArea, typeof Eye> = {
  '눈': Eye, '코': CircleDot, '리프팅': Sparkles,
  '피부': Droplets, '다이어트': Dumbbell, '기타': MessageCircle,
};

export function StepBodyArea({ form, update }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">어떤 부위가 고민이세요?</h1>
      <p className="text-base text-[var(--color-text-secondary)] mt-2 leading-relaxed">가장 궁금한 부위를 선택해주세요</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {BODY_AREAS.map(area => {
          const Icon = AREA_ICONS[area];
          const selected = form.bodyArea === area;
          return (
            <button
              key={area}
              className={`flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 cursor-pointer transition-all min-h-[5.5rem] ${
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                  : 'border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-[var(--color-border)]'
              }`}
              onClick={() => update({ bodyArea: area, bodyAreaDetail: '' })}
            >
              <Icon size={28} strokeWidth={1.5} className={selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'} />
              <span className="text-base font-semibold text-[var(--color-text)]">{area}</span>
            </button>
          );
        })}
      </div>

      {form.bodyArea && (
        <div className="mt-4">
          <input
            type="text"
            className="w-full py-3 px-4 text-base text-[var(--color-text)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-dim)]"
            placeholder={`${form.bodyArea} 관련 상세 (예: 매몰쌍꺼풀, 코끝 성형)`}
            value={form.bodyAreaDetail}
            onChange={e => update({ bodyAreaDetail: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
