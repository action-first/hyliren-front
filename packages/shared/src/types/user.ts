import type { UserRole, Locale } from '../constants';

export interface User {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  name: string;
  locale: Locale;
  avatarUrl: string | null;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  userId: string;
  birthYear: number | null;
  gender: 'female' | 'male' | 'other' | null;
  country: string;
  city: string | null;
  createdAt: string;
}
