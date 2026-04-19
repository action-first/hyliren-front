'use client';

import { useState } from 'react';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Input, Textarea, SectionHeader, Badge, AdminPage } from '@hyliren/ui';
import { usePOAuthStore } from '@/store/po-auth';
import { useToastStore } from '@/store/toast';
import { BODY_AREAS } from '@hyliren/shared';
import type { BodyArea } from '@hyliren/shared';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { member, profile, updateProfile } = usePOAuthStore();
  const { showToast } = useToastStore();

  const [hospitalName, setHospitalName] = useState(profile?.hospitalName ?? '');
  const [hospitalNameZh, setHospitalNameZh] = useState(profile?.hospitalNameZh ?? '');
  const [description, setDescription] = useState(profile?.description ?? '');
  const [descriptionZh, setDescriptionZh] = useState(profile?.descriptionZh ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [specialties, setSpecialties] = useState<BodyArea[]>(profile?.specialties ?? []);
  const [isDirty, setIsDirty] = useState(false);

  function markDirty() { setIsDirty(true); }

  function toggleSpecialty(area: BodyArea) {
    setSpecialties(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
    markDirty();
  }

  function handleSave() {
    updateProfile({ hospitalName, hospitalNameZh, description, descriptionZh, address, phone, website, specialties });
    setIsDirty(false);
    showToast('파트너 정보가 저장되었습니다.', 'success');
  }

  const fields = [hospitalName, hospitalNameZh, description, descriptionZh, address, phone, website];
  const filledCount = fields.filter(f => f.trim()).length + (specialties.length > 0 ? 1 : 0);
  const completeness = Math.round((filledCount / 8) * 100);

  const statusBadge = profile?.verified ? (
    <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>
      <ShieldCheck size={15} /> 인증 완료
    </span>
  ) : (
    <span className="flex items-center gap-1" style={{ fontSize: 13, color: '#9ca3af' }}>
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
          <Button variant="accent" size="sm" onClick={handleSave} disabled={!isDirty}>저장</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
            <span style={{ fontSize: 18, fontWeight: 700, color: '#2C6ECB' }}>{completeness}%</span>
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
          <Button variant="accent" onClick={handleSave} disabled={!isDirty}>저장</Button>
        </div>
      </div>
    </AdminPage>
  );
}
