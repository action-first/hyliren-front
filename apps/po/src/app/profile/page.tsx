'use client';

import { useEffect, useState } from 'react';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Input, Textarea, SectionHeader, Badge, AdminPage, Spinner } from '@hyliren/ui';
import { useToastStore } from '@/store/toast';
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
      setHospitalName(profile.hospitalName ?? '');
      setHospitalNameZh(profile.hospitalNameZh ?? '');
      setDescription(profile.description ?? '');
      setDescriptionZh(profile.descriptionZh ?? '');
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
    updateMutation.mutate(
      {
        hospitalName,
        hospitalNameZh: hospitalNameZh || undefined,
        description: description || undefined,
        descriptionZh: descriptionZh || undefined,
        address: address || undefined,
        phone: phone || undefined,
        website: website || undefined,
        specialties,
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          showToast('파트너 정보가 저장되었습니다.', 'success');
        },
        onError: (e) => {
          showToast(toUserMessage(e, '저장에 실패했습니다'), 'error');
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
      <AdminPage sidebar={<POSidebar active="/profile" />} title="파트너 정보" prefix="po">
        <Card padding="md">
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        </Card>
      </AdminPage>
    );
  }

  if (!hydrated && profileQ.isError) {
    return (
      <AdminPage sidebar={<POSidebar active="/profile" />} title="파트너 정보" prefix="po">
        <Card padding="md">
          <div className="text-center py-10">
            <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-[var(--text-sm)] font-medium text-[var(--text-default)] mb-1">
              프로필을 불러오지 못했어요
            </p>
            <p className="text-[var(--text-xs)] text-[var(--text-disabled)] mb-4">
              {toUserMessage(profileQ.error, '알 수 없는 오류')}
            </p>
            <Button variant="secondary" size="sm" onClick={() => profileQ.refetch()}>
              다시 시도
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
      title="파트너 정보"
      prefix="po"
      actions={
        <div className="flex items-center gap-3">
          {statusBadge}
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: "var(--spacing-4)" }}>

        {/* 프로필 완성도 */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader
              title="프로필 완성도"
              subtitle={completeness === 100
                ? '프로필이 완성되었습니다'
                : completeness >= 50
                  ? '거의 완성! 나머지 항목을 채워주세요'
                  : '프로필을 채워주세요. 완성도가 높을수록 고객 노출이 증가합니다'}
            />
            <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: 'var(--color-primary)' }}>{completeness}%</span>
          </div>
          <div className="completeness-bar">
            <div className="completeness-fill" style={{ width: `${completeness}%` }} />
          </div>
        </Card>

        {/* 병원 기본 정보 */}
        <Card padding="md">
          <SectionHeader title="병원 기본 정보" subtitle="고객에게 노출되는 병원 이름을 입력하세요" />
          <div className="propose-form-row mt-4">
            <Input label="병원명 (한국어)" value={hospitalName} onChange={e => { setHospitalName(e.target.value); markDirty(); }} placeholder="예: 강남아이 성형외과" />
            <Input label="병원명 (중국어)" value={hospitalNameZh} onChange={e => { setHospitalNameZh(e.target.value); markDirty(); }} placeholder="예: 江南之眼整形外科" />
          </div>
          <div className="propose-form-row mt-3">
            <Input label="대표 전화" value={phone} onChange={e => { setPhone(e.target.value); markDirty(); }} placeholder="02-1234-5678" />
            <Input label="웹사이트" value={website} onChange={e => { setWebsite(e.target.value); markDirty(); }} placeholder="https://example.kr" />
          </div>
          <div className="mt-3">
            <Input label="주소" value={address} onChange={e => { setAddress(e.target.value); markDirty(); }} placeholder="서울 강남구 역삼동 123" />
          </div>
        </Card>

        {/* 전문 분야 */}
        <Card padding="md">
          <SectionHeader title="전문 분야" subtitle="병원이 집중하는 시술 분야를 선택하세요" />
          <div className="flex gap-2 mt-4 flex-wrap">
            {(BODY_AREAS as readonly BodyArea[]).map(area => (
              <button key={area} type="button" onClick={() => toggleSpecialty(area)}
                className={`specialty-tag ${specialties.includes(area) ? 'specialty-tag--active' : ''}`}
              >{area}</button>
            ))}
          </div>
          {specialties.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {specialties.map(s => <Badge key={s} variant="info">{s}</Badge>)}
            </div>
          )}
        </Card>

        {/* 병원 소개 */}
        <Card padding="md">
          <SectionHeader title="병원 소개" subtitle="고객이 보는 병원 설명 (한국어 + 중국어)" />
          <div className="mt-4">
            <Textarea label="소개 (한국어)" value={description} onChange={e => { setDescription(e.target.value); markDirty(); }}
              placeholder="병원의 강점과 전문성을 소개하세요" rows={3} />
          </div>
          <div className="mt-3">
            <Textarea label="소개 (중국어)" value={descriptionZh} onChange={e => { setDescriptionZh(e.target.value); markDirty(); }}
              placeholder="用中文介绍医院的优势和专业性" rows={3} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </AdminPage>
  );
}
