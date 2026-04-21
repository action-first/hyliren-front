import type { User, BuyerProfile } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-001',
    role: 'buyer',
    email: 'test@test.com',
    phone: null,
    name: '테스트유저',
    locale: 'ko',
    avatarUrl: null,
    referralCode: null,
    referredBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const MOCK_BUYER_PROFILES: BuyerProfile[] = [
  {
    userId: 'u-001',
    birthYear: null,
    gender: null,
    country: 'KR',
    city: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
