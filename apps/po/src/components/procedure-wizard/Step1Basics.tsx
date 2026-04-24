'use client';

import { useState } from 'react';
import { Input, Select } from '@hyliren/ui';
import { BODY_AREAS, PROCEDURE_TYPES } from '@hyliren/shared';
import type { BodyArea, ProcedureType, Locale } from '@hyliren/shared';
import { LocaleTabs } from './LocaleTabs';
import type { WizardForm } from '@/lib/wizard/types';

interface Step1Props {
  form: WizardForm;
  onChange: (patch: Partial<WizardForm>) => void;
}

const BODY_AREA_OPTIONS = BODY_AREAS.map(a => ({ value: a, label: a }));

// procedureType 을 한국어 라벨로 표시 (enum value → 라벨)
const PROCEDURE_TYPE_LABEL: Record<ProcedureType, string> = {
  eye_double_eyelid: '눈 · 쌍꺼풀',
  eye_ptosis_correction: '눈 · 눈매교정',
  eye_under_eye_fat: '눈 · 눈밑지방 재배치',
  eye_lower_blepharoplasty: '눈 · 하안검',
  eye_epicanthoplasty: '눈 · 앞·뒤트임',
  eye_canthoplasty: '눈 · 외안각',
  eye_revision: '눈 · 재수술',
  nose_augmentation: '코 · 융비 · 콧대',
  nose_tip: '코 · 코끝',
  nose_revision: '코 · 재수술',
  nose_hump: '코 · 매부리',
  nose_short_correction: '코 · 짧은 코',
  nose_nostril: '코 · 콧볼 축소',
  lift_thread: '리프팅 · 실리프팅',
  lift_ulthera: '리프팅 · 울쎄라',
  lift_hifu: '리프팅 · HIFU',
  lift_face_lift: '리프팅 · 안면거상',
  lift_fat_graft: '리프팅 · 지방이식',
  contour_facial: '안면윤곽 · 광대',
  contour_mandible: '안면윤곽 · 양악',
  contour_chin: '안면윤곽 · 턱끝',
  skin_laser: '피부 · 레이저',
  skin_injection: '피부 · 주사 (보톡스·필러)',
  skin_peeling: '피부 · 필링',
  skin_acne: '피부 · 여드름',
  skin_pigmentation: '피부 · 색소·잡티',
  skin_scar: '피부 · 흉터',
  diet_liposuction: '다이어트 · 지방흡입',
  diet_injection: '다이어트 · 지방분해주사',
  diet_body_contouring: '다이어트 · 바디 윤곽',
  other: '기타',
};

const PROCEDURE_TYPE_OPTIONS = PROCEDURE_TYPES.map(t => ({
  value: t, label: PROCEDURE_TYPE_LABEL[t],
}));

export function Step1Basics({ form, onChange }: Step1Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>(form.sourceLocale);

  const completed: Partial<Record<Locale, boolean>> = {};
  for (const [loc, block] of Object.entries(form.i18n)) {
    if (block?.title) completed[loc as Locale] = true;
  }

  const currentBlock = form.i18n[activeLocale] ?? {
    title: '', description: '', precautions: '', indications: [],
  };

  function updateTitle(title: string) {
    onChange({
      i18n: {
        ...form.i18n,
        [activeLocale]: { ...currentBlock, title },
      },
    });
  }

  // Smart default: procedureType 선택 시 title placeholder 에 해당 시술명 제안
  const procedureTypeSuggestion = form.procedureType
    ? PROCEDURE_TYPE_LABEL[form.procedureType as ProcedureType]?.replace(/^[^·]*·\s*/, '')
    : '';
  const titlePlaceholder = activeLocale === 'ko'
    ? (procedureTypeSuggestion ? `예: ${procedureTypeSuggestion} (자연스러운 라인)` : '예: 쌍꺼풀 수술')
    : activeLocale === 'zh-CN'
      ? '例: 双眼皮手术'
      : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="부위 *"
          value={form.primaryArea || ''}
          options={[{ value: '', label: '선택…' }, ...BODY_AREA_OPTIONS]}
          onChange={v => onChange({ primaryArea: v as BodyArea })}
        />
        <Select
          label="시술 유형 *"
          value={form.procedureType || ''}
          options={[{ value: '', label: '선택…' }, ...PROCEDURE_TYPE_OPTIONS]}
          onChange={v => onChange({ procedureType: v as ProcedureType })}
        />
      </div>

      <div>
        <Input
          label="대표 이미지 URL *"
          value={form.heroImageUrl}
          onChange={e => onChange({ heroImageUrl: e.target.value })}
          placeholder="https://…"
        />
        <p className="text-[11px] text-[var(--color-text-dim)] mt-1.5">
          ⚠️ 시술 전/후 비교 이미지는 의료법상 등록 금지. 시술 과정·의료진·시설 이미지로 구성해주세요.
        </p>
        {form.heroImageUrl && (
          <div className="mt-3 w-full h-40 rounded-md overflow-hidden bg-[var(--color-bg-tertiary)]">
            <img src={form.heroImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <LocaleTabs
          active={activeLocale}
          sourceLocale={form.sourceLocale}
          completed={completed}
          onChange={setActiveLocale}
        />
        <Input
          label={`시술명 * (${activeLocale === form.sourceLocale ? '원본' : '번역'})`}
          value={currentBlock.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder={titlePlaceholder}
        />
        {activeLocale !== form.sourceLocale && !currentBlock.title && (
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1.5">
            비워두면 {form.sourceLocale} 원본으로 자동 fallback 됩니다.
          </p>
        )}
      </div>

      <div>
        <Input
          label="URL Slug (선택)"
          value={form.slug}
          onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
          placeholder="비워두면 자동 생성됩니다"
        />
        <p className="text-[11px] text-[var(--color-text-dim)] mt-1.5">
          영문 소문자·숫자·하이픈만 사용. URL 에 노출됩니다: /procedures/<strong>{form.slug || '...'}</strong>
        </p>
      </div>
    </div>
  );
}
