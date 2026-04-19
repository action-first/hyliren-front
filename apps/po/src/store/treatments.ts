'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BodyArea } from '@hyliren/shared';

export interface Treatment {
  id: string;
  name: string;
  nameZh: string;
  category: BodyArea;
  priceMin: number; // 만원
  priceMax: number; // 만원
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

const INITIAL_TREATMENTS: Treatment[] = [
  {
    id: 't-001', name: '쌍꺼풀 매몰법', nameZh: '双眼皮埋线法',
    category: '눈', priceMin: 50, priceMax: 80,
    description: '실로 고정하는 비절개 쌍꺼풀 시술. 회복 빠름.',
    imageUrl: '', isActive: true, createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 't-002', name: '쌍꺼풀 절개법', nameZh: '双眼皮切开法',
    category: '눈', priceMin: 80, priceMax: 150,
    description: '절개를 통한 영구적 쌍꺼풀 형성. 라인 선명.',
    imageUrl: '', isActive: true, createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 't-003', name: '눈매교정', nameZh: '眼型矫正',
    category: '눈', priceMin: 100, priceMax: 180,
    description: '눈의 형태와 크기를 교정하는 복합 시술.',
    imageUrl: '', isActive: true, createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 't-004', name: '하안검 (눈밑지방 재배치)', nameZh: '下眼睑手术',
    category: '눈', priceMin: 150, priceMax: 250,
    description: '눈 아래 지방 제거 및 재배치. 다크서클 개선.',
    imageUrl: '', isActive: true, createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 't-005', name: '상안검 (눈꺼풀 처짐 교정)', nameZh: '上眼睑下垂矫正',
    category: '눈', priceMin: 80, priceMax: 150,
    description: '처진 눈꺼풀을 교정하는 시술. 피로한 인상 개선.',
    imageUrl: '', isActive: true, createdAt: '2026-01-10T09:00:00Z',
  },
];

interface TreatmentsState {
  treatments: Treatment[];
  addTreatment: (t: Omit<Treatment, 'id' | 'createdAt'>) => void;
  updateTreatment: (id: string, updates: Partial<Omit<Treatment, 'id' | 'createdAt'>>) => void;
  deleteTreatment: (id: string) => void;
  toggleActive: (id: string) => void;
}

let counter = 0;

export const useTreatmentsStore = create<TreatmentsState>()(
  persist(
    (set) => ({
      treatments: INITIAL_TREATMENTS,

      addTreatment: (t) => {
        counter++;
        set(s => ({
          treatments: [...s.treatments, {
            ...t,
            id: `t-user-${Date.now()}-${counter}`,
            createdAt: new Date().toISOString(),
          }],
        }));
      },

      updateTreatment: (id, updates) =>
        set(s => ({
          treatments: s.treatments.map(t => t.id === id ? { ...t, ...updates } : t),
        })),

      deleteTreatment: (id) =>
        set(s => ({ treatments: s.treatments.filter(t => t.id !== id) })),

      toggleActive: (id) =>
        set(s => ({
          treatments: s.treatments.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t),
        })),
    }),
    { name: 'po-treatments' },
  ),
);
