'use client';

import { useState } from 'react';
import { POSidebar } from '@/components/POSidebar';
import { Card, Button, Input, Textarea, SectionHeader, Badge, Modal, AdminPage } from '@hyliren/ui';
import { useTreatmentsStore, type Treatment } from '@/store/treatments';
import { useToastStore } from '@/store/toast';
import { BODY_AREAS } from '@hyliren/shared';
import type { BodyArea } from '@hyliren/shared';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { ImageIcon } from 'lucide-react';

const EMPTY_FORM = {
  name: '', nameZh: '', category: '눈' as BodyArea,
  priceMin: 0, priceMax: 0, description: '', imageUrl: '', isActive: true,
};

export default function TreatmentsPage() {
  const { treatments, addTreatment, updateTreatment, deleteTreatment, toggleActive } = useTreatmentsStore();
  const { showToast } = useToastStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Treatment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function resetAdd() { setForm(EMPTY_FORM); setShowAddForm(false); }

  function handleAdd() {
    if (!form.name.trim()) { showToast('시술명을 입력하세요.', 'error'); return; }
    if (form.priceMin <= 0 || form.priceMax <= 0) { showToast('가격 범위를 입력하세요.', 'error'); return; }
    addTreatment(form);
    showToast(`'${form.name}' 시술이 추가되었습니다.`, 'success');
    resetAdd();
  }

  function startEdit(t: Treatment) {
    setEditTarget(t);
    setEditForm({ name: t.name, nameZh: t.nameZh, category: t.category, priceMin: t.priceMin, priceMax: t.priceMax, description: t.description, imageUrl: t.imageUrl || '', isActive: t.isActive });
  }

  function handleUpdate() {
    if (!editTarget) return;
    updateTreatment(editTarget.id, editForm);
    setEditTarget(null);
    showToast('시술 정보가 수정되었습니다.', 'success');
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteTreatment(deleteTarget.id);
    showToast(`'${deleteTarget.name}' 시술이 삭제되었습니다.`, 'info');
    setDeleteTarget(null);
  }

  return (
    <>
      <AdminPage
        sidebar={<POSidebar active="/treatments" />}
        title="시술 관리"
        actions={
          <Button variant="accent" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus size={13} /> 시술 추가
          </Button>
        }
        prefix="po"
      >
        <SectionHeader title={`총 ${treatments.length}개 시술`} />

        {treatments.length === 0 ? (
          <Card padding="md" className="mt-4">
            <div className="text-center py-12 text-[var(--color-text-dim)]">
              등록된 시술이 없습니다. 시술 추가 버튼을 눌러 시작하세요.
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {treatments.map(t => (
              <Card key={t.id} padding="none" hoverable>
                {/* 썸네일 */}
                <div className="h-32 bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden rounded-t-[var(--app-radius)]">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-[var(--color-text-dim)]" />
                  )}
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5 line-clamp-1">{t.name}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">{t.nameZh || '—'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleActive(t.id)}
                      className={`toggle-btn ${t.isActive ? 'toggle-btn--on' : 'toggle-btn--off'}`}
                    >
                      {t.isActive ? '활성' : '비활성'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="info">{t.category}</Badge>
                    <span className="text-[12px] font-semibold text-[var(--color-text)]">
                      {t.priceMin}~{t.priceMax}만
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-[var(--color-text-dim)] line-clamp-2 mb-2">{t.description}</p>
                  )}

                  <div className="flex gap-1 pt-2 border-t border-[var(--color-border-light)]">
                    <button type="button" className="icon-btn" onClick={() => startEdit(t)} title="수정">
                      <Pencil size={13} />
                    </button>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleteTarget({ id: t.id, name: t.name })} title="삭제">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AdminPage>

      {/* 추가 모달 */}
      <Modal open={showAddForm} onClose={resetAdd} title="새 시술 추가">
        <div className="flex flex-col gap-3">
          <div className="propose-form-row">
            <Input label="시술명 (한국어)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 쌍꺼풀 매몰법" />
            <Input label="시술명 (중국어)" value={form.nameZh} onChange={e => setForm(f => ({ ...f, nameZh: e.target.value }))} placeholder="例: 双眼皮埋线法" />
          </div>
          <div className="input-wrapper">
            <label className="input-label">분류</label>
            <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as BodyArea }))}>
              {BODY_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="propose-form-row">
            <Input label="최저 가격 (만원)" type="number" value={form.priceMin || ''} onChange={e => setForm(f => ({ ...f, priceMin: Number(e.target.value) }))} />
            <Input label="최고 가격 (만원)" type="number" value={form.priceMax || ''} onChange={e => setForm(f => ({ ...f, priceMax: Number(e.target.value) }))} />
          </div>
          <Input label="이미지 URL (선택)" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" />
          <Textarea label="설명 (선택)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="시술의 특징이나 추가 정보" />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="sm" onClick={resetAdd}>취소</Button>
          <Button variant="accent" size="sm" onClick={handleAdd}>추가</Button>
        </div>
      </Modal>

      {/* 수정 모달 */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="시술 수정">
        <div className="flex flex-col gap-3">
          <div className="propose-form-row">
            <Input label="시술명 (한국어)" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="시술명 (중국어)" value={editForm.nameZh} onChange={e => setEditForm(f => ({ ...f, nameZh: e.target.value }))} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">분류</label>
            <select className="input-field" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as BodyArea }))}>
              {BODY_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="propose-form-row">
            <Input label="최저 가격" type="number" value={editForm.priceMin || ''} onChange={e => setEditForm(f => ({ ...f, priceMin: Number(e.target.value) }))} />
            <Input label="최고 가격" type="number" value={editForm.priceMax || ''} onChange={e => setEditForm(f => ({ ...f, priceMax: Number(e.target.value) }))} />
          </div>
          <Input label="이미지 URL" value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" />
          <Textarea label="설명" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="sm" onClick={() => setEditTarget(null)}>취소</Button>
          <Button variant="accent" size="sm" onClick={handleUpdate}>저장</Button>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="시술 삭제">
        <p className="text-[13px] text-[var(--color-text)] mb-1">
          <strong>&apos;{deleteTarget?.name}&apos;</strong> 시술을 삭제하시겠습니까?
        </p>
        <p className="text-[12px] text-[var(--color-text-secondary)] mb-5">삭제된 시술은 복구할 수 없습니다.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" size="sm" onClick={confirmDelete}>삭제</Button>
        </div>
      </Modal>
    </>
  );
}
