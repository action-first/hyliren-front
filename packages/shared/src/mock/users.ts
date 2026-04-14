import type { User, BuyerProfile } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-001',
    role: 'buyer',
    email: null,
    phone: '+86-138-0000-1001',
    name: '리리',
    locale: 'zh-CN',
    avatarUrl: null,
    referralCode: null,
    referredBy: 'u-003',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'u-002',
    role: 'buyer',
    email: 'mei@example.com',
    phone: '+86-139-0000-2002',
    name: '메이',
    locale: 'zh-CN',
    avatarUrl: null,
    referralCode: null,
    referredBy: null,
    createdAt: '2026-03-20T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 'u-003',
    role: 'referrer',
    email: 'wang.md@example.com',
    phone: '+86-136-0000-3003',
    name: '왕 MD',
    locale: 'zh-CN',
    avatarUrl: null,
    referralCode: 'WANG2026',
    referredBy: null,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
];

export const MOCK_BUYER_PROFILES: BuyerProfile[] = [
  {
    userId: 'u-001',
    birthYear: 1998,
    gender: 'female',
    country: 'CN',
    city: '상하이',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    userId: 'u-002',
    birthYear: 1995,
    gender: 'female',
    country: 'CN',
    city: '베이징',
    createdAt: '2026-03-20T08:00:00Z',
  },
];
