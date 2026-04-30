'use client';

import { useEffect, useState } from 'react';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Input, Textarea, SectionHeader, Badge, AdminPage, Spinner } from '@hyliren/ui';
import { useToastStore } from '@/store/toast';
import { useLocaleStore } from '@/store/locale';
import { toUserMessage } from '@/lib/api/error-messages';
import { useMyPartnerProfile } from '@/hooks/queries/partner-profile';
import { useUpdateMyPartnerProfile } from '@/hooks/mutations/partner-profile';
import { BODY_AREAS } from '@hyliren/shared';
import type { BodyArea } from '@hyliren/shared';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

/**
 * 파트너 프로필.
 *
 * 흐름:
 * 1. useMyPartnerProfile() — 첫 진입 시 BE 조회 (미존재 회원도 빈 기본값 응답)
 * 2. data 도달 시 form state 1회 hydrate (이후 refetch 가 폼 덮지 않게 hydrated 가드)
 * 3. 저장 → useUpdateMyPartnerProfile() mutation — 성공 시 cache 직접 set
 */
export default function ProfilePage() {
  const { showToast } = useToastStore();
  const t = useLocaleStore(s => s.t);
  const profileQ = useMyPartnerProfile();
  const updateMutation = useUpdateMyPartnerProfile();
  const profile = profileQ.data;

  // form state — query 도달 후 1회 hydrate.
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalNameZh, setHospitalNameZh] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [specialties, setSpecialties] = useState<BodyArea[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 첫 데이터 도달 시 1회 form 채움. 이후엔 사용자 입력 보호 (refetch 도 무시).
  useEffect(() => {
    if (profile && !hydrated) {
      setHospitalName(profile.i18n?.ko?.hospitalName ?? '');
      setHospitalNameZh(profile.i18n?.['zh-CN']?.hospitalName ?? '');
      setDescription(profile.i18n?.ko?.description ?? '');
      setDescriptionZh(profile.i18n?.['zh-CN']?.description ?? '');
      setAddress(profile.address ?? '');
      setPhone(profile.phone ?? '');
      setWebsite(profile.website ?? '');
      setSpecialties((profile.specialties ?? []) as BodyArea[]);
      setHydrated(true);
    }
  }, [profile, hydrated]);

  const saving = updateMutation.isPending;

  function markDirty() { setIsDirty(true); }

  function toggleSpecialty(area: BodyArea) {
    setSpecialties(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
    markDirty();
  }

  function handleSave() {
    // i18n 은 입력된 locale 만 전달 — BE 가 locale 별 UPSERT (전달 안 된 locale 은 유지).
    const i18n: Record<string, { hospitalName: string; description?: string | null }> = {};
    if (hospitalName.trim()) {
      i18n.ko = {
        hospitalName,
        description: description.trim() ? description : null,
      };
    }
    if (hospitalNameZh.trim()) {
      i18n['zh-CN'] = {
        hospitalName: hospitalNameZh,
        description: descriptionZh.trim() ? descriptionZh : null,
      };
    }

    updateMutation.mutate(
      {
        i18n: Object.keys(i18n).length > 0 ? i18n : undefined,
        sourceLocale: 'ko',
        address: address || undefined,
        phone: phone || undefined,
        website: website || undefined,
        specialties,
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          showToast(t('po.profileSaveSuccess'), 'success');
        },
        onError: (e) => {
          showToast(toUserMessage(e, t('po.profileSaveFail')), 'error');
        },
      },
    );
  }

  const fields = [hospitalName, hospitalNameZh, description, descriptionZh, address, phone, website];
  const filledCount = fields.filter(f => f.trim()).length + (specialties.length > 0 ? 1 : 0);
  const completeness = Math.round((filledCount / 8) * 100);

  // 첫 진입 — query 도달 전엔 빈 폼이 보이므로 spinner 카드 노출.
  // hydrate 전 입력 race (저장 시 빈 값 덮어쓰기) 도 함께 차단.
  if (!hydrated && profileQ.isLoading) {
    return (
      <AdminPage sidebar={<POSidebar active="/profile" />} title={t('po.navProfile')} prefix="po">
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      </AdminPage>
    );
  }

  if (!hydrated && profileQ.isError) {
    return (
      <AdminPage sidebar={<POSidebar active="/profile" />} title={t('po.navProfile')} prefix="po">
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              {t('po.profileLoadFail')}
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(profileQ.error, t('po.unknownError'))}
            </p>
            <Button variant="secondary" size="sm" onClick={() => profileQ.refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </AdminPage>
    );
  }

  const statusBadge = profile?.verified ? (
    <span className="flex items-center gap-1" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: 'var(--color-success)' }}>
      <ShieldCheck size={15} /> 인증 완료
    </span>
  ) : (
    <span className="flex items-center gap-1" style={{ fontSize: "var(--text-sm)", color: 'var(--text-disabled)' }}>
      <ShieldAlert size={15} /> 미인증
    </span>
  );

  return (
    <AdminPage
      sidebar={<POSidebar active="/profile" />}
      title={t('po.navProfile')}
      prefix="po"
      actions={
        <div className="flex items-center gap-3">
          {statusBadge}
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? t('po.profileSaving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: "var(--spacing-4)" }}>

        {/* 프로필 완성도 */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader
              title={t('po.profileCompleteness')}
              subtitle={completeness === 100
                ? t('po.profileComplete100')
                : completeness >= 50
                  ? t('po.profileAlmostDone')
                  : t('po.profileFillIn')}
            />
            <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: 'var(--color-primary)' }}>{completeness}%</span>
          </div>
          <div className="completeness-bar">
            <div className="completeness-fill" style={{ width: `${completeness}%` }} />
          </div>
        </Card>

        {/* 병원 기본 정보 */}
        <Card padding="md">
          <SectionHeader title={t('po.profileBasicInfo')} subtitle={t('po.profileBasicInfoSub')} />
          <div className="propose-form-row mt-4">
            <Input label={t('po.profileHospitalNameKo')} value={hospitalName} onChange={e => { setHospitalName(e.target.value); markDirty(); }} placeholder={t('po.profileHospitalNameKoPh')} />
            <Input label={t('po.profileHospitalNameZh')} value={hospitalNameZh} onChange={e => { setHospitalNameZh(e.target.value); markDirty(); }} placeholder={t('po.profileHospitalNameZhPh')} />
          </div>
          <div className="propose-form-row mt-3">
            <Input label={t('po.profilePhone')} value={phone} onChange={e => { setPhone(e.target.value); markDirty(); }} placeholder="02-1234-5678" />
            <Input label={t('po.profileWebsite')} value={website} onChange={e => { setWebsite(e.target.value); markDirty(); }} placeholder="https://example.kr" />
          </div>
          <div className="mt-3">
            <Input label={t('po.profileAddress')} value={address} onChange={e => { setAddress(e.target.value); markDirty(); }} placeholder={t('po.profileAddressPh')} />
          </div>
        </Card>

        {/* 전문 분야 */}
        <Card padding="md">
          <SectionHeader title={t('po.profileSpecialties')} subtitle={t('po.profileSpecialtiesSub')} />
          <div className="flex gap-2 mt-4 flex-wrap">
            {(BODY_AREAS as readonly BodyArea[]).map(area => (
              <button key={area} type="button" onClick={() => toggleSpecialty(area)}
                className={`specialty-tag ${specialties.includes(area) ? 'specialty-tag--active' : ''}`}
              >{t(`common.bodyArea.${area}`)}</button>
            ))}
          </div>
          {specialties.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {specialties.map(s => <Badge key={s} variant="info">{t(`common.bodyArea.${s}`)}</Badge>)}
            </div>
          )}
        </Card>

        {/* 병원 소개 */}
        <Card padding="md">
          <SectionHeader title={t('po.profileIntro')} subtitle={t('po.profileIntroSub')} />
          <div className="mt-4">
            <Textarea label={t('po.profileDescKo')} value={description} onChange={e => { setDescription(e.target.value); markDirty(); }}
              placeholder={t('po.profileDescKoPh')} rows={3} />
          </div>
          <div className="mt-3">
            <Textarea label={t('po.profileDescZh')} value={descriptionZh} onChange={e => { setDescriptionZh(e.target.value); markDirty(); }}
              placeholder={t('po.profileDescZhPh')} rows={3} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? t('po.profileSaving') : t('common.save')}
          </Button>
        </div>
      </div>
    </AdminPage>
  );
}
